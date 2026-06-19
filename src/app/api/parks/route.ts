import { NextResponse } from 'next/server';
import { fetchParkRides } from '@/lib/queueTimes';
import { calculateParkScore, scoreLabel } from '@/lib/scoring';
import { PARKS } from '@/config/parks';
import { HEADLINERS } from '@/config/headliners';
import { ATTRACTIONS } from '@/config/attractions';
import { ScoredPark, Recommendation } from '@/types';

export const dynamic = 'force-static';
export const revalidate = 300;

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

function formatTimeUntilClose(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr ${mins} min`;
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
  minutesUntilClose: number | null;
}

async function fetchParkSchedule(themeParksId: string): Promise<ParkSchedule> {
  try {
    const res = await fetch(`https://api.themeparks.wiki/v1/entity/${themeParksId}/schedule`);
    if (!res.ok) return { hours: null, isOpen: false, minutesUntilClose: null };
    const data = await res.json();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const operating = data.schedule?.find(
      (s: ScheduleEntry) => s.date === today && s.type === 'OPERATING'
    ) as ScheduleEntry | undefined;
    if (!operating) return { hours: null, isOpen: false, minutesUntilClose: null };

    const nowMs = Date.now();
    const openMs = new Date(operating.openingTime).getTime();
    const closeMs = new Date(operating.closingTime).getTime();
    const isOpen = nowMs >= openMs && nowMs < closeMs;
    const minutesUntilClose = isOpen ? Math.round((closeMs - nowMs) / 60000) : null;

    return {
      hours: formatHours(operating.openingTime, operating.closingTime),
      isOpen,
      minutesUntilClose,
    };
  } catch {
    return { hours: null, isOpen: false, minutesUntilClose: null };
  }
}

// Park IDs: MK = 6, EPCOT = 5, Hollywood Studios = 7, Animal Kingdom = 8
function recommendationScore(score: number, park: ScoredPark): number {
  let adjusted = score;

  // Time-until-close penalty
  const mins = park.minutesUntilClose;
  if (mins !== null && mins < 300) {
    if (mins >= 180)     adjusted += 1;
    else if (mins >= 60) adjusted += 3;
    else                 adjusted += 6;
  }

  // MK transportation friction penalty — no direct parking for locals
  if (park.id === 6) adjusted += 2;

  // Hollywood Studios show-value boost before 5 PM Eastern
  if (park.id === 7) {
    const hourET = parseInt(
      new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }),
      10
    );
    if (hourET < 17) adjusted -= 1;
  }

  return adjusted;
}

function buildRecommendation(parks: ScoredPark[]): Recommendation | null {
  const eligible = parks.filter((p) => p.isOpen);
  if (eligible.length === 0) return null;

  const best = [...eligible].sort(
    (a, b) => recommendationScore(a.score, a) - recommendationScore(b.score, b)
  )[0];

  const avg = best.avgWaitMinutes;
  const mins = best.minutesUntilClose;

  // Check if MK is open with shorter waits but wasn't recommended due to friction penalty
  const mk = eligible.find((p) => p.id === 6);
  const mkHasShorterWaits = mk && best.id !== 6 && mk.avgWaitMinutes < avg;
  const mkNote = mkHasShorterWaits
    ? ` Magic Kingdom has shorter waits right now but requires extra transportation to reach.`
    : '';

  const opener = mkHasShorterWaits
    ? `${best.name} is the easiest park to get into right now`
    : `${best.name} has the lowest crowds right now`;

  let summary: string;
  if (mins !== null && mins < 60) {
    summary = `${opener}, with a ${avg} min average wait and only ~${formatTimeUntilClose(mins)} until close.${mkNote}`;
  } else if (mins !== null && mins < 300) {
    summary = `${opener}, with a ${avg} min average wait and about ${formatTimeUntilClose(mins)} until close.${mkNote}`;
  } else if (mins !== null) {
    summary = `${opener}, with a ${avg} min average wait and plenty of time left to enjoy the park.${mkNote}`;
  } else {
    summary = `${opener}, with a ${avg} min average wait.${mkNote}`;
  }

  return {
    parkId: best.id,
    parkName: best.name,
    avgWaitMinutes: avg,
    minutesUntilClose: mins,
    summary,
  };
}

export async function GET() {
  try {
    const results = await Promise.all(
      PARKS.map(async (park): Promise<ScoredPark> => {
        const [allRides, { hours, isOpen, minutesUntilClose }] = await Promise.all([
          fetchParkRides(park.id),
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
            isShow: true,
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
        ].sort((a, b) => a.name.localeCompare(b.name));

        const ridesForScoring = curated.filter((r) => !r.isShow && r.is_open);
        const score = calculateParkScore(ridesForScoring, HEADLINERS[park.id] ?? []);

        const openRides = curated.filter((r) => !r.isShow && r.is_open);
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
          minutesUntilClose,
          avgWaitMinutes,
        };
      })
    );

    const sorted = [...results].sort((a, b) => {
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      return a.score - b.score;
    });

    const recommendation = buildRecommendation(sorted);

    return NextResponse.json({ parks: sorted, recommendation });
  } catch (err) {
    console.error('Failed to fetch park data:', err);
    return NextResponse.json({ error: 'Failed to load park data' }, { status: 502 });
  }
}
