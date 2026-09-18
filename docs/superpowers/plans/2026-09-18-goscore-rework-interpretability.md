# Go Score Rework & Interpretability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make park rankings intuitive by removing the hidden Hollywood Studios show boost, excluding character meet-and-greets from scoring, recalibrating the crowd score for resolution, and adding an on-tap "Go Score factors" block (favorability meters + factor pills) so each card's rank is visible without fragile prose.

**Architecture:** Model changes live in `scoring.ts` (pure helpers) and `route.ts` (assembly). A new pure `GoScoreFactors` component renders the meters/pills from plain props. `ParkCard` wires it into the expanded state, drops the misleading avg-wait line, and reworks the #1 card's strip. `page.tsx` gets a one-line copy change.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Jest 30 + React Testing Library.

## Global Constraints

- No new dependencies.
- One rule across the whole product: **fuller + greener meter = better**, correlating 1:1 with the Go Score bar. Meters are qualitative (no raw numbers on them).
- Meet-and-greet detection: `name.toLowerCase().startsWith('meet ')`.
- Meter bands: **Headliner waits** ≤20 Short / 21–45 Moderate / ≥46 Long. **Crowd level** ≤3 Light / 4–6 Moderate / ≥7 Heavy. **Time to enjoy** ≥300 Plenty / 60–299 Limited / <60 Closing soon (minutes).
- Meter colors: green `linear-gradient(90deg,#9BE0B4,#34D399)`, amber `linear-gradient(90deg,#F6D97A,#E3B23C)`, red `linear-gradient(90deg,#F3A8B4,#E36074)`. Fill: favorable 85%, middle 52%, unfavorable 22%.
- Factor pills: plain muted (`bg-[#F0EBE3] text-[#6B5B44]`, rounded-full), no emoji/icon, under an "Also factored in" sub-label. Today only Magic Kingdom (id 6) → "No direct parking".
- "Go Score factors" is the static, neutral section header — never evaluative ("why it scores lower").
- Keep the MK friction penalty and the time-until-close penalty in the score; keep `avgWaitMinutes`/`openAttractionCount` computed for tiebreaking (only their *display* is removed).
- Lower-ranked cards keep their existing italic tiebreaker note unchanged (out of scope).

---

### Task 1: Model layer — remove show boost, exclude meet-and-greets, recalibrate, expose headliner wait

**Files:**
- Modify: `src/types/index.ts` (add one field to `ScoredPark`)
- Modify: `src/lib/scoring.ts`
- Modify: `src/app/api/parks/route.ts`
- Modify: `src/__tests__/lib/scoring.test.ts`

**Interfaces:**
- Produces: `isMeetAndGreet(name: string): boolean` and `headlinerWaitMinutes(rides: Ride[], headlinerNames: string[]): number` exported from `scoring.ts`; `ScoredPark.headlinerWaitMinutes: number` for the client.

- [ ] **Step 1: Write/adjust the failing tests**

In `src/__tests__/lib/scoring.test.ts`, update the fallback test (the `/60` recalibration changes its expected value) and add new tests. Replace the existing `'falls back to all-ride average when no headliners are open'` test with:

```ts
  it('falls back to all-ride average when no headliners are open', () => {
    const rides = [
      makeRide('Random Ride A', 10),
      makeRide('Random Ride B', 20),
    ];
    // avg = 15, normalizedHeadliner = 15/60 = 0.25, congestion = 0/2 = 0
    // blended = 0.7 * 0.25 + 0.3 * 0 = 0.175 → round(0.175*9+1) = round(2.575) = 3
    expect(calculateParkScore(rides, headliners)).toBe(3);
  });
```

Add a new `describe` block at the end of the file:

