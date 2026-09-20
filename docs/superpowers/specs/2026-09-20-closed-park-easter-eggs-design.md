# Closed-Park Easter Eggs — Design Spec

**Date:** 2026-09-20
**Status:** Approved (via interactive mock review, easter-eggs-v3)

## Goal

Add a hidden, per-park flourish to each **closed** park card. When a park is
closed, tapping its card three times triggers a short, generic animation themed
to that park, with a subtle build-up indicator on the way. The effect resets so
it can be replayed. Open cards are unaffected — they keep their existing
expand/collapse behavior.

## Motivation

When every park is closed (late night / before opening), the app has nothing
actionable to show. These eggs reward curiosity and add personality during dead
hours without cluttering the normal experience.

## Constraints (Global)

- **No Disney IP.** Every effect must be generic — no named characters, ride
  names, or trademarked imagery. This protects the app's independence and
  matches its existing disclaimer. Icons stay abstract (fireworks, a rocket,
  searchlights + a generic clapperboard, a sleeping sloth).
- **Respect `prefers-reduced-motion`.** When reduced motion is requested, the
  animations do not play. The tap counter may still advance silently, but no
  motion is rendered.
- **Closed cards only.** Eggs trigger only when `park.isOpen === false`. Open
  cards keep tap-to-expand untouched.
- **Per-card state.** The tap count and playback state are local to each card
  instance; tapping one card never affects another.
- **Next.js 16 / React 19 / TypeScript / Tailwind v4** — follow existing
  patterns in `src/components/ParkCard.tsx`. Read the relevant guide under
  `node_modules/next/dist/docs/` before writing framework code, per AGENTS.md.

## Trigger & Interaction

- **Tap count:** 3 taps on a closed card triggers its egg.
- **Build-up indicator:** after the 1st and 2nd taps, a small dot indicator
  (`•`, `••`) appears on the card, signaling something is building. On the 3rd
  tap the indicator clears and the egg plays.
- **Reset:** after the egg finishes, the counter resets to 0 so it can be
  replayed. Re-triggering mid-animation restarts the effect cleanly.
- **Accessibility:** the closed card becomes activatable (tap/click). Keyboard
  activation should advance the counter the same way a tap does. The egg is
  decorative (`aria-hidden`), so it is not announced.

## Per-Park Effects

Effects are selected by `park.silhouetteKey`:

| silhouetteKey       | Park              | Effect                                                                 |
|---------------------|-------------------|-----------------------------------------------------------------------|
| `magic-kingdom`     | Magic Kingdom     | Fireworks — bursts of colored spark particles radiating over the card. |
| `epcot`             | EPCOT             | Rocket — a rocket flies across the card left→right, then curves up and blasts off the top-right corner with an exhaust puff. |
| `hollywood-studios` | Hollywood Studios | Searchlights — the card dims to "night," two bright beams sweep, and a generic clapperboard fades into the center and snaps shut once. |
| `animal-kingdom`    | Animal Kingdom    | Sleeping sloth — a hand-drawn sloth rises into the lower-right corner with drifting "z z z". |

Exact geometry, colors, and timings are captured in the approved mock
`easter-eggs-v3.html` (fireworks JS particle spawn; rocket `launch` keyframe;
HS `night`/`sweepL`/`sweepR`/`clapperShow`/`snap` keyframes; sloth `slothIn` +
`zzz`). The mock is the visual source of truth for the port.

## Architecture

Keep `ParkCard` focused. Extract the egg system into its own unit:

- **`src/components/easter-eggs/ClosedParkEgg.tsx`** — a component that renders
  the per-park effect layer and owns the tap-count + playback state. Props:
  `silhouetteKey` and a render approach that lets it wrap the closed card's
  tap target. It exposes the tap handler and the build-up indicator, and
  renders the correct effect sub-component based on `silhouetteKey`.
- **Effect sub-components / markup** — one per park (fireworks, rocket,
  searchlights+clapper, sloth), each a self-contained SVG/DOM + keyframes unit.
  Fireworks needs JS to spawn particles; the others are CSS-keyframe driven via
  a "playing" class toggled on trigger.
- **`ParkCard.tsx`** — in the closed branch, render `ClosedParkEgg` around the
  existing card header instead of the inert `cursor-default` button. Open cards
  are unchanged.
- **Styles** — egg keyframes live in a scoped stylesheet (e.g.
  `src/components/easter-eggs/eggs.css` imported by the egg component, or added
  to `globals.css` alongside existing keyframes — match the project's current
  convention for animation CSS). All keyframes gated by
  `@media (prefers-reduced-motion: reduce)`.

### Data flow

1. `ParkCard` renders; if `!park.isOpen`, it mounts `ClosedParkEgg` with the
   park's `silhouetteKey`.
2. User taps the card → `ClosedParkEgg` increments its internal counter and
   updates the dot indicator.
3. On the 3rd tap → it sets `playing` (toggles the effect class / spawns
   particles), resets the counter, and clears the indicator.
4. When the animation duration elapses → `playing` clears so the next
   3-tap cycle can replay.

## Theming

Effects render over the card in both light and dark mode. The HS night overlay
provides its own dark backdrop, so its beams read in either theme. Other
effects use their own literal colors (spark palette, rocket body, sloth fur),
consistent with the mock. No new semantic tokens are required, but any
card-surface references should use existing `var(--...)` tokens.

## Testing

- **Unit (Jest + RTL):**
  - Tapping a closed card 3× triggers the effect (playing state / effect
    element present); 1–2 taps only show the build-up indicator.
  - The counter resets after triggering (a 4th–6th tap re-triggers).
  - Open cards do **not** mount the egg and retain expand/collapse behavior.
  - The correct effect renders for each `silhouetteKey`.
  - Effect layer is `aria-hidden`.
- **Manual / preview:** verify each park's effect in the browser preview in
  light and dark mode, and confirm reduced-motion suppresses animation.

## Out of Scope

- No persistence of "discovered" eggs across sessions.
- No global "all parks closed" coordinator; each card is independent.
- No sound.
