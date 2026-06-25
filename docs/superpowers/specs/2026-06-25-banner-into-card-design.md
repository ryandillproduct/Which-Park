# Fold "Best Park" Banner Into the #1 Ranked Card — Design Spec

## Context

The visual & motion refresh ([2026-06-25-visual-motion-refresh-design.md](./2026-06-25-visual-motion-refresh-design.md)) gave the ranked park cards a gradient icon badge, soft shadow, and a continuous glow pulse on the #1 card. Once that landed, the separate "Best Park to Visit Right Now" banner above the list started to feel visually disconnected — flat, no icon, no motion — next to cards that now look and feel alive. On reviewing it live on a phone, the banner read as a leftover from the old style rather than part of the new one.

Separately: the #1 ranked card by Go Score and the banner's recommended park are mathematically guaranteed to always be the same park. Both `buildRecommendation()` and the ranked list's sort use the identical `compareParks`/`recommendationScore` comparator (`src/app/api/parks/route.ts`), and `computeGoScore` is a monotonic transform of that same score — so `sorted[0]` (rank 1) and the recommendation winner can never diverge. This makes a separate banner redundant, not just visually but logically: it's restating the #1 card's own park, computed from the same data.

## Decision

Remove the separate banner. Fold its information directly into the #1 ranked card. Keep a simplified, smaller block only for the case where every park is closed (the list itself has nothing to highlight in that case).

## 1. When at least one park is open

`RecommendedBanner`'s "winner" rendering path is deleted entirely. The page becomes: header → ranked list, full stop. No card/box above the list when there's a recommendation.

The #1 ranked card (`rank === 1`) gains a new highlighted strip, rendered below the existing Go Score bar/score line, in place of where a standalone tiebreaker note would otherwise go:

- Background: `#FDF3D6` (the banner's old background color), `rounded-lg`, inset with `mt-2 px-2.5 py-2`.
- Content: a single sentence, bold lead-in **"Top pick right now"** in `text-[#8B6914]`, followed by the live metrics in `text-[#1C1008]` at slightly smaller weight:
  - Format: `Top pick right now — {avgWaitMinutes} min avg wait, crowd level {score}/10. {time framing}`
  - Time framing (identical tiers to the deleted `SummaryText`, computed from `closingTimeMs` via the same `useLiveMinutesUntilClose` live-updating hook, polling every 60s):
    - `mins < 60`: `Only ~{formatTimeUntilClose(mins)} left until close.`
    - `mins < 300`: `About {formatTimeUntilClose(mins)} left until close.`
    - `mins !== null` (300+): `There's plenty of time left to enjoy the park.`
    - `mins === null` (no closing time data): time framing sentence omitted.
- This strip is computed entirely from the #1 card's own `park` prop (`avgWaitMinutes`, `score`, `closingTimeMs`) — no `Recommendation` object needs to be threaded into `ParkCard`, since rank 1 guarantees it matches the old recommendation winner (see Context).

## 2. Tie handling — no second note on the #1 card

Today, `tiebreakerNote` is computed server-side per park (`route.ts`) and rendered as a separate italic line whenever a park's *displayed* Go Score ties the next park's. If the #1 card ties #2, this would currently stack a second italic note under the new strip — a real collision discovered during design review (confirmed live in the visual companion: two muted lines blur together and duplicate the avg-wait framing).

Fix: when `rank === 1` **and** `park.tiebreakerNote` is present, do not render the standalone tiebreaker note. Instead, fold it into the strip sentence as a lead clause before the metrics:

- Format: `Top pick right now — edges out {loserName} on {dimension}. {avgWaitMinutes} min avg wait, crowd level {score}/10. {time framing}`
- `{dimension}` is derived from the existing `tiebreakerNote` string already computed server-side:
  - `"Lower average wait than X"` → dimension = `"average wait"`
  - `"More open attractions than X"` → dimension = `"open attractions"`
  - `{loserName}` is `X` extracted from that same string (the note already names the park it's being compared against — no new server-side data needed).
- Ranks 2+ are unaffected: their `tiebreakerNote`, if present, still renders exactly as it does today (separate italic line, unchanged styling).

## 3. When all parks are closed

`RecommendedBanner` keeps existing as a component, but only for this one case (`recommendation === null`). Simplify its box: drop the gradient/border styling, keep a small `rounded-2xl bg-[#F5EFE6]` block with the existing closed-state copy, centered text, no icon, no glow, no entrance bounce beyond the existing `animate-bounce-in` (kept, since there's no continuous motion to clash with on a static message).

## 4. Out of scope

- Go Score bar gradient/coloring — unchanged (confirmed: current light→dark-of-score's-own-color behavior is correct and was a point of confusion during design review, not a requested change).
- The page header tagline ("The question isn't if. It's where.") — discussed and explicitly kept as-is; it does identity/voice work unrelated to the banner's removal.
- Icon redraws (EPCOT, Hollywood Studios) — already shipped in a separate change earlier this session.
- Any change to scoring, tiebreaker computation, or the `/api/parks` response shape — the server already computes everything this spec needs (`avgWaitMinutes`, `score`, `closingTimeMs`, `tiebreakerNote`); this is purely a client-side presentation change.
