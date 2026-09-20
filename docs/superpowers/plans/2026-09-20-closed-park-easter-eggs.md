# Closed-Park Easter Eggs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden, per-park animated flourish to each closed park card, triggered by tapping the card 3 times, with a build-up dot indicator, that resets to replay.

**Architecture:** A `useClosedParkEgg` hook owns the per-card tap-count and a monotonically increasing `playToken`. A `ParkEggEffect` dispatcher renders the correct effect sub-component (fireworks, rocket, searchlights+clapperboard, sleeping sloth) selected by `silhouetteKey`, remounted via React `key={playToken}` so each trigger replays cleanly. `ParkCard`'s closed branch wires the card's click to the hook and renders the effect overlay + dots. Effect CSS/keyframes live in `globals.css`, gated by `@media (prefers-reduced-motion: no-preference)` to match the existing convention.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Jest 30 + React Testing Library.

## Global Constraints

- No Disney IP — effects stay generic (fireworks, rocket, searchlights + generic clapperboard, sleeping sloth). Copy verbatim from the approved mock `.superpowers/brainstorm/2690-1789881967/content/easter-eggs-v3.html`.
- Motion only inside `@media (prefers-reduced-motion: no-preference)` blocks (existing project convention in `src/app/globals.css`).
- Eggs trigger only when `park.isOpen === false`. Open cards keep tap-to-expand behavior untouched.
- Per-card local state only; one card's taps never affect another.
- Effect overlays are `aria-hidden="true"` (decorative).
- Tap count to trigger: **3**. Build-up indicator shows `•` after tap 1, `••` after tap 2; clears and plays on tap 3; counter resets to 0 after triggering.
- Next.js here has breaking changes — read the relevant guide in `node_modules/next/dist/docs/` before writing framework code (per AGENTS.md). These are client components (`'use client'`).
- The approved mock `easter-eggs-v3.html` is the visual source of truth for geometry, colors, and keyframe timings.

---

### Task 1: Egg keyframes and effect CSS in globals.css

