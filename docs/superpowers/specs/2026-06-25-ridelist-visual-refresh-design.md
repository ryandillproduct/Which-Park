# Ride List Visual Refresh — Design Spec

## Context

The visual & motion refresh and the banner-into-card change gave the park cards themselves (shadows, gradient badges, motion) and the top-pick reasoning a cohesive new look. The one remaining piece still in the old flat style is the expanded ride list inside each card (`src/components/RideList.tsx`) — flat tan rows, no shadow, no hover, no entrance motion, plain text wait times. Reviewing the app live, this was the one visibly dated corner left.

## Decision

Restyle `RideList` to match the rest of the app's depth and motion language, and add a small legend explaining the new headliner star so it isn't a mystery icon.

## 1. Row styling

Each `<li>` becomes a white card row instead of a flat tan block:
- Background `#fff`, `rounded-xl`, soft shadow `shadow-[0_2px_8px_rgba(28,16,8,0.05)]`.
- On hover (non-touch), shadow intensifies and the row lifts slightly: `hover:shadow-[0_4px_14px_rgba(28,16,8,0.1)] hover:-translate-y-0.5`, with `transition-all duration-200`.
- Headliner attractions (matched via the existing `isHeadliner()` partial-match check against the `headlinerNames` prop, unchanged logic) get a 3px gold left border (`border-l-[3px] border-l-[#F5C842]`) and a small star (`★`, `text-[#E8A93A]`) before the ride name. Non-headliner rows get `border-l-[3px] border-l-transparent` so spacing stays consistent.

## 2. Wait-time color chips

Replace the plain `{wait_time} min` text with a colored pill (`text-xs font-bold px-2.5 py-1 rounded-full`):
- `wait_time <= 20`: green — `bg-[#E3F6EC] text-[#1E8E5A]`
- `21 <= wait_time <= 45`: amber — `bg-[#FEF3D6] text-[#92660A]`
- `wait_time >= 46`: red — `bg-[#FCE4E6] text-[#B3273E]`
- Closed rides (`!ride.is_open`): neutral gray pill — `bg-[#F0EBE3] text-[#998a73]`, text "Down" (unchanged copy).
- Shows (`ride.isShow`) and static rides (`ride.isStatic`) are unchanged — the "Showtimes ↗" link and "—" placeholder keep their current treatment, not converted to pills.

## 3. Staggered entrance on expand

When the parent `ParkCard` expands (`expand-grid-open` class applied), each ride row fades up with a slight stagger: `animation: rowIn 0.35s cubic-bezier(.34,1.56,.64,1) backwards`, with `animation-delay` incrementing ~0.05s per row index. `rowIn` keyframe: `from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`. Gated behind `prefers-reduced-motion: no-preference` like the rest of the app's motion (falls back to an instant, undelayed appearance under reduced motion).

## 4. Headliner legend

The existing avg-wait line in `ParkCard.tsx` (`"{avgWaitMinutes} min avg wait across open attractions"`) gets a legend appended on the same line, separated by a middle dot:

> `{avgWaitMinutes} min avg wait across open attractions · ★ Headliner attraction`

The star in the legend uses the same color (`text-[#E8A93A]`) as the star on headliner rows, so the connection is visually obvious. No equals sign — reads as a label, not a formula.

## 5. Already shipped (called out for completeness, not part of this implementation plan)

Magic Kingdom's `HEADLINERS` entry was corrected to replace "Haunted Mansion" with "Tiana's Bayou Adventure" (commit `e082f8b`), verified against the live `/api/parks` ride list. No further action needed here.

## Out of scope

- No changes to the Showtimes link or static-ride "—" treatment.
- No changes to `RideList`'s props/signature (`rides`, `headlinerNames`, `showtimesUrl` unchanged) or to scoring logic.
- No changes to any other component besides `RideList.tsx` and the single avg-wait line in `ParkCard.tsx`.
