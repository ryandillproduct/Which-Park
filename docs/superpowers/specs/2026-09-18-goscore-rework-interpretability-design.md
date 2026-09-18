# Go Score Rework & Per-Card Interpretability — Design Spec

## Context

A live-use report surfaced an unintuitive ranking: Hollywood Studios sat at #1 with the *longest* average wait (27 min) while EPCOT (19 min) ranked below it. Investigation against the real card data revealed two root causes and one deeper structural weakness.

### Diagnosis (from real screenshots, ~10:58 AM)

Back-calculating every park's score from the displayed Go Scores:

| Park | Base crowd score | Adjustment | Final | Go Score | Rank |
|------|-----------------|-----------|-------|----------|------|
| Hollywood Studios | 4 | **−1 show boost** | 3.0 | 8.0 | 1 |
| EPCOT | 4 | none | 4.0 | 7.5 | 2 |
| Animal Kingdom | 4 | none | 4.0 | 7.5 | 3 |
| Magic Kingdom | 4 | +1.5 friction | 5.5 | 6.5 | 4 |

Findings:
1. **The show boost decided the whole thing.** HS's −1 (a hardcoded, invisible bump for park id 7 before 5 PM) was the *only* reason it outranked EPCOT/AK. Remove it and HS ties at 4.0, then loses the avg-wait tiebreaker and drops to #3 — making EPCOT #1, the intuitive result.
2. **The number shown ≠ the number ranked on.** The card shows overall average wait across *all* open attractions; the score is driven by a 70/30 headliner/congestion blend. HS's headliners actually averaged **43 min**, but the displayed 27 was dragged down by 0-minute character meet-and-greets — the overall average *hid* how bad HS's headliners were.
3. **The core crowd score has almost no resolution** — every park scored a 4. The blend + rounding compresses normal days into the middle, so ranking rides entirely on the ±adjustments and tiebreakers rather than real crowd differences.

## Goals

- **Simplify** the model so ranks track the factors users can see, with no hidden thumbs on the scale.
- **Explain** each card's rank visually and reliably, in a clean, Apple-quiet way — never a data dashboard, never fragile generated prose.

## 1. Model changes (`src/lib/scoring.ts`, `src/app/api/parks/route.ts`)

1. **Remove the Hollywood Studios show boost** — delete the `park.id === 7` / `hourET < 17` / `adjusted -= 1` block in `recommendationScore()`.
2. **Exclude character meet-and-greets from all scoring math.** Add an `isMeetAndGreet` flag to rides (detection: `name.toLowerCase().startsWith('meet ')` — covers every current case: "Meet Ariel…", "Meet Cinderella and Tiana", "Meet Mickey…", etc.). Exclude these from `ridesForScoring`, from the headliner average, and from the congestion rate. They are **still rendered** in the ride list with their wait chip; they simply stop polluting the math.
3. **Recalibrate the crowd score for resolution.** Starting proposal in `calculateParkScore()`: lower the headliner normalization ceiling from `/90` to `/60` so typical headliner waits spread across more of the 1–10 range instead of clustering at 4. This is a **tuning change that must be validated against several days of real data** before final values are locked — the `/60` is a starting point, not a proven constant. Keep the 70/30 headliner/congestion blend structure (it is the deliberately smart part of the model).
4. **Update the rescale constants.** With the show boost gone, `RECOMMENDATION_SCORE_MIN` changes from `0` to `1` (crowd floor 1 + no penalties). `RECOMMENDATION_SCORE_MAX` stays `15.5` (crowd 10 + max time penalty 4 + MK friction 1.5). Update the explanatory comment accordingly.
5. **Keep** the MK friction penalty (+1.5) and the graduated time-until-close penalty — both are retained in the score *and* now surfaced to users (see §3).

## 2. Wait display change (`src/components/ParkCard.tsx`)

- **Remove the "N min avg wait across open attractions" line.** It was the misleading number; the meters (§3) replace it. Exact per-ride minutes remain in the attraction list. The ★ headliner legend stays, attached to the attraction list.
- No numeric headliner-average summary line is added — the qualitative "Headliner waits" meter conveys it, and per-ride numbers are one glance below.

## 3. Per-card interpretability — the "Go Score factors" block

Shown in the **expanded (on-tap) state** of every card, above the attraction list, under a neutral static header: **"Go Score factors"** (wording easily swappable; never evaluative like "why it scores lower").

Three **favorability meters** — the single rule across the whole product is **fuller + greener = better**, so each meter moves 1:1 with the Go Score bar (good park → all bars high/green; weak park → all low/red). Meters are **qualitative** (no raw numbers on them):

| Meter | Source value | Bands (favorable → unfavorable) | Notes |
|-------|-------------|-------------------------------|-------|
| **Headliner waits** | headliner avg wait (mins) | Short / Moderate / Long | Band thresholds reuse the existing wait-chip cutoffs: ≤20 Short, 21–45 Moderate, ≥46 Long |
| **Crowd level** | crowd score (1–10) | Light / Moderate / Heavy | ≤3 Light, 4–6 Moderate, ≥7 Heavy (aligns with existing `scoreLabel`) |
| **Time to enjoy** | minutes until close | Plenty / Limited / Closing soon | ≥300 Plenty, 60–299 Limited, <60 Closing soon |

- Bar **fill = favorability** (short waits → nearly full; long waits → nearly empty), **color = green/amber/red** matching the band, same ramp as the Go Score bar and wait chips.
- Suggested fill levels per band for consistent rendering: favorable ≈ 82–90%, middle ≈ 50–55%, unfavorable ≈ 18–30%.

**"Also factored in" pills.** Below the meters, a small uppercase sub-label "Also factored in" followed by plain muted pill(s) (Style A: `bg-[#F0EBE3] text-[#6B5B44]`, rounded-full, **no emoji, no icon**). Today there is exactly one factor:
- **Magic Kingdom → "No direct parking"** (the friction penalty made visible).

The pill row wraps if more factors are added later. The sub-label signals these are separate considerations, so no dot/icon is needed to carry meaning.

## 4. Top card (`RecommendedBanner`/`ParkCard` #1 treatment)

- The #1 card **keeps its light reasoning strip visible without tapping** — it's the core answer users come for.
- **Reworded to the new model**, describing only that park's own favorable conditions (no fragile cross-park comparison), e.g. **"Top pick right now — short waits and light crowds."** Derived from its own meter bands (name the 1–2 most favorable), so it is always reliable.
- When tapped, the #1 card shows the same "Go Score factors" block as every other card.

## 5. Copy change (`src/app/page.tsx`)

- Broaden the list hint from "Tap a park to see attraction wait times" to something like **"Tap a park for wait times and why it ranks."**

## Out of scope

- The email/text wait-alert feature (parked separately).
- The AI-generated recommendation/explanation idea (parked — the meters deliver interpretability without it).
- The dead `queueTimes.ts` / `queueTimes.test.ts` cleanup (known, separate).
- Final recalibration constants — this spec sets the *direction and starting values*; the exact crowd-score tuning is validated against real data during implementation.