**Files:**
- Modify: `src/app/globals.css` (append a new "Closed-park Easter eggs" section at end of file)
- Test: `src/__tests__/styles/globals.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS classes used by Task 3 effect components — `egg-layer`, `egg-fw`, `egg-spark` (+ `--dx`/`--dy` custom props), `egg-rocket`, `egg-puff`, `egg-night`, `egg-beam`/`egg-beam1`/`egg-beam2`, `egg-clapper`, `egg-clap-top`, `egg-sloth`, `egg-zzz`. Keyframes: `eggSpark`, `eggLaunch`, `eggPuff`, `eggNightFade`, `eggSweepL`, `eggSweepR`, `eggClapperShow`, `eggSnap`, `eggSlothIn`, `eggZzz`.

- [ ] **Step 1: Add failing assertions to globals.test.ts**

Append this `describe` block to `src/__tests__/styles/globals.test.ts`:

```ts
describe('globals.css closed-park easter eggs', () => {
  it('defines the fireworks spark animation', () => {
    expect(css).toContain('@keyframes eggSpark');
    expect(css).toContain('.egg-spark');
  });
  it('defines the rocket launch animation', () => {
    expect(css).toContain('@keyframes eggLaunch');
    expect(css).toContain('.egg-rocket');
  });
  it('defines the searchlight night, sweep, and clapper snap animations', () => {
    expect(css).toContain('@keyframes eggNightFade');
    expect(css).toContain('@keyframes eggSweepL');
    expect(css).toContain('@keyframes eggSweepR');
    expect(css).toContain('@keyframes eggSnap');
    expect(css).toContain('.egg-clap-top');
  });
  it('defines the sleeping sloth animation', () => {
    expect(css).toContain('@keyframes eggSlothIn');
    expect(css).toContain('.egg-sloth');
  });
  it('gates egg motion behind prefers-reduced-motion: no-preference', () => {
    const eggSection = css.slice(css.indexOf('Closed-park Easter eggs'));
    expect(eggSection).toContain('prefers-reduced-motion: no-preference');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/styles/globals.test.ts`
Expected: FAIL — new assertions fail (`@keyframes eggSpark` not found, etc.).

- [ ] **Step 3: Append the egg CSS to globals.css**

Append to the END of `src/app/globals.css`. Base (non-animated) styles are unconditional; every `animation:` declaration is inside the `no-preference` media block.

```css
/* ── Closed-park Easter eggs ─────────────────────────────────────── */
.egg-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 5;
}

/* Magic Kingdom — fireworks */
.egg-spark {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0;
}

/* EPCOT — rocket */
.egg-rocket {
  position: absolute;
  left: -12%;
  bottom: 16px;
  width: 32px;
  height: 32px;
  opacity: 0;
}
.egg-puff {
  position: absolute;
  right: 4%;
  bottom: 20px;
  width: 16px;
  height: 9px;
  border-radius: 50%;
  background: rgba(190, 180, 160, 0.6);
  opacity: 0;
}

/* Hollywood Studios — searchlights + clapperboard */
.egg-night { position: absolute; inset: 0; background: #171122; opacity: 0; }
.egg-beam {
  position: absolute;
  bottom: -12px;
  width: 13px;
  height: 150%;
  background: linear-gradient(to top, rgba(255, 248, 215, 0.98), rgba(255, 248, 215, 0));
  border-radius: 50%;
  filter: blur(1.5px);
  transform-origin: bottom center;
  opacity: 0;
}
.egg-beam1 { left: 26%; }
.egg-beam2 { right: 26%; }
.egg-clapper {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 74px;
  height: auto;
  transform: translate(-50%, -50%);
  opacity: 0;
}
.egg-clap-top { transform-box: fill-box; transform-origin: left bottom; }

/* Animal Kingdom — sleeping sloth */
.egg-sloth { position: absolute; right: 14px; bottom: -70px; width: 64px; height: 64px; }
.egg-zzz {
  position: absolute;
  right: 6px;
  bottom: 56px;
  font-size: 14px;
  color: #8B7355;
  font-weight: 600;
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .egg-fw.egg-boom .egg-spark { animation: eggSpark 0.9s ease-out forwards; }
  .egg-rocket { animation: eggLaunch 1.6s ease-in forwards; }
  .egg-puff { animation: eggPuff 0.6s ease-out 0.95s; }
  .egg-night { animation: eggNightFade 1.9s ease-in-out; }
  .egg-beam1 { animation: eggSweepL 1.9s ease-in-out; }
  .egg-beam2 { animation: eggSweepR 1.9s ease-in-out; }
  .egg-clapper { animation: eggClapperShow 1.9s ease-in-out; }
  .egg-clap-top { animation: eggSnap 1.9s ease-in-out; }
  .egg-sloth { animation: eggSlothIn 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
  .egg-zzz { animation: eggZzz 2.4s ease-in-out 0.6s infinite; }
}

@keyframes eggSpark {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.3); }
}
@keyframes eggLaunch {
  0% { opacity: 0; left: -12%; bottom: 16px; transform: rotate(90deg); }
  8% { opacity: 1; }
  55% { left: 60%; bottom: 18px; transform: rotate(90deg); }
  70% { left: 74%; bottom: 26px; transform: rotate(48deg); }
  100% { opacity: 0; left: 104%; bottom: 124px; transform: rotate(32deg); }
}
@keyframes eggPuff {
  0% { opacity: 0.6; transform: scale(0.3); }
  100% { opacity: 0; transform: scale(2); }
}
@keyframes eggNightFade {
  0% { opacity: 0; } 22% { opacity: 0.62; } 78% { opacity: 0.62; } 100% { opacity: 0; }
}
@keyframes eggSweepL {
  0% { opacity: 0; transform: rotate(-40deg); }
  16% { opacity: 1; } 50% { transform: rotate(26deg); } 84% { opacity: 1; }
  100% { opacity: 0; transform: rotate(-40deg); }
}
@keyframes eggSweepR {
  0% { opacity: 0; transform: rotate(40deg); }
  16% { opacity: 1; } 50% { transform: rotate(-26deg); } 84% { opacity: 1; }
  100% { opacity: 0; transform: rotate(40deg); }
}
@keyframes eggClapperShow {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.82); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}
@keyframes eggSnap {
  0%, 24% { transform: rotate(-30deg); }
  39% { transform: rotate(0); }
  47% { transform: rotate(-7deg); }
  55% { transform: rotate(0); }
  100% { transform: rotate(0); }
}
@keyframes eggSlothIn { from { bottom: -70px; } to { bottom: 6px; } }
@keyframes eggZzz {
  0% { opacity: 0; transform: translateY(6px) scale(0.8); }
  40% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-14px) scale(1.1); }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/styles/globals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/__tests__/styles/globals.test.ts
git commit -m "feat: add closed-park easter egg keyframes and effect CSS"
```

---

### Task 2: useClosedParkEgg hook

**Files:**
- Create: `src/components/easter-eggs/useClosedParkEgg.ts`
- Test: `src/__tests__/components/useClosedParkEgg.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `useClosedParkEgg(): { dots: number; playToken: number; registerTap: () => void }`.
  - `dots` — current tap count in `[0, 2]`, for the build-up indicator.
  - `playToken` — starts at 0; increments by 1 each time the egg triggers (used as a React remount key so each play restarts).
  - `registerTap` — call on each card tap; on the 3rd tap it increments `playToken`, resets the internal count to 0, and schedules the count-visible reset.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/useClosedParkEgg.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useClosedParkEgg } from '@/components/easter-eggs/useClosedParkEgg';

