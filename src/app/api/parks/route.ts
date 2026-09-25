import { NextResponse } from 'next/server';
import { fetchParkRides } from '@/lib/queueTimes';
import { calculateParkScore, scoreLabel, headlinerWaitMinutes, isMeetAndGreet } from '@/lib/scoring';
import { PARKS } from '@/config/parks';
import { HEADLINERS } from '@/config/headliners';
import { ATTRACTIONS } from '@/config/attractions';
import { ScoredPark, Recommendation } from '@/types';

// Dynamic on purpose: open/closed state and time-based score adjustments are
// computed from Date.now(), so the response must be built per-request. With
// force-static + revalidate, Vercel served stale-while-revalidate — returning
// visitors got a cached payload with open/closed flags frozen at generation
// time (sometimes hours old). The upstream themeparks.wiki fetches carry
// their own 5-minute data cache instead.
export const dynamic = 'force-dynamic';

function formatHours(opening: string, closing: string): string {
  const fmt = (iso: string) => {
    // Parse time digits directly from the ISO string — avoids UTC conversion
    const [hStr, mStr] = iso.split('T')[1].slice(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(opening)} – ${fmt(closing)}`;
}

interface ScheduleEntry {
  date: string;
  type: string;
  openingTime: string;
  closingTime: string;
}

interface ParkSchedule {
  hours: string | null;
  isOpen: boolean;
  closingTimeMs: number | null;
}

async function fetchParkSchedule(themeParksId: string): Promise<ParkSchedule> {
  try {
    // Cached upstream like the live wait-time fetch; isOpen/closingTimeMs are
    // still derived from the current time on every request.
    const res = await fetch(`https://api.themeparks.wiki/v1/entity/${themeParksId}/schedule`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { hours: null, isOpen: false, closingTimeMs: null };
    const data = await res.json();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const operating = data.schedule?.find(
      (s: ScheduleEntry) => s.date === today && s.type === 'OPERATING'
    ) as ScheduleEntry | undefined;
    if (!operating) return { hours: null, isOpen: false, closingTimeMs: null };

    const nowMs = Date.now();
    const openMs = new Date(operating.openingTime).getTime();
    const closeMs = new Date(operating.closingTime).getTime();
    const isOpen = nowMs >= openMs && nowMs < closeMs;

    return {
      hours: formatHours(operating.openingTime, operating.closingTime),
      isOpen,
      closingTimeMs: isOpen ? closeMs : null,
    };
  } catch {
    return { hours: null, isOpen: false, closingTimeMs: null };
  }
}

// Theoretical range of recommendationScore, used to rescale the displayed Go Score
// to a full 0-10 spread.
// Min: crowdScore floor (1) + no time penalty = 1
// Max: crowdScore ceiling (10) + max time penalty (4) = 14
const RECOMMENDATION_SCORE_MIN = 1;
const RECOMMENDATION_SCORE_MAX = 14;

function recommendationScore(score: number, park: ScoredPark): number {
  let adjusted = score;

  // Time-until-close penalty — only meaningfully kicks in within the final hour
  const mins = park.closingTimeMs !== null ? Math.round((park.closingTimeMs - Date.now()) / 60000) : null;
  if (mins !== null && mins < 300) {
    if (mins >= 180)     adjusted += 0.5;
    else if (mins >= 60) adjusted += 1.5;
    else                 adjusted += 4;
  }

  return adjusted;
}

// Lower recommendationScore wins. Ties broken by: shorter headliner waits, then
// more open attractions, then alphabetical — guarantees a deterministic order.
// Headliner waits (not overall average) so the tiebreaker matches what the card's
// meters and tiebreaker note surface to the user.
function compareParks(a: ScoredPark, b: ScoredPark): number {
  const scoreDiff = recommendationScore(a.score, a) - recommendationScore(b.score, b);
  if (scoreDiff !== 0) return scoreDiff;

  const waitDiff = a.headlinerWaitMinutes - b.headlinerWaitMinutes;
  if (waitDiff !== 0) return waitDiff;

  const attractionDiff = b.openAttractionCount - a.openAttractionCount;
  if (attractionDiff !== 0) return attractionDiff;

  return a.name.localeCompare(b.name);
}

function computeGoScore(park: ScoredPark): number {
  if (!park.isOpen) return 0;
  const rawScore = recommendationScore(park.score, park);
  const normalized =
    10 * (RECOMMENDATION_SCORE_MAX - rawScore) / (RECOMMENDATION_SCORE_MAX - RECOMMENDATION_SCORE_MIN);
  return Math.max(0, Math.min(10, normalized));
}

// Matches the rounding used for display (ParkCard shows Go Score to the nearest 0.5).
function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

