import { Ride } from '@/types';

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Character meet-and-greets come through the live feed as attractions with real
// waits ("Meet Mickey…"), but they are not rides — exclude them from scoring and
// from the displayed averages so they stop skewing the numbers.
export function isMeetAndGreet(name: string): boolean {
  return name.toLowerCase().startsWith('meet ');
}

function headlinerPool(rides: Ride[], headlinerNames: string[]): Ride[] {
  const open = rides.filter((r) => r.is_open);
  if (open.length === 0) return [];
  const headliners = open.filter((r) =>
    headlinerNames.some((h) => r.name.toLowerCase().includes(h.toLowerCase()))
  );
  return headliners.length > 0 ? headliners : open;
}

// Average wait of the open headliner rides (falls back to all open rides when no
// headliner is open). This is the number the "Headliner waits" meter is built on.
export function headlinerWaitMinutes(rides: Ride[], headlinerNames: string[]): number {
  const pool = headlinerPool(rides, headlinerNames);
  return pool.length === 0 ? 0 : Math.round(avg(pool.map((r) => r.wait_time)));
}

export function calculateParkScore(rides: Ride[], headlinerNames: string[]): number {
  const open = rides.filter((r) => r.is_open);
  if (open.length === 0) return 5;

  const headlinerAvg = avg(headlinerPool(rides, headlinerNames).map((r) => r.wait_time));
  const congestionRate = open.filter((r) => r.wait_time > 45).length / open.length;

  // Normalization ceiling lowered from 90 to 60 so typical headliner waits spread
  // across the 1-10 range instead of clustering at 4. Tunable — validate against
  // real data.
  const normalizedHeadliner = Math.min(headlinerAvg / 60, 1);
  const blended = 0.7 * normalizedHeadliner + 0.3 * congestionRate;
  return Math.max(1, Math.min(10, Math.round(blended * 9 + 1)));
}

export function scoreLabel(score: number): string {
  if (score <= 3) return 'Great time to visit';
  if (score <= 6) return 'Moderate crowds';
  return 'Very busy';
}

export function scoreColorClass(score: number): string {
  if (score <= 3) return 'text-emerald-400';
  if (score <= 6) return 'text-amber-400';
  return 'text-rose-400';
}