describe('useClosedParkEgg', () => {
  it('shows build-up dots for the first two taps without playing', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    expect(result.current.dots).toBe(0);
    expect(result.current.playToken).toBe(0);
    act(() => result.current.registerTap());
    expect(result.current.dots).toBe(1);
    expect(result.current.playToken).toBe(0);
    act(() => result.current.registerTap());
    expect(result.current.dots).toBe(2);
    expect(result.current.playToken).toBe(0);
  });

  it('triggers on the third tap, resets dots, and increments playToken', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    act(() => result.current.registerTap());
    act(() => result.current.registerTap());
    act(() => result.current.registerTap());
    expect(result.current.playToken).toBe(1);
    expect(result.current.dots).toBe(0);
  });

  it('replays on a second full 3-tap cycle', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    for (let i = 0; i < 6; i++) act(() => result.current.registerTap());
    expect(result.current.playToken).toBe(2);
    expect(result.current.dots).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/components/useClosedParkEgg.test.tsx`
Expected: FAIL — module `@/components/easter-eggs/useClosedParkEgg` not found.

- [ ] **Step 3: Write the hook**

Create `src/components/easter-eggs/useClosedParkEgg.ts`:

```ts
import { useState, useCallback } from 'react';

const TAPS_TO_TRIGGER = 3;

export function useClosedParkEgg(): {
  dots: number;
  playToken: number;
  registerTap: () => void;
} {
  const [dots, setDots] = useState(0);
  const [playToken, setPlayToken] = useState(0);

  const registerTap = useCallback(() => {
    setDots((prev) => {
      const next = prev + 1;
      if (next >= TAPS_TO_TRIGGER) {
        setPlayToken((t) => t + 1);
        return 0;
      }
      return next;
    });
  }, []);

  return { dots, playToken, registerTap };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/components/useClosedParkEgg.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/easter-eggs/useClosedParkEgg.ts src/__tests__/components/useClosedParkEgg.test.tsx
git commit -m "feat: add useClosedParkEgg tap-count hook"
```

---

### Task 3: Effect components and ParkEggEffect dispatcher

**Files:**
- Create: `src/components/easter-eggs/ParkEggEffect.tsx`
- Test: `src/__tests__/components/ParkEggEffect.test.tsx`

**Interfaces:**
- Consumes: CSS classes and keyframes from Task 1.
- Produces: `ParkEggEffect({ silhouetteKey, playToken }: { silhouetteKey: ParkMeta['silhouetteKey']; playToken: number })`. Renders `null` when `playToken === 0`; otherwise renders the effect for `silhouetteKey`, remounted via `key={playToken}`. Root element carries `aria-hidden="true"` and `data-testid="egg-<silhouetteKey>"`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ParkEggEffect.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { ParkEggEffect } from '@/components/easter-eggs/ParkEggEffect';

describe('ParkEggEffect', () => {
  it('renders nothing before the first trigger', () => {
    const { container } = render(<ParkEggEffect silhouetteKey="epcot" playToken={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['magic-kingdom'],
    ['epcot'],
    ['hollywood-studios'],
    ['animal-kingdom'],
  ] as const)('renders the %s effect after triggering, aria-hidden', (key) => {
    render(<ParkEggEffect silhouetteKey={key} playToken={1} />);
    const layer = screen.getByTestId(`egg-${key}`);
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/components/ParkEggEffect.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the effect components and dispatcher**

Create `src/components/easter-eggs/ParkEggEffect.tsx`. Fireworks spawns particles in a `useEffect` (runs once on mount; the parent remounts via `key`). The other three are pure markup that animate on mount. SVG geometry and colors are copied verbatim from `easter-eggs-v3.html`.

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { ParkMeta } from '@/types';

const FW_COLORS = ['#F5C842', '#E8A93A', '#FBD46D', '#FF8A5B'];

function Fireworks() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    layer.innerHTML = '';
    for (let b = 0; b < 3; b++) {
      const cx = 20 + Math.random() * 60;
      const cy = 15 + Math.random() * 30;
      setTimeout(() => {
        if (!ref.current) return;
        for (let i = 0; i < 14; i++) {
          const s = document.createElement('span');
          s.className = 'egg-spark';
          const ang = (Math.PI * 2 * i) / 14;
          const dist = 26 + Math.random() * 14;
          s.style.left = `${cx}%`;
          s.style.top = `${cy}%`;
          s.style.background = FW_COLORS[i % FW_COLORS.length];
          s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
          s.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
          ref.current.appendChild(s);
        }
        ref.current.classList.remove('egg-boom');
        void ref.current.offsetWidth;
        ref.current.classList.add('egg-boom');
      }, b * 180);
    }
  }, []);
  return <div ref={ref} className="egg-layer egg-fw" data-testid="egg-magic-kingdom" aria-hidden="true" />;
}

function Rocket() {
  return (
    <div className="egg-layer" data-testid="egg-epcot" aria-hidden="true">
      <span className="egg-puff" />
      <svg className="egg-rocket" viewBox="0 0 24 24">
        <path d="M12 1 C15 5 16 10 16 14 L8 14 C8 10 9 5 12 1Z" fill="#ECE6DA" />
        <circle cx="12" cy="8" r="2.2" fill="#6FA8DC" />
        <path d="M8 12 L4 17.5 L8 15.5Z" fill="#E36074" />
        <path d="M16 12 L20 17.5 L16 15.5Z" fill="#E36074" />
        <path d="M9 15 L12 22 L15 15Z" fill="#F5A623" />
      </svg>
    </div>
  );
}

function Searchlights() {
  return (
    <div className="egg-layer" data-testid="egg-hollywood-studios" aria-hidden="true">
      <span className="egg-night" />
      <span className="egg-beam egg-beam1" />
      <span className="egg-beam egg-beam2" />
      <svg className="egg-clapper" viewBox="0 0 64 40">
        <rect x="6" y="16" width="52" height="22" rx="2" fill="#1c1c1c" stroke="#6a6a6a" strokeWidth="1" />
        <line x1="11" y1="25" x2="53" y2="25" stroke="#4a4a4a" strokeWidth="2" />
        <line x1="11" y1="31" x2="42" y2="31" stroke="#4a4a4a" strokeWidth="2" />
        <g className="egg-clap-top">
          <rect x="6" y="8" width="52" height="9" rx="1.5" fill="#1c1c1c" stroke="#6a6a6a" strokeWidth="1" />
          <polygon points="12,8 18,8 14,17 8,17" fill="#f2f2f2" />
          <polygon points="24,8 30,8 26,17 20,17" fill="#f2f2f2" />
          <polygon points="36,8 42,8 38,17 32,17" fill="#f2f2f2" />
          <polygon points="48,8 54,8 50,17 44,17" fill="#f2f2f2" />
        </g>
      </svg>
    </div>
  );
}

function SleepingSloth() {
  return (
    <div className="egg-layer" data-testid="egg-animal-kingdom" aria-hidden="true">
      <span className="egg-zzz">z z z</span>
      <svg className="egg-sloth" viewBox="0 0 64 64">
        <ellipse cx="32" cy="42" rx="17" ry="18" fill="#A89A82" />
        <circle cx="32" cy="24" r="14" fill="#BBAD93" />
        <ellipse cx="25" cy="24" rx="5.5" ry="7" fill="#8C7E67" />
        <ellipse cx="39" cy="24" rx="5.5" ry="7" fill="#8C7E67" />
        <path d="M22 25 q3 2 6 0" stroke="#4A4034" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M36 25 q3 2 6 0" stroke="#4A4034" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <ellipse cx="32" cy="29" rx="2.4" ry="1.8" fill="#5A4E3E" />
        <path d="M28 33 q4 3 8 0" stroke="#5A4E3E" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M17 40 q-6 6 -2 12" stroke="#8C7E67" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M47 40 q6 6 2 12" stroke="#8C7E67" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function EffectFor({ silhouetteKey }: { silhouetteKey: ParkMeta['silhouetteKey'] }) {
  switch (silhouetteKey) {
    case 'magic-kingdom':
      return <Fireworks />;
    case 'epcot':
      return <Rocket />;
    case 'hollywood-studios':
      return <Searchlights />;
    case 'animal-kingdom':
      return <SleepingSloth />;
  }
}

export function ParkEggEffect({
  silhouetteKey,
  playToken,
}: {
  silhouetteKey: ParkMeta['silhouetteKey'];
  playToken: number;
}) {
  if (playToken === 0) return null;
  return <EffectFor key={playToken} silhouetteKey={silhouetteKey} />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/components/ParkEggEffect.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/easter-eggs/ParkEggEffect.tsx src/__tests__/components/ParkEggEffect.test.tsx
git commit -m "feat: add per-park easter egg effect components"
```

---

### Task 4: Wire eggs into ParkCard's closed state

**Files:**
- Modify: `src/components/ParkCard.tsx`
- Test: `src/__tests__/components/ParkCard.test.tsx`

**Interfaces:**
- Consumes: `useClosedParkEgg` (Task 2), `ParkEggEffect` (Task 3).
- Produces: closed cards render `data-testid="egg-dots"` (build-up indicator) and mount `ParkEggEffect` on trigger; open cards unchanged.

- [ ] **Step 1: Write the failing tests**

Add to `src/__tests__/components/ParkCard.test.tsx` (the `closedPark` fixture already exists):

```tsx
  it('shows build-up dots after tapping a closed card once, without playing an effect', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('egg-dots')).toHaveTextContent('•');
    expect(screen.queryByTestId('egg-magic-kingdom')).not.toBeInTheDocument();
  });

  it('plays the park-specific egg after three taps on a closed card', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.getByTestId('egg-magic-kingdom')).toBeInTheDocument();
  });

  it('renders the EPCOT egg for an EPCOT closed card', () => {
    const epcotClosed = { ...closedPark, name: 'EPCOT', silhouetteKey: 'epcot' as const };
    render(<ParkCard park={epcotClosed} rank={null} headlinerNames={[]} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.getByTestId('egg-epcot')).toBeInTheDocument();
  });

  it('does not mount an egg on an open card, and does not show egg dots', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByTestId('egg-dots')).not.toBeInTheDocument();
    expect(screen.queryByTestId('egg-magic-kingdom')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: FAIL — `egg-dots` / `egg-magic-kingdom` not found; open-card test passes already.

- [ ] **Step 3: Wire the hook and effect into ParkCard**

In `src/components/ParkCard.tsx`:

Add imports near the top (after the existing component imports):

```tsx
import { useClosedParkEgg } from './easter-eggs/useClosedParkEgg';
import { ParkEggEffect } from './easter-eggs/ParkEggEffect';
```

Inside `ParkCard`, after the existing `const minutesUntilClose = ...` line, add:

```tsx
  const egg = useClosedParkEgg();
```

Change the header button's `onClick` (currently `onClick={() => park.isOpen && setExpanded((v) => !v)}`) to route closed taps to the egg:

```tsx
        onClick={() => (park.isOpen ? setExpanded((v) => !v) : egg.registerTap())}
```

Add the build-up dots indicator inside the closed branch. Replace the existing hours paragraph block:

```tsx
          {(park.hours || !park.isOpen) && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {park.isOpen ? park.hours : park.hours ? `Closed · ${park.hours}` : 'Closed'}
            </p>
          )}
```

with:

```tsx
          {(park.hours || !park.isOpen) && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {park.isOpen ? park.hours : park.hours ? `Closed · ${park.hours}` : 'Closed'}
              {!park.isOpen && egg.dots > 0 && (
                <span data-testid="egg-dots" className="ml-2 tracking-widest text-[var(--icon-muted)]">
                  {'•'.repeat(egg.dots)}
                </span>
              )}
            </p>
          )}