```ts
describe('isMeetAndGreet', () => {
  it('flags character meet-and-greets', () => {
    expect(isMeetAndGreet('Meet Mickey at Town Square Theater')).toBe(true);
    expect(isMeetAndGreet('Meet Cinderella and Tiana')).toBe(true);
  });
  it('does not flag rides', () => {
    expect(isMeetAndGreet('Space Mountain')).toBe(false);
    expect(isMeetAndGreet('Meets End Coaster')).toBe(false); // no trailing space after "meet"
  });
});

describe('headlinerWaitMinutes', () => {
  const names = ['Space Mountain', 'Seven Dwarfs Mine Train'];
  it('averages open headliner waits', () => {
    const rides = [
      makeRide('Space Mountain', 40),
      makeRide('Seven Dwarfs Mine Train', 20),
      makeRide('Small Ride', 5),
    ];
    expect(headlinerWaitMinutes(rides, names)).toBe(30);
  });
  it('falls back to all open rides when no headliners are open', () => {
    const rides = [makeRide('Small Ride A', 10), makeRide('Small Ride B', 20)];
    expect(headlinerWaitMinutes(rides, names)).toBe(15);
  });
  it('returns 0 when nothing is open', () => {
    expect(headlinerWaitMinutes([makeRide('Space Mountain', 40, false)], names)).toBe(0);
  });
});

describe('calculateParkScore resolution', () => {
  it('scores a short-wait park meaningfully lower than a long-wait park', () => {
    const short = [makeRide('Space Mountain', 15), makeRide('Seven Dwarfs Mine Train', 20)];
    const long = [makeRide('Space Mountain', 55), makeRide('Seven Dwarfs Mine Train', 50)];
    expect(calculateParkScore(long, headliners) - calculateParkScore(short, headliners)).toBeGreaterThanOrEqual(2);
  });
});
```

Update the import line at the top of the test file:

```ts
import { calculateParkScore, scoreLabel, scoreColorClass, isMeetAndGreet, headlinerWaitMinutes } from '@/lib/scoring';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/lib/scoring.test.ts`
Expected: FAIL — `isMeetAndGreet`/`headlinerWaitMinutes` not exported yet, and the fallback test still expects the old `/90` value.

- [ ] **Step 3: Update `src/lib/scoring.ts`**

Replace the whole file with:

```ts
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
```

- [ ] **Step 4: Update `src/types/index.ts`**

Add `headlinerWaitMinutes` to `ScoredPark` (right after the existing `avgWaitMinutes` line):

```ts
  avgWaitMinutes: number;
  headlinerWaitMinutes: number;
  goScore: number;
```

- [ ] **Step 5: Update `src/app/api/parks/route.ts`**

(a) Update the import from scoring to include the new helpers:

```ts
import { calculateParkScore, scoreLabel, headlinerWaitMinutes, isMeetAndGreet } from '@/lib/scoring';
```

(b) Change `RECOMMENDATION_SCORE_MIN` and its comment (near the top constants):

```ts
// Theoretical range of recommendationScore, used to rescale the displayed Go Score
// to a full 0-10 spread.
// Min: crowdScore floor (1) + no time penalty = 1
// Max: crowdScore ceiling (10) + max time penalty (4) + MK's +1.5 penalty = 15.5
const RECOMMENDATION_SCORE_MIN = 1;
const RECOMMENDATION_SCORE_MAX = 15.5;
```

(c) Delete the Hollywood Studios show-boost block inside `recommendationScore()` entirely (the `// Hollywood Studios show-value boost before 5 PM Eastern` comment and its `if (park.id === 7) { ... }` block).

(d) In the park-assembly map, change the two filters and add the headliner-wait field. Replace this block:

```ts
        const ridesForScoring = curated.filter((r) => !r.isShow && r.is_open);
        const score = calculateParkScore(ridesForScoring, HEADLINERS[park.id] ?? []);

        const openRides = curated.filter((r) => !r.isShow && r.is_open);
        const avgWaitMinutes = openRides.length > 0
          ? Math.round(openRides.reduce((sum, r) => sum + r.wait_time, 0) / openRides.length)
          : 0;
```

with:

```ts
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
```

(e) Add `headlinerWaitMinutes` to the returned object (right after `avgWaitMinutes,`):

