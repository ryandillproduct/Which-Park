import { NextResponse } from 'next/server';
import { fetchParkRides } from '@/lib/queueTimes';
import { calculateParkScore, scoreLabel } from '@/lib/scoring';
import { PARKS } from '@/config/parks';
import { HEADLINERS } from '@/config/headliners';
import { ATTRACTIONS } from '@/config/attractions';
import { ScoredPark } from '@/types';

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

interface ScheduleEntry {
  date: string;
  type: string;
  openingTime: string;
  closingTime: string;
}

interface ParkSchedule {
  hours: string | null;
  isOpen: boolean;
}

async function fetchParkSchedule(themeParksId: string): Promise<ParkSchedule> {
  try {
    const res = await fetch(`https://api.themeparks.wiki/v1/entity/${themeParksId}/schedule`);
    if (!res.ok) return { hours: null, isOpen: false };
    const data = await res.json();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const operating = data.schedule?.find(
      (s: ScheduleEntry) => s.date === today && s.type === 'OPERATING'
    ) as ScheduleEntry | undefined;
    if (!operating) return { hours: null, isOpen: false };

    const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nowMs = new Date(nowET).getTime();
    const openMs = new Date(operating.openingTime).getTime();
    const closeMs = new Date(operating.closingTime).getTime();

    return {
      hours: formatHours(operating.openingTime, operating.closingTime),
      isOpen: nowMs >= openMs && nowMs < closeMs,
    };
  } catch {
    return { hours: null, isOpen: false };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      PARKS.map(async (park): Promise<ScoredPark> => {
        const [allRides, { hours, isOpen }] = await Promise.all([
          fetchParkRides(park.id),
          fetchParkSchedule(park.themeParksId),
        ]);
        const attractionConfig = ATTRACTIONS[park.id] ?? [];

        const withoutSingleRider = allRides.filter(
          (r) => !r.name.toLowerCase().includes('single rider')
        );

        const curated = withoutSingleRider
          .map((r) => {
            const config = attractionConfig.find((a) =>
              r.name.toLowerCase().includes(a.name.toLowerCase())
            );
            if (!config) return null;
            return { ...r, isShow: config.isShow };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .sort((a, b) => a.name.localeCompare(b.name));

        const ridesForScoring = curated.filter((r) => !r.isShow && r.is_open);
        const score = calculateParkScore(ridesForScoring, HEADLINERS[park.id] ?? []);

        return {
          ...park,
          score,
          label: scoreLabel(score),
          rides: curated,
          hours,
          isOpen,
        };
      })
    );

    const sorted = [...results].sort((a, b) => a.score - b.score);
    return NextResponse.json({ parks: sorted });
  } catch (err) {
    console.error('Failed to fetch park data:', err);
    return NextResponse.json({ error: 'Failed to load park data' }, { status: 502 });
  }
}