```

Render the effect overlay. The card root already has `relative` and `overflow-hidden`, so place the effect as a direct child of the outer card `div` (the one with `data-testid="park-card"`), immediately before the closing `</div>`:

```tsx
      {!park.isOpen && (
        <ParkEggEffect silhouetteKey={park.silhouetteKey} playToken={egg.playToken} />
      )}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/components/ParkCard.test.tsx`
Expected: PASS (all prior tests still green, including "does not expand for closed parks").

- [ ] **Step 5: Run the full test suite**

Run: `npx jest`
Expected: PASS — entire suite green.

- [ ] **Step 6: Manual preview verification**

Start the dev server preview and, with system clock or fixture making parks closed, verify in the browser:
- Each park's egg plays after 3 taps (MK fireworks, EPCOT rocket crossing then blasting off, HS night + beams + clapper snap, AK sloth + zzz).
- Build-up dots appear on taps 1 and 2.
- Replays on a second 3-tap cycle.
- Works in both light and dark mode (HS especially).
- With OS "reduce motion" enabled, no animation plays.

- [ ] **Step 7: Commit**

```bash
git add src/components/ParkCard.tsx src/__tests__/components/ParkCard.test.tsx
git commit -m "feat: trigger closed-park easter eggs from ParkCard"
```

---

## Notes for the implementer

- The card root `div[data-testid="park-card"]` is `relative` + `overflow-hidden` — the `.egg-layer` (`position:absolute; inset:0`) is clipped to the card, which is intended (effects like the rocket fly off-card and disappear at the edge).
- `z-index: 5` on `.egg-layer` puts effects above the header content but the rank badge is `z-10`; that's fine — the badge stays visible during the effect.
- Do not add egg behavior to open cards; the tap handler branches on `park.isOpen`.
- Keep all colors/geometry identical to `easter-eggs-v3.html`; it is the approved visual.
