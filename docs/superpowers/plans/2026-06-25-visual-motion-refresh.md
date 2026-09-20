# Visual & Motion Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual depth (shadows, gradient badges/bars, redrawn park icons) and app-wide motion (staggered entrance, glow, idle pulse, smooth expand/collapse, bounce-in modals/banners) to WhichPark? without changing layout, scoring logic, or data shapes.

**Architecture:** Pure CSS/Tailwind changes layered on top of the existing component structure. New `@keyframes` and utility classes live in `src/app/globals.css`; components opt in by adding class names and (for staggered entrance) a small inline `animationDelay`. No new dependencies, no new state beyond what already exists (`expanded` in `ParkCard`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Jest + React Testing Library (existing stack — nothing new added).

## Global Constraints

- No new npm dependencies — all motion is plain CSS `@keyframes` + Tailwind utility classes.
- Preserve the existing palette exactly: background `#FDF8F0`, gold accent `#F5C842`, text `#1C1008`, Playfair Display (headlines) + Inter (body).
- No changes to `src/app/api/parks/route.ts`, scoring logic (`src/lib/scoring.ts`), or any data shape in `src/types/index.ts`.
- No changes to copy/wording anywhere.
- All continuous/looping animations (icon idle pulse, #1 card glow) and all entrance animations (stagger-in, bounce-in) must be wrapped in `@media (prefers-reduced-motion: no-preference)` so users with that OS setting see the final state immediately with no animation.
- Closed/inactive park icons keep their existing muted treatment (lighter `currentColor`, e.g. `#DDD8D0`) with **no** gradient badge background — the open/closed visual distinction must remain.

---

### Task 1: Redraw Magic Kingdom & Animal Kingdom icons in `ParkSilhouette.tsx`

**Files:**
- Modify: `src/components/ParkSilhouette.tsx` (full file; only `MagicKingdomPath` and `AnimalKingdomPath` functions change — `EpcotPath` and `HollywoodStudiosPath` are untouched)
- Test: Create `src/__tests__/components/ParkSilhouette.test.tsx`

**Interfaces:**
- Consumes: nothing new — `ParkSilhouette`'s props (`parkKey`, `className`, `style`) are unchanged.
- Produces: same component signature `ParkSilhouette({ parkKey, className, style })`, used unchanged by `ParkCard` in Task 3.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ParkSilhouette.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { ParkSilhouette } from '@/components/ParkSilhouette';

describe('ParkSilhouette', () => {
  it('renders the Magic Kingdom castle with five turret bodies, a flag, and a ground line', () => {
    const { container } = render(<ParkSilhouette parkKey="magic-kingdom" />);
    // base block + 5 turret bodies + flag + ground line = 8 rects
    expect(container.querySelectorAll('rect').length).toBe(8);
  });

  it('renders the Animal Kingdom tree with a full seven-circle canopy', () => {
    const { container } = render(<ParkSilhouette parkKey="animal-kingdom" />);
    expect(container.querySelectorAll('circle').length).toBe(7);
  });

  it('still renders EPCOT and Hollywood Studios without throwing', () => {
    expect(() => render(<ParkSilhouette parkKey="epcot" />)).not.toThrow();
    expect(() => render(<ParkSilhouette parkKey="hollywood-studios" />)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/ParkSilhouette.test.tsx`
Expected: FAIL — the current Magic Kingdom path has 0 `rect` elements (it's a single complex `<path>`) and the current Animal Kingdom path has 0 `circle` elements, so the first two assertions fail.

- [ ] **Step 3: Replace `MagicKingdomPath` and `AnimalKingdomPath` in `src/components/ParkSilhouette.tsx`**

Replace the two functions (lines 25–30 and 69–82 in the current file) with:

```tsx
// Cinderella Castle silhouette — five spires of varying height, narrow conical
// roofs, flag on the tallest center spire, arched doorway in the base.
// Drawn at 0-64 scale and repositioned/rescaled into this file's 0-100x80
// viewBox via the wrapping transform (uniform scale 1.2, recentered on x=50).
function MagicKingdomPath() {
  return (
    <g transform="translate(50,2) scale(1.2) translate(-32,0)">
      <rect x="12" y="44" width="40" height="16" />
      <rect x="15" y="34" width="6" height="10" />
      <path d="M15 34 L18 24 L21 34Z" />
      <rect x="23" y="28" width="6" height="16" />
      <path d="M23 28 L26 16 L29 28Z" />
      <rect x="28" y="18" width="8" height="26" />
      <path d="M28 18 L32 2 L36 18Z" />
      <rect x="31" y="-1" width="2" height="4" />
      <rect x="35" y="28" width="6" height="16" />
      <path d="M35 28 L38 16 L41 28Z" />
      <rect x="43" y="34" width="6" height="10" />
      <path d="M43 34 L46 24 L49 34Z" />
      <path d="M27 50 Q27 44 32 44 Q37 44 37 50 L37 60 L27 60Z" fill="currentColor" opacity="0.4" />
      <rect x="10" y="60" width="44" height="3" rx="1" />
    </g>
  );
}
```

```tsx
// Tree of Life silhouette — full rounded canopy from seven overlapping
// circles at one even opacity (no opacity layering — that caused uneven
// dark blotches in review), sitting on a flared vase-shaped trunk/base.
// Same 0-64-to-viewBox transform as MagicKingdomPath.
function AnimalKingdomPath() {
  return (
    <g transform="translate(50,2) scale(1.2) translate(-32,0)">
      <circle cx="32" cy="17" r="18" />
      <circle cx="13" cy="23" r="12.5" />
      <circle cx="51" cy="23" r="12.5" />
      <circle cx="22" cy="9" r="10" />
      <circle cx="42" cy="9" r="10" />
      <circle cx="8" cy="29" r="6.5" />
      <circle cx="56" cy="29" r="6.5" />
      <path d="M27 34 L26 42 C24 50 19 55 13 58 L13 62 L51 62 L51 58 C45 55 40 50 38 42 L37 34 Z" />
    </g>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/components/ParkSilhouette.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ParkSilhouette.tsx src/__tests__/components/ParkSilhouette.test.tsx
git commit -m "Redraw Magic Kingdom castle and Animal Kingdom tree icons"
```

---

### Task 2: Add shared motion `@keyframes` and reduced-motion support to `globals.css`

**Files:**
- Modify: `src/app/globals.css`
- Test: Create `src/__tests__/styles/globals.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS classes consumed by Tasks 4–7: `.animate-card-stagger-in`, `.animate-glow-pulse`, `.animate-icon-pulse`, `.animate-bounce-in`, `.expand-grid` / `.expand-grid-open`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/styles/globals.test.ts`:

```ts
import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf-8');

describe('globals.css motion utilities', () => {
  it('defines the card stagger-in animation', () => {
    expect(css).toContain('@keyframes cardStaggerIn');
    expect(css).toContain('.animate-card-stagger-in');
  });

  it('defines the glow pulse animation', () => {
    expect(css).toContain('@keyframes glowPulse');
    expect(css).toContain('.animate-glow-pulse');
  });

  it('defines the icon pulse animation', () => {
    expect(css).toContain('@keyframes iconPulse');
    expect(css).toContain('.animate-icon-pulse');
  });

  it('defines the bounce-in animation', () => {
    expect(css).toContain('@keyframes bounceIn');
    expect(css).toContain('.animate-bounce-in');
  });

  it('defines the expand-grid utility for smooth expand/collapse', () => {
    expect(css).toContain('.expand-grid');
    expect(css).toContain('.expand-grid-open');
  });

  it('respects prefers-reduced-motion for the looping/entrance animations', () => {
    expect(css).toContain('prefers-reduced-motion: no-preference');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/styles/globals.test.ts`
Expected: FAIL — none of these strings exist in the current `globals.css`.

- [ ] **Step 3: Add the keyframes and utility classes**

Append to `src/app/globals.css` (after the existing `html, body { ... }` block):

```css

/* ===== Motion: card list entrance (staggered, used by ParkCard) ===== */
@keyframes cardStaggerIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  60% { opacity: 1; transform: translateY(-2px) scale(1.01); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-card-stagger-in {
  opacity: 1;
}
@media (prefers-reduced-motion: no-preference) {
  .animate-card-stagger-in {
    opacity: 0;
    animation: cardStaggerIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
}

/* ===== Motion: continuous glow pulse for the #1 ranked card ===== */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(28, 16, 8, 0.06); }
  50% { box-shadow: 0 4px 22px rgba(245, 200, 66, 0.55); }
}
@media (prefers-reduced-motion: no-preference) {
  .animate-glow-pulse {
    animation: glowPulse 1.8s ease-in-out infinite;
  }
}

/* ===== Motion: continuous icon idle pulse ===== */
@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@media (prefers-reduced-motion: no-preference) {
  .animate-icon-pulse {
    animation: iconPulse 2.2s ease-in-out infinite;
  }
}

/* ===== Motion: bounce-in entrance (modal, banner, about page) ===== */
@keyframes bounceIn {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  60% { opacity: 1; transform: scale(1.02) translateY(-2px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-bounce-in {
  opacity: 1;
}
@media (prefers-reduced-motion: no-preference) {
  .animate-bounce-in {
    opacity: 0;
    animation: bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
}

/* ===== Motion: smooth expand/collapse without JS height measurement ===== */
.expand-grid {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.expand-grid.expand-grid-open {
  grid-template-rows: 1fr;
}
.expand-grid > div {
  overflow: hidden;
  min-height: 0;
}
@media (prefers-reduced-motion: reduce) {
  .expand-grid {
    transition-duration: 0.01s;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/styles/globals.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/__tests__/styles/globals.test.ts
git commit -m "Add shared motion keyframes and reduced-motion support"
```

---

### Task 3: ParkCard visual depth & smooth expand/collapse — gradient badge, shadows, gradient Go Score bar

**Files:**
- Modify: `src/components/ParkCard.tsx` (full file shown below)
- Modify: `src/__tests__/components/ParkCard.test.tsx` (currently stale/broken — fixture is missing required `ScoredPark` fields and uses an old `isBest` prop that no longer exists; this task replaces the whole file)

**Interfaces:**
- Consumes: `ParkSilhouette` from Task 1 (unchanged signature), `RideList` (unchanged), `ScoredPark` type (unchanged).
- Produces: `ParkCard({ park, rank, headlinerNames })` — same signature as before. No other file imports from `ParkCard.tsx`, so nothing downstream is affected.

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `src/__tests__/components/ParkCard.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ParkCard } from '@/components/ParkCard';
import { ScoredPark } from '@/types';

const openPark: ScoredPark = {
  id: 6,
  name: 'Magic Kingdom',
  silhouetteKey: 'magic-kingdom',
  showtimesUrl: 'https://disneyworld.disney.go.com/entertainment/magic-kingdom/',
  themeParksId: '75ea578a-adc8-4116-a54d-dccb60765ef9',
  score: 4,
  label: 'Moderate crowds',
  rides: [
    { id: 1, name: 'Seven Dwarfs Mine Train', is_open: true, wait_time: 10, last_updated: '' },
  ],
  hours: '9 AM – 10 PM',
  isOpen: true,
  closingTimeMs: Date.now() + 5 * 60 * 60 * 1000,
  avgWaitMinutes: 20,
  goScore: 7,
  openAttractionCount: 12,
};

const closedPark: ScoredPark = {
  ...openPark,
  isOpen: false,
  hours: null,
  closingTimeMs: null,
  goScore: 0,
};

describe('ParkCard', () => {
  it('renders park name', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByText('Magic Kingdom')).toBeInTheDocument();
  });

  it('shows a gradient icon badge background when the park is open', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).toHaveClass('icon-badge-open');
  });

  it('does not show the gradient icon badge background when the park is closed', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).not.toHaveClass('icon-badge-open');
  });

  it('expands ride list wrapper on click', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('ride-list-wrapper')).not.toHaveClass('expand-grid-open');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('ride-list-wrapper')).toHaveClass('expand-grid-open');
  });

  it('collapses ride list wrapper on second click', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('ride-list-wrapper')).not.toHaveClass('expand-grid-open');
  });

  it('does not expand for closed parks', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('ride-list-wrapper')).not.toHaveClass('expand-grid-open');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: FAIL — `getByTestId('icon-badge')` and `getByTestId('ride-list-wrapper')` don't exist yet in the current component.

- [ ] **Step 3: Replace `src/components/ParkCard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { ScoredPark } from '@/types';
import { ParkSilhouette } from './ParkSilhouette';
import { RideList } from './RideList';

interface Props {
  park: ScoredPark;
  rank: number | null;
  headlinerNames: string[];
}

// Green → amber → red for goScore 10→5→0 (higher goScore = greener).
// Returns a two-stop gradient (light → dark of the same hue) plus a glow
// shadow color, instead of a single flat color.
function goScoreBarStyle(goScore: number): { gradient: string; glow: string } {
  const green = { r: 52, g: 211, b: 153 };
  const amber = { r: 251, g: 191, b: 36 };
  const red = { r: 251, g: 113, b: 133 };

  let r, g, b;
  if (goScore >= 5) {
    const t = (goScore - 5) / 5;
    r = Math.round(amber.r + t * (green.r - amber.r));
    g = Math.round(amber.g + t * (green.g - amber.g));
    b = Math.round(amber.b + t * (green.b - amber.b));
  } else {
    const t = goScore / 5;
    r = Math.round(red.r + t * (amber.r - red.r));
    g = Math.round(red.g + t * (amber.g - red.g));
    b = Math.round(red.b + t * (amber.b - red.b));
  }

  const dark = `rgb(${r},${g},${b})`;
  const light = `rgb(${Math.round(r + (255 - r) * 0.45)},${Math.round(g + (255 - g) * 0.45)},${Math.round(b + (255 - b) * 0.45)})`;
  return {
    gradient: `linear-gradient(90deg, ${light}, ${dark})`,
    glow: `0 0 12px rgba(${r},${g},${b},0.5)`,
  };
}

export function ParkCard({ park, rank, headlinerNames }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fillPercent = park.isOpen ? (park.goScore / 10) * 100 : 0;
  const { gradient: barGradient, glow: barGlow } = goScoreBarStyle(park.goScore);

  return (
    <div
      className="relative rounded-2xl bg-white overflow-hidden shadow-[0_4px_16px_rgba(28,16,8,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(28,16,8,0.1)] hover:-translate-y-0.5"
    >
      {rank !== null && (
        <div
          className="absolute top-2 left-2 w-6 h-6 rounded-full shadow-[0_2px_8px_rgba(232,169,58,0.5)] flex items-center justify-center z-10"
          style={{ background: 'linear-gradient(135deg, #F5C842, #E8A93A)' }}
        >
          <span className="text-xs font-bold text-[#1C1008] leading-none">{rank}</span>
        </div>
      )}
      <button
        onClick={() => park.isOpen && setExpanded((v) => !v)}
        className={`w-full text-left p-5 flex items-center gap-4 ${park.isOpen ? '' : 'cursor-default'}`}
        aria-expanded={expanded}
        aria-disabled={!park.isOpen}
      >
        <div
          data-testid="icon-badge"
          className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${park.isOpen ? 'icon-badge-open' : ''}`}
          style={park.isOpen ? { background: 'linear-gradient(135deg, #FBF0DC, #F0DCA8)' } : undefined}
        >
          <ParkSilhouette
            parkKey={park.silhouetteKey}
            className="w-8 h-8"
            style={{ color: park.isOpen ? '#B8842E' : '#DDD8D0' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className={`font-playfair text-lg font-semibold truncate ${park.isOpen ? 'text-[#1C1008]' : 'text-[#B5A898]'}`}>
              {park.name}
            </p>
          </div>
          {(park.hours || !park.isOpen) && (
            <p className="text-xs text-[#B5A898] mt-0.5">
              {park.isOpen ? park.hours : park.hours ? `Closed · ${park.hours}` : 'Closed'}
            </p>
          )}
          {park.isOpen && (
            <>
              <div className="mt-2 w-full h-1.5 rounded-full bg-[#EDE8E1] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${fillPercent}%`,
                    background: barGradient,
                    boxShadow: barGlow,
                    transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s ease',
                  }}
                />
              </div>
              <p className="text-xs text-[#B5A898] mt-1">Go Score · {(Math.round(park.goScore * 2) / 2).toFixed(1)}/10</p>
              {park.tiebreakerNote && (
                <p className="text-xs text-[#B5A898] mt-0.5 italic">{park.tiebreakerNote}</p>
              )}
            </>
          )}
        </div>
      </button>

      <div
        data-testid="ride-list-wrapper"
        className={`expand-grid ${expanded && park.isOpen ? 'expand-grid-open' : ''}`}
      >
        <div>
          <div className="px-5 pb-5">
            <div className="border-t border-black/[0.06] pt-4">
              {park.isOpen && park.avgWaitMinutes > 0 && (
                <p className="text-xs text-[#B5A898] mb-3">
                  <span className="font-semibold text-[#8B7355]">{park.avgWaitMinutes} min</span> avg wait across open attractions
                </p>
              )}
              <RideList rides={park.rides} headlinerNames={headlinerNames} showtimesUrl={park.showtimesUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ParkCard.tsx src/__tests__/components/ParkCard.test.tsx
git commit -m "Add gradient icon badge, card shadows, and gradient Go Score bar"
```

---

### Task 4: ParkCard motion — stagger entrance, #1 glow, icon idle pulse

**Files:**
- Modify: `src/components/ParkCard.tsx`
- Modify: `src/__tests__/components/ParkCard.test.tsx`

**Interfaces:**
- Consumes: `.animate-card-stagger-in`, `.animate-glow-pulse`, `.animate-icon-pulse` classes from Task 2.
- Produces: same `ParkCard` signature — no change.

- [ ] **Step 1: Write the failing tests**

Add these tests to the `describe('ParkCard', ...)` block in `src/__tests__/components/ParkCard.test.tsx` (after the existing tests, before the closing `});`):

```tsx
  it('applies the stagger entrance animation with a delay based on rank', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    const card = screen.getByTestId('park-card');
    expect(card).toHaveClass('animate-card-stagger-in');
    expect(card.style.animationDelay).toBe('0.12s');
  });

  it('applies the continuous glow pulse only to the #1 ranked card', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('park-card')).toHaveClass('animate-glow-pulse');
  });

  it('does not apply the glow pulse to a lower-ranked card', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    expect(screen.getByTestId('park-card')).not.toHaveClass('animate-glow-pulse');
  });

  it('applies the icon idle pulse when the park is open', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).toHaveClass('animate-icon-pulse');
  });

  it('does not apply the icon idle pulse when the park is closed', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).not.toHaveClass('animate-icon-pulse');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: FAIL — `getByTestId('park-card')` doesn't exist yet, and the badge has no `animate-icon-pulse` class yet.

- [ ] **Step 3: Update `src/components/ParkCard.tsx`**

Add a `data-testid="park-card"` and the stagger/glow classes to the outer `<div>`, and the icon pulse class to the icon badge. Replace the outer div's opening tag (currently, from Task 3):

```tsx
    <div
      className="relative rounded-2xl bg-white overflow-hidden shadow-[0_4px_16px_rgba(28,16,8,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(28,16,8,0.1)] hover:-translate-y-0.5"
    >
```

with:

```tsx
    <div
      data-testid="park-card"
      className={`relative rounded-2xl bg-white overflow-hidden shadow-[0_4px_16px_rgba(28,16,8,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(28,16,8,0.1)] hover:-translate-y-0.5 ${rank !== null ? 'animate-card-stagger-in' : ''} ${rank === 1 ? 'animate-glow-pulse' : ''}`}
      style={rank !== null ? { animationDelay: `${(rank - 1) * 0.12}s` } : undefined}
    >
```

And update the icon badge `<div>` (from Task 3) to add the pulse class:

```tsx
        <div
          data-testid="icon-badge"
          className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${park.isOpen ? 'icon-badge-open animate-icon-pulse' : ''}`}
          style={park.isOpen ? { background: 'linear-gradient(135deg, #FBF0DC, #F0DCA8)' } : undefined}
        >
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ParkCard.tsx src/__tests__/components/ParkCard.test.tsx
git commit -m "Add staggered card entrance, #1 glow pulse, and icon idle pulse"
```

---

### Task 5: RecommendedBanner bounce-in entrance

**Files:**
- Modify: `src/components/RecommendedBanner.tsx`
- Test: Create `src/__tests__/components/RecommendedBanner.test.tsx`

**Interfaces:**
- Consumes: `.animate-bounce-in` class from Task 2. `Recommendation` type (unchanged).
- Produces: same `RecommendedBanner({ recommendation })` signature — no change.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/RecommendedBanner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { RecommendedBanner } from '@/components/RecommendedBanner';
import { Recommendation } from '@/types';

const recommendation: Recommendation = {
  parkId: 6,
  parkName: 'Magic Kingdom',
  avgWaitMinutes: 20,
  crowdScore: 4,
  closingTimeMs: null,
  opener: 'Magic Kingdom is our top pick right now',
};

describe('RecommendedBanner', () => {
  it('applies the bounce-in entrance when showing a recommendation', () => {
    render(<RecommendedBanner recommendation={recommendation} />);
    expect(screen.getByTestId('recommended-banner')).toHaveClass('animate-bounce-in');
  });

  it('applies the bounce-in entrance on the all-parks-closed message', () => {
    render(<RecommendedBanner recommendation={null} />);
    expect(screen.getByTestId('recommended-banner')).toHaveClass('animate-bounce-in');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/RecommendedBanner.test.tsx`
Expected: FAIL — `getByTestId('recommended-banner')` doesn't exist yet.

- [ ] **Step 3: Update `src/components/RecommendedBanner.tsx`**

Change the `RecommendedBanner` function (lines 76–100 in the current file) to:

```tsx
export function RecommendedBanner({ recommendation }: Props) {
  if (!recommendation) {
    return (
      <div
        data-testid="recommended-banner"
        className="mb-6 px-5 py-4 rounded-2xl bg-[#F5EFE6] text-center animate-bounce-in"
      >
        <p className="text-[#B5A898] text-sm">
          All parks are closed right now. Check back once the parks reopen for live rankings.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="recommended-banner"
      className="mb-6 px-5 py-4 rounded-2xl bg-[#FDF3D6] border border-[#F5C842]/30 animate-bounce-in"
    >
      <p className="text-xs font-semibold text-[#8B6914] tracking-widest uppercase mb-1">
        🏆 Best Park to Visit Right Now
      </p>
      <p className="font-playfair text-2xl font-bold text-[#1C1008]">
        {recommendation.parkName}
      </p>
      <p className="mt-1 text-sm text-[#8B7355]">
        <SummaryText recommendation={recommendation} />
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/components/RecommendedBanner.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/RecommendedBanner.tsx src/__tests__/components/RecommendedBanner.test.tsx
git commit -m "Add bounce-in entrance to recommendation banner"
```

---

### Task 6: GoScoreInfoModal bounce-in entrance

**Files:**
- Modify: `src/components/GoScoreInfoModal.tsx`
- Test: Create `src/__tests__/components/GoScoreInfoModal.test.tsx`

**Interfaces:**
- Consumes: `.animate-bounce-in` class from Task 2.
- Produces: same `GoScoreInfoModal({ onClose })` signature — no change.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/GoScoreInfoModal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { GoScoreInfoModal } from '@/components/GoScoreInfoModal';

describe('GoScoreInfoModal', () => {
  it('applies the bounce-in entrance to the modal panel', () => {
    render(<GoScoreInfoModal onClose={() => {}} />);
    expect(screen.getByTestId('goscore-modal-panel')).toHaveClass('animate-bounce-in');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/GoScoreInfoModal.test.tsx`
Expected: FAIL — `getByTestId('goscore-modal-panel')` doesn't exist yet.

- [ ] **Step 3: Update `src/components/GoScoreInfoModal.tsx`**

Change the inner panel `<div>` (currently `<div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>`) to:

```tsx
      <div
        data-testid="goscore-modal-panel"
        className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-lg animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/components/GoScoreInfoModal.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/GoScoreInfoModal.tsx src/__tests__/components/GoScoreInfoModal.test.tsx
git commit -m "Add bounce-in entrance to Go Score info modal"
```

---

### Task 7: About page — matching shadow depth and bounce-in entrance

**Files:**
- Modify: `src/app/about/page.tsx`
- Test: Create `src/__tests__/app/about.test.tsx`

**Interfaces:**
- Consumes: `.animate-bounce-in` class from Task 2.
- Produces: same `About()` default export — no change.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/app/about.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import About from '@/app/about/page';

describe('About page', () => {
  it('applies a bounce-in entrance to the header block', () => {
    render(<About />);
    expect(screen.getByTestId('about-header')).toHaveClass('animate-bounce-in');
  });

  it('applies a soft shadow to the photo frame', () => {
    render(<About />);
    expect(screen.getByTestId('about-photo-frame')).toHaveClass('shadow-[0_8px_24px_rgba(28,16,8,0.12)]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/app/about.test.tsx`
Expected: FAIL — `getByTestId('about-header')` and `getByTestId('about-photo-frame')` don't exist yet.

- [ ] **Step 3: Update `src/app/about/page.tsx`**

Change the header block (lines 13–26 in the current file) to:

```tsx
      <div data-testid="about-header" className="flex flex-col items-center text-center mb-8 animate-bounce-in">
        <div
          data-testid="about-photo-frame"
          className="w-56 h-72 rounded-2xl overflow-hidden border-2 border-[#F5C842] mb-4 shadow-[0_8px_24px_rgba(28,16,8,0.12)]"
        >
          <Image
            src="/ryan-headshot.jpg"
            alt="Ryan, creator of WhichPark?"
            width={672}
            height={864}
            quality={90}
            className="w-full h-full object-cover object-[50%_30%]"
            priority
          />
        </div>
        <p className="font-playfair text-2xl font-bold text-[#1C1008]">Meet the Creator</p>
      </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/app/about.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/about/page.tsx src/__tests__/app/about.test.tsx
git commit -m "Add matching shadow depth and bounce-in entrance to About page"
```

---

### Task 8: Full verification pass

**Files:** none modified — verification only.

**Interfaces:** N/A.

- [ ] **Step 1: Run the full test suite**

Run: `npx jest`
Expected: All test files under `src/__tests__/components/ParkSilhouette.test.tsx`, `src/__tests__/styles/globals.test.ts`, `src/__tests__/components/ParkCard.test.tsx`, `src/__tests__/components/RecommendedBanner.test.tsx`, `src/__tests__/components/GoScoreInfoModal.test.tsx`, and `src/__tests__/app/about.test.tsx` PASS.

Note: `src/__tests__/components/RideList.test.tsx` and `src/__tests__/lib/queueTimes.test.ts` were already failing before this plan (pre-existing drift from earlier sessions, unrelated to any file this plan touches) — they are not in scope for this plan and should remain as a separately-flagged cleanup item.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript or lint errors.

- [ ] **Step 3: Manually verify in the dev server**

Run: `npm run dev`, open `http://localhost:3000`, and confirm:
- Park cards show the new filled castle/sphere/tower/tree icons inside gradient gold badges
- Cards stagger in on page load with a slight bounce
- The #1 ranked card has a soft pulsing glow
- Tapping a card smoothly expands/collapses the ride list (no instant snap)
- The Go Score info modal and recommendation banner bounce in
- Visit `/about` and confirm the photo frame has a soft shadow and the header bounces in on load
- In OS accessibility settings, enable "Reduce motion" and reload — confirm all of the above appear instantly with no animation

- [ ] **Step 4: Push**

```bash
git push origin main
```