```ts
          avgWaitMinutes,
          headlinerWaitMinutes: headlinerWait,
          openAttractionCount: openRides.length,
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest src/__tests__/lib/scoring.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/lib/scoring.ts src/app/api/parks/route.ts src/__tests__/lib/scoring.test.ts
git commit -m "Remove show boost, exclude meet-and-greets, recalibrate crowd score, expose headliner wait

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: GoScoreFactors component (meters + pills)

**Files:**
- Create: `src/components/GoScoreFactors.tsx`
- Create: `src/__tests__/components/GoScoreFactors.test.tsx`

**Interfaces:**
- Produces: `GoScoreFactors({ headlinerWaitMinutes, crowdScore, minutesUntilClose, parkId })` — a pure component. Consumed by `ParkCard` (Task 3).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/GoScoreFactors.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { GoScoreFactors } from '@/components/GoScoreFactors';

describe('GoScoreFactors', () => {
  it('renders the three factor meters under the neutral header', () => {
    render(<GoScoreFactors headlinerWaitMinutes={15} crowdScore={3} minutesUntilClose={400} parkId={5} />);
    expect(screen.getByText('Go Score factors')).toBeInTheDocument();
    expect(screen.getByText('Headliner waits')).toBeInTheDocument();
    expect(screen.getByText('Crowd level')).toBeInTheDocument();
    expect(screen.getByText('Time to enjoy')).toBeInTheDocument();
  });

  it('labels favorable conditions as Short / Light / Plenty', () => {
    render(<GoScoreFactors headlinerWaitMinutes={15} crowdScore={3} minutesUntilClose={400} parkId={5} />);
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Plenty')).toBeInTheDocument();
  });

  it('labels unfavorable conditions as Long / Heavy / Closing soon', () => {
    render(<GoScoreFactors headlinerWaitMinutes={55} crowdScore={8} minutesUntilClose={30} parkId={5} />);
    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Heavy')).toBeInTheDocument();
    expect(screen.getByText('Closing soon')).toBeInTheDocument();
  });

  it('labels middle conditions as Moderate / Moderate / Limited', () => {
    render(<GoScoreFactors headlinerWaitMinutes={35} crowdScore={5} minutesUntilClose={120} parkId={5} />);
    expect(screen.getAllByText('Moderate').length).toBe(2);
    expect(screen.getByText('Limited')).toBeInTheDocument();
  });

  it('shows the No direct parking pill for Magic Kingdom only', () => {
    const { rerender } = render(
      <GoScoreFactors headlinerWaitMinutes={20} crowdScore={4} minutesUntilClose={400} parkId={6} />
    );
    expect(screen.getByText('No direct parking')).toBeInTheDocument();
    expect(screen.getByText('Also factored in')).toBeInTheDocument();
    rerender(<GoScoreFactors headlinerWaitMinutes={20} crowdScore={4} minutesUntilClose={400} parkId={5} />);
    expect(screen.queryByText('No direct parking')).not.toBeInTheDocument();
    expect(screen.queryByText('Also factored in')).not.toBeInTheDocument();
  });

  it('gives a favorable meter a fuller bar than an unfavorable one', () => {
    render(<GoScoreFactors headlinerWaitMinutes={15} crowdScore={8} minutesUntilClose={400} parkId={5} />);
    const waits = screen.getByTestId('meter-fill-waits');
    const crowd = screen.getByTestId('meter-fill-crowd');
    expect(parseInt(waits.style.width)).toBeGreaterThan(parseInt(crowd.style.width));
  });

  it('omits the time meter when the closing time is unknown', () => {
    render(<GoScoreFactors headlinerWaitMinutes={20} crowdScore={4} minutesUntilClose={null} parkId={5} />);
    expect(screen.queryByText('Time to enjoy')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/components/GoScoreFactors.test.tsx`
Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Create `src/components/GoScoreFactors.tsx`**