// Explains why `winner` ranks above `loser` whenever their *displayed* Go Score
// would otherwise look tied to a user, even if the underlying raw score differs.
function tiebreakerReason(
  winner: ScoredPark & { goScore: number },
  loser: ScoredPark & { goScore: number }
): { note: string; tie: { rival: string; reason: string } } | null {
  if (roundToHalf(winner.goScore) !== roundToHalf(loser.goScore)) {
    return null;
  }
  if (winner.headlinerWaitMinutes !== loser.headlinerWaitMinutes) {
    return {
      note: `Shorter headliner waits than ${loser.name}`,
      tie: { rival: loser.name, reason: 'shorter headliner waits' },
    };
  }
  if (winner.openAttractionCount !== loser.openAttractionCount) {
    return {
      note: `More open attractions than ${loser.name}`,
      tie: { rival: loser.name, reason: 'more open attractions' },
    };
  }
  return null;
}

function buildRecommendation(parks: ScoredPark[]): Recommendation | null {
  const eligible = parks.filter((p) => p.isOpen);
  if (eligible.length === 0) return null;

  const best = [...eligible].sort(compareParks)[0];

  const avg = best.avgWaitMinutes;
  const opener = `${best.name} is our top pick right now`;

  return {
    parkId: best.id,
    parkName: best.name,
    avgWaitMinutes: avg,
    crowdScore: best.score,
    closingTimeMs: best.closingTimeMs,
    opener,
  };
}

export async function GET() {
  try {
    const results = await Promise.all(
      PARKS.map(async (park): Promise<ScoredPark> => {
        const [allRides, { hours, isOpen, closingTimeMs }] = await Promise.all([
          fetchParkRides(park.themeParksId),
          fetchParkSchedule(park.themeParksId),
        ]);
        const attractionConfig = ATTRACTIONS[park.id] ?? [];

        const withoutSingleRider = allRides.filter(
          (r) => !r.name.toLowerCase().includes('single rider')
        );

        const staticAttractions = attractionConfig
          .filter((a) => a.static)
          .map((a, i) => ({
            id: -(i + 1),
            name: a.displayName ?? a.name,
            is_open: true,
            wait_time: 0,
            last_updated: '',
            isShow: a.isShow,
            isStatic: !a.isShow,
          }));

        const curated = [
          ...withoutSingleRider
            .map((r) => {
              const config = attractionConfig.find((a) =>
                !a.static && r.name.toLowerCase().includes(a.name.toLowerCase())
              );
              if (!config) return null;
              return {
                ...r,
                name: config.displayName ?? r.name,
                isShow: config.isShow,
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null),
          ...staticAttractions,
        ]
          .sort((a, b) => a.name.localeCompare(b.name))
          // Stable sort (guaranteed by the JS spec since ES2019) — this only
          // moves shows to the end, it doesn't disturb the alphabetical order
          // within the non-show group or within the show group.
          .sort((a, b) => (a.isShow ? 1 : 0) - (b.isShow ? 1 : 0));

        // Meet-and-greets are excluded from all scoring math and averages (they are
        // still rendered in the list — see RideList).
        const ridesForScoring = curated.filter(
          (r) => !r.isShow && !isMeetAndGreet(r.name) && r.is_open
        );
        const score = calculateParkScore(ridesForScoring, HEADLINERS[park.id] ?? []);
        const headlinerWait = headlinerWaitMinutes(ridesForScoring, HEADLINERS[park.id] ?? []);

        const openRides = ridesForScoring;
        const avgWaitMinutes = openRides.length > 0
          ? Math.round(openRides.reduce((sum, r) => sum + r.wait_time, 0) / openRides.length)
          : 0;

        return {
          ...park,
          score,
          label: scoreLabel(score),
          rides: curated,
          hours,
          isOpen,
          closingTimeMs,
          avgWaitMinutes,
          headlinerWaitMinutes: headlinerWait,
          openAttractionCount: openRides.length,
          goScore: 0, // placeholder — overwritten below after sorting
        };
      })
    );

    const sorted = [...results].sort((a, b) => {
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      return compareParks(a, b);
    });

    const withScores = sorted.map((park) => ({ ...park, goScore: computeGoScore(park) }));

    const withGoScore = withScores.map((park, i) => {
      const next = i < withScores.length - 1 ? withScores[i + 1] : null;
      const tb = park.isOpen && next?.isOpen ? tiebreakerReason(park, next) : null;

      return { ...park, tiebreakerNote: tb?.note, tie: tb?.tie };
    });

    const recommendation = buildRecommendation(withGoScore);

    return NextResponse.json({ parks: withGoScore, recommendation });
  } catch (err) {
    console.error('Failed to fetch park data:', err);
    return NextResponse.json({ error: 'Failed to load park data' }, { status: 502 });
  }
}
