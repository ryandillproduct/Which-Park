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
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(opening)} – ${fmt(closing)}`;
}

async function fetchParkHours(themeParksId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.themeparks.wiki/v1/entity/${themeParksId}/schedule`);
    if (!res.ok) return null;
    const data = await res.json();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const operating = data.schedule?.find(
      (s: { date: string; type: string }) => s.date === today && s.type === 'OPERATING'
    ) as { openingTime: string; closingTime: string } | undefined;
    if (!operating) return null;
    return formatHours(operating.openingTime, operating.closingTime);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      PARKS.map(async (park): Promise<ScoredPark> => {
        const [allRides, hours] = await Promise.all([
          fetchParkRides(park.id),
          fetchParkHours(park.themeParksId),
        ]);
        const attractionConfig = ATTRACTIONS[park.id] ?? [];

        // Remove single rider lines entirely
        const withoutSingleRider = allRides.filter(
          (r) => !r.name.toLowerCase().includes('single rider')
        );

        // Match against curated list and tag shows; include closed rides (shown as "Down")
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

        // Only use open, non-show rides for scoring
        const ridesForScoring = curated.filter((r) => !r.isShow && r.is_open);
        const score = calculateParkScore(ridesForScoring, HEADLINERS[park.id] ?? []);

        return {
          ...park,
          score,
          label: scoreLabel(score),
          rides: curated,
          hours,
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