```tsx
interface Props {
  headlinerWaitMinutes: number;
  crowdScore: number;
  minutesUntilClose: number | null;
  parkId: number;
}

type Tone = 'good' | 'mid' | 'bad';

const GRADIENT: Record<Tone, string> = {
  good: 'linear-gradient(90deg, #9BE0B4, #34D399)',
  mid: 'linear-gradient(90deg, #F6D97A, #E3B23C)',
  bad: 'linear-gradient(90deg, #F3A8B4, #E36074)',
};
const FILL: Record<Tone, number> = { good: 85, mid: 52, bad: 22 };

function waitBand(mins: number): { label: string; tone: Tone } {
  if (mins <= 20) return { label: 'Short', tone: 'good' };
  if (mins <= 45) return { label: 'Moderate', tone: 'mid' };
  return { label: 'Long', tone: 'bad' };
}
function crowdBand(score: number): { label: string; tone: Tone } {
  if (score <= 3) return { label: 'Light', tone: 'good' };
  if (score <= 6) return { label: 'Moderate', tone: 'mid' };
  return { label: 'Heavy', tone: 'bad' };
}
function timeBand(mins: number): { label: string; tone: Tone } {
  if (mins >= 300) return { label: 'Plenty', tone: 'good' };
  if (mins >= 60) return { label: 'Limited', tone: 'mid' };
  return { label: 'Closing soon', tone: 'bad' };
}

// Additional score factors that aren't meters. Today only MK's parking friction.
function factorPills(parkId: number): string[] {
  return parkId === 6 ? ['No direct parking'] : [];
}

function Meter({ label, value, tone, testid }: { label: string; value: string; tone: Tone; testid: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#8B7355]">{label}</span>
        <span className="text-[#1C1008] font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#EDE8E1] overflow-hidden">
        <div
          data-testid={testid}
          className="h-full rounded-full"
          style={{ width: `${FILL[tone]}%`, background: GRADIENT[tone] }}
        />
      </div>
    </div>
  );
}

export function GoScoreFactors({ headlinerWaitMinutes, crowdScore, minutesUntilClose, parkId }: Props) {
  const waits = waitBand(headlinerWaitMinutes);
  const crowd = crowdBand(crowdScore);
  const time = minutesUntilClose !== null ? timeBand(minutesUntilClose) : null;
  const pills = factorPills(parkId);

  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold tracking-wider uppercase text-[#B5A898] mb-3">Go Score factors</p>
      <Meter label="Headliner waits" value={waits.label} tone={waits.tone} testid="meter-fill-waits" />
      <Meter label="Crowd level" value={crowd.label} tone={crowd.tone} testid="meter-fill-crowd" />
      {time && <Meter label="Time to enjoy" value={time.label} tone={time.tone} testid="meter-fill-time" />}
      {pills.length > 0 && (
        <>
          <p className="text-[10px] font-bold tracking-wider uppercase text-[#B5A898] mt-3 mb-2">Also factored in</p>
          <div className="flex flex-wrap gap-2">
            {pills.map((p) => (
              <span key={p} className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F0EBE3] text-[#6B5B44]">
                {p}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/components/GoScoreFactors.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/GoScoreFactors.tsx src/__tests__/components/GoScoreFactors.test.tsx
git commit -m "Add GoScoreFactors component: favorability meters and factor pills

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire factors into ParkCard, drop the avg-wait line, rework the top strip

**Files:**
- Modify: `src/components/ParkCard.tsx`
- Modify: `src/__tests__/components/ParkCard.test.tsx`

**Interfaces:**
- Consumes: `GoScoreFactors` from Task 2, `ScoredPark.headlinerWaitMinutes` from Task 1.
- Produces: `ParkCard({ park, rank, headlinerNames })` — unchanged signature.

- [ ] **Step 1: Update the test file**

In `src/__tests__/components/ParkCard.test.tsx`, add `headlinerWaitMinutes: 20,` to the `openPark` fixture (right after its `avgWaitMinutes: 20,` line). Then replace the existing top-pick-strip content test and the avg-wait/legend expectations with these (and add factor-block tests). Specifically:

Replace the test `'renders a top pick strip with avg wait, crowd score, and time framing for the #1 card'` with:

```tsx
  it('renders a top pick strip describing the park\'s own conditions for the #1 card', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    const strip = screen.getByTestId('top-pick-strip');
    expect(strip).toHaveTextContent('Top pick right now');
    // openPark: headliner wait 20 (Short), crowd 4 (Moderate) → leads with short waits
    expect(strip).toHaveTextContent(/short waits/i);
  });
