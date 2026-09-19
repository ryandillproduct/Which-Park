# Dark Mode — Design Spec

## Context

WhichPark? is styled entirely with hardcoded hex colors scattered across every component (`bg-[#FDF8F0]`, `text-[#1C1008]`, inline gradient strings, chip colors, etc.). There is no color-token layer, so today the app has exactly one appearance. This spec adds a warm dark mode that follows the visitor's system preference, can be overridden with a per-device toggle, and transitions with a top-down "wash" animation — without changing any logic, data, or layout.

## Decisions

- **Palette direction:** warm dark (espresso/charcoal with warm undertones), chosen to preserve the cream/gold editorial identity rather than a cooler neutral dark.
- **Trigger:** follow the OS `prefers-color-scheme` by default; a manual toggle overrides it and is remembered per device.
- **Transition:** toggling animates a top-down clip "wash" of the newly-themed page over the old one via the View Transitions API, with graceful fallbacks.

## 1. Token system (the foundation)

Introduce a semantic CSS-variable layer in `src/app/globals.css`. `:root` holds the **light** (current) values. The **warm-dark** values are declared in two places so both the system default and the manual override work from one definition:

- `@media (prefers-color-scheme: dark)` on `:root` — follows the OS.
- `:root[data-theme="dark"]` — the manual toggle wins over the OS.
- `:root[data-theme="light"]` re-asserts the light values so a visitor can force light even on a dark-preferring device.

Components stop hardcoding hex and reference tokens: className hexes become `bg-[var(--surface)]` etc., and inline `style` colors/gradients become `var(--…)`.

### Token catalog (light → warm-dark)

| Token | Light | Warm dark | Used for |
|-------|-------|-----------|----------|
| `--bg` | `#FDF8F0` | `#17120D` | page background |
| `--surface` | `#FFFFFF` | `#241C15` | park cards, closed banner |
| `--surface-raised` | `#FFFFFF` | `#2A2118` | ride rows (sit on a card) |
| `--text` | `#1C1008` | `#F2E9DB` | primary text, park names (open) |
| `--text-muted` | `#B5A898` | `#9C8E7C` | hours, hints, muted labels, closed names |
| `--text-label` | `#8B7355` | `#C0AA8C` | meter labels, "avg wait" emphasis |
| `--gold` | `#F5C842` | `#F5C842` | accent (unchanged) |
| `--gold-deep` | `#E8A93A` | `#E8A93A` | rank-badge gradient end, star (unchanged) |
| `--track` | `#EDE8E1` | `#3A2F24` | Go Score bar + meter tracks |
| `--divider` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | card internal divider, ride borders |
| `--strip-bg` | `#FDF3D6` | `#2C2313` | #1 card top-pick strip bg |
| `--strip-lead` | `#8B6914` | `#F0C769` | bold "Top pick right now —" |
| `--strip-body` | `#1C1008` | `#E7D9C2` | rest of the strip sentence |
| `--badge-grad` | `linear-gradient(135deg,#FBF0DC,#F0DCA8)` | `linear-gradient(135deg,#3A2E1A,#4A3A20)` | open icon badge bg |
| `--icon` | `#B8842E` | `#F0C463` | open park silhouette |
| `--icon-muted` | `#DDD8D0` | `#5A5048` | closed park silhouette |
| `--chip-green-bg` / `--chip-green-tx` | `#E3F6EC` / `#1E8E5A` | `#173A2C` / `#7DE0A6` | wait chip ≤20 min |
| `--chip-amber-bg` / `--chip-amber-tx` | `#FEF3D6` / `#92660A` | `#3A2E14` / `#F2C56A` | wait chip 21–45 min |
| `--chip-red-bg` / `--chip-red-tx` | `#FCE4E6` / `#B3273E` | `#3A1A20` / `#F0969F` | wait chip ≥46 min |
| `--chip-gray-bg` / `--chip-gray-tx` | `#F0EBE3` / `#998a73` | `#2E2820` / `#A89880` | "Unavailable" chip |
| `--card-shadow` | `0 4px 16px rgba(28,16,8,0.06)` | `0 4px 16px rgba(0,0,0,0.35)` | card resting shadow |

The **meter fill gradients** (green `#9BE0B4→#34D399`, amber `#F6D97A→#E3B23C`, red `#F3A8B4→#E36074`) and the **rank-badge gold gradient** stay identical in both modes — they read well on dark. Only chip *backgrounds/text* and surfaces flip. The **Go Score bar** gradient is computed in JS from the score (`goScoreBarStyle`) and is mode-independent — leave it as-is; only its track (`--track`) tokenizes.

## 2. Theme resolution & flash prevention

- The manual choice lives in `localStorage` under key `theme` with value `"light"` | `"dark"` (absent = follow system).
- A tiny **inline script in the document `<head>`** (added to the root layout) runs before first paint and applies a saved choice so there's no flash of the wrong theme:
  ```js
  (function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}})();
  ```
- With no saved choice, no `data-theme` attribute is set and the `@media (prefers-color-scheme)` rule governs — true system-following.

## 3. Toggle component

A small client component (`ThemeToggle`) pinned to the **top-right** of the page (above/next to the centered header, not disturbing it). Sun icon shown in dark mode (tap → light); moon icon in light mode (tap → dark). Icon-only, with an `aria-label` ("Switch to dark mode" / "Switch to light mode").

Behavior on tap:
1. Determine the current effective theme: the `data-theme` attribute if present, else `matchMedia('(prefers-color-scheme: dark)')`.
2. Compute the opposite.
3. Apply it (set `documentElement.dataset.theme`, write `localStorage`) inside the wash transition (§4).

## 4. Top-down wash animation

The theme swap runs inside `document.startViewTransition(...)`. A CSS keyframe reveals the new-theme snapshot with a clip wiping from the top edge downward, so the new coloring washes over the page top-to-bottom:

```css
@keyframes theme-wash-down {
  from { clip-path: inset(0 0 100% 0); }
  to   { clip-path: inset(0 0 0 0); }
}
::view-transition-old(root) { animation: none; }
::view-transition-new(root) { animation: theme-wash-down 0.45s ease both; }
```

Fallbacks (both apply an **instant** theme swap, no animation):
- Browsers without `document.startViewTransition` (e.g. Firefox): call the swap directly.
- `prefers-reduced-motion: reduce`: skip the transition and swap directly, consistent with the app's existing reduced-motion handling.

## 5. Migration scope

Tokenize hardcoded colors in: `globals.css` (define tokens + the two theme blocks + wash keyframes), `layout` (bg, inline FOUC script, mount the toggle), `page.tsx` (header, hint, section label, footer, loading/error states), `ParkCard.tsx`, `GoScoreFactors.tsx`, `RideList.tsx`, `RecommendedBanner.tsx`, `GoScoreInfoModal.tsx`, `about/page.tsx`, and the icon color passed into `ParkSilhouette`. New: `ThemeToggle` component. No changes to `route.ts`, scoring, or any data shape.

## Out of scope

- The broader "review all designs for usability/beauty" audit — a separate follow-up effort once dark mode is solid.
- Any logic, data, ranking, or layout change. This is purely a presentation/theming change.
- A three-way (light/dark/system) toggle UI — the toggle flips between light and dark; "system" is simply the default before any manual choice.