```

Delete the tests `'shows the imminent-closing time framing when under 60 minutes remain'`, `'folds an average-wait tiebreaker reason into the top pick strip instead of a separate note'`, and `'folds an open-attractions tiebreaker reason into the top pick strip using the right wording'` (the top strip no longer does time framing or tiebreaker folding). Keep `'does not render the top pick strip for lower-ranked cards'` and `'renders the standalone tiebreaker note for non-#1 cards as before'`.

Replace the test `'shows the headliner legend next to the avg wait line'` with:

```tsx
  it('shows the Go Score factors block and headliner legend when expanded (open park)', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    expect(screen.getByText('Go Score factors')).toBeInTheDocument();
    expect(screen.getByText(/Headliner attraction/)).toBeInTheDocument();
  });

  it('no longer shows the "avg wait across open attractions" line', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    expect(screen.queryByText(/avg wait across open attractions/)).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: FAIL — "Go Score factors" not rendered, avg-wait line still present, top strip still uses old wording.

- [ ] **Step 3: Update `src/components/ParkCard.tsx`**

(a) Add the import:

```tsx
import { GoScoreFactors } from './GoScoreFactors';
```

(b) Replace the whole `TopPickStrip` component and its helper `timeFramingSentence`/`parseTiebreakerNote` usage **for the strip** with a conditions-based strip. Replace the existing `TopPickStrip` function with:

```tsx
// The #1 card's always-visible strip: names the park's own most favorable
// conditions (no cross-park comparison, so it is always reliable).
function topPickReason(headlinerWaitMinutes: number, crowdScore: number): string {
  const parts: string[] = [];
  if (headlinerWaitMinutes <= 20) parts.push('short waits');
  if (crowdScore <= 3) parts.push('light crowds');
  if (parts.length === 0) return 'the best conditions of the open parks';
  return parts.join(' and ');
}

function TopPickStrip({ park }: { park: ScoredPark }) {
  return (
    <div data-testid="top-pick-strip" className="mt-2 rounded-lg bg-[#FDF3D6] px-2.5 py-2">
      <p className="text-[11px] leading-snug text-[#1C1008]">
        <span className="font-bold text-[#8B6914]">Top pick right now —</span>{' '}
        {topPickReason(park.headlinerWaitMinutes, park.score)}.
      </p>
    </div>
  );
}
```

Leave `parseTiebreakerNote`, `formatTimeUntilClose`, `useLiveMinutesUntilClose`, and `timeFramingSentence` in the file if still referenced; `useLiveMinutesUntilClose` is still used (Step 3d). If `parseTiebreakerNote`, `formatTimeUntilClose`, or `timeFramingSentence` become unused after this task, delete them to avoid dead code (the reviewer will check).

(c) Compute live minutes near the top of the `ParkCard` component body (so it can be passed to the factors block). Just after `const { gradient: barGradient, glow: barGlow } = goScoreBarStyle(park.goScore);` add:

```tsx
  const minutesUntilClose = useLiveMinutesUntilClose(park.closingTimeMs);
```

(d) In the expanded region, replace the avg-wait paragraph block:

```tsx
              {park.isOpen && park.avgWaitMinutes > 0 && (
                <p className="text-xs text-[#B5A898] mb-3">
                  <span className="font-semibold text-[#8B7355]">{park.avgWaitMinutes} min</span> avg wait across open attractions
                  {' '}· <span className="text-[#E8A93A]">★</span> Headliner attraction
                </p>
              )}
```

with:

```tsx
              {park.isOpen && (
                <GoScoreFactors
                  headlinerWaitMinutes={park.headlinerWaitMinutes}
                  crowdScore={park.score}
                  minutesUntilClose={minutesUntilClose}
                  parkId={park.id}
                />
              )}
              {park.isOpen && (
                <p className="text-xs text-[#B5A898] mb-3">
                  <span className="text-[#E8A93A]">★</span> Headliner attraction
                </p>
              )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ParkCard.tsx src/__tests__/components/ParkCard.test.tsx
git commit -m "Wire GoScoreFactors into ParkCard, drop avg-wait line, rework top strip

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: List-hint copy + full verification pass

**Files:**
- Modify: `src/app/page.tsx` (one line)

- [ ] **Step 1: Update the list hint in `src/app/page.tsx`**

Replace:

```tsx
                Tap a park to see attraction wait times
```

with:

```tsx
                Tap a park for wait times and why it ranks
```

- [ ] **Step 2: Run the full test suite**

Run: `npx jest`
Expected: All suites pass except the known pre-existing `src/__tests__/lib/queueTimes.test.ts` failures (out of scope).

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: succeeds, no TypeScript/lint errors.

- [ ] **Step 4: Manually verify in the dev server + validate recalibration on real data**

Run `npm run dev`, open `http://localhost:3000`, and confirm:
- Rankings look intuitive (a park with shorter headliner waits ranks above one with longer waits; Hollywood Studios is no longer boosted).
- Tap a card: the "Go Score factors" block shows three meters (fuller+greener = better, matching the Go Score bar direction), Magic Kingdom shows the "No direct parking" pill, and the old "avg wait across open attractions" line is gone.
- The #1 card's strip reads "Top pick right now — {conditions}".
- **Recalibration check:** hit `/api/parks` (e.g. `curl`) and confirm the crowd `score` values now spread across the range rather than all landing on 4. If they still cluster, note the observed values — the `/60` ceiling may need further tuning (this is the flagged validation point; adjust in `scoring.ts` and re-verify if needed).

- [ ] **Step 5: Commit and push**

```bash
git add src/app/page.tsx
git commit -m "Broaden list hint to mention ranking rationale

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```
