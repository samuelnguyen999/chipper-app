# Receive flow — architecture reference

**Scope:** This folder implements the **Receive** half of **locked Today** (`TodayExperience` → `Landing` → Reflect). Post-unlock **Today** tab recap reads `receiveCopy.quote` from the same `config.ts`, so quote source must stay coherent with this doc.

**Audience:** Future agents and humans doing review or adaptation—read this before changing phases, timing, quotes, or the bottom dock.

---

## Folder layout (importance order)

| Layer | Path | Responsibility |
|---|---|---|
| Copy + timing | `config.ts` | `receiveCopy` (static strings + **daily quote**), `receiveTiming` (ms durations). |
| Phase machine | `flow.ts` | `LandingPhase`, `useLandingFlow` — timers, `ponderProgress`, `completeHeadingSlide`. |
| UI orchestration | `landing.tsx` | Reanimated heading path, quote fade, layout measurement; **calls** `completeHeadingSlide` when slide ends. |
| Quote data | `quotes/dailyQuotes.ts` | Weekday → lane; `getDailyReceiveQuote`; aggregates `quotes/*.ts` pools. |
| Quote pools | `quotes/<lane>.ts` | One `readonly string[]` per lane (edit here for content). |
| Atoms | `parts/*` | Presentational only — no phase logic. |
| Public API | `index.ts` | Barrel; keeps **`useReceiveLandingFlow`** / **`ReceiveLandingPhase`** as aliases for older imports. |

**Design rule:** `flow.ts` owns **state transitions**; `landing.tsx` owns **motion tied to phase** and must not advance phases except via `completeHeadingSlide` and what `flow` already schedules.

---

## Phase lifecycle

| Transition | Trigger |
|---|---|
| `message_only` → `heading_sliding` | `setTimeout` → `receiveTiming.heroHoldMs` |
| `heading_sliding` → `quote_visible` | `completeHeadingSlide()` from `landing.tsx` when Reanimated `withTiming` completes |
| `quote_visible` → `pondering` | `setTimeout` → `receiveTiming.quoteToPonderDelayMs` |
| `pondering` → `continue_ready` | RAF loop until 100% over `receiveTiming.ponderDurationMs` |

---

## Daily quotes (weekday lanes)

**Rule:** Local **`Date.getDay()`** picks the **lane**; **day-of-year** picks the **index** inside that lane’s pool (`% pool.length`).

| Weekday (local) | Lane |
|---|---|
| Sunday | `action` |
| Monday | `identity` |
| Tuesday | `discipline` |
| Wednesday | `mindset` |
| Thursday | `resilience` |
| Friday | `connection` |
| Saturday | `faith` |

- **Edit copy:** `quotes/<lane>.ts`
- **Edit weekday mapping:** `quotes/dailyQuotes.ts` → `WEEKDAY_TO_CATEGORY`
- **Tooling order:** `QUOTE_CATEGORY_ORDER` in `dailyQuotes.ts` is for iteration / exports—not the weekday order.

---

## Integration points (rest of app)

- **`components/today/TodayExperience.tsx`** — default-imports `./receive` (i.e. `Landing`). Toggles Reflect after CTA.
- **`components/today/TodayRecap.tsx`** — imports `receiveCopy` + `ReceiveQuote`; recap shows **same** `receiveCopy.quote` string as Receive (see limitation below).
- **`constants`** — `layout.receiveLandingPaddingTop`, `layout.tabBarDock*`, `screen.*` shared with tab dock styling in `parts/PonderCtaSlot`.

---

## Pros / cons (current state)

| Pros | Cons / risks |
|---|---|
| **Clear split:** `flow` vs `landing` is easy to reason about and test mentally. | **Phase ↔ animation coupling:** If `completeHeadingSlide` is never called (Reanimated bug / early unmount), user can stall in `heading_sliding`. |
| **Typed quote pools** — categories, no giant `.txt`, IDE refactors and reviews work well. | **All lanes load in one graph** — every `quotes/*.ts` is imported from `dailyQuotes.ts`; huge corpuses slow parse/typecheck (mitigation: split into subfolders + lazy `import()` later if needed). |
| **Weekday lanes** give predictable “theme of the day” without extra UI. | **Locale / TZ:** Uses device **local** calendar; travelers crossing midnight or DST edges get edge cases; no per-user timezone override. |
| **Dock (`PonderCtaSlot`)** matches tab bar height math for visual continuity. | **Dock + safe area** is sensitive; changing `layout.tabBarDock*` affects Receive and tabs—coordinate changes. |
| **Barrel aliases** reduce churn for older `useReceiveLandingFlow` imports. | Aliases add two names for the same hook/type—prefer `useLandingFlow` / `LandingPhase` in new code. |

### Quote resolution caveat (important)

`config.ts` sets `receiveCopy.quote` to **`getDailyReceiveQuote()` at module evaluation time**. So:

- The string is fixed for the **lifetime of the JS bundle session** until Metro reload / full app restart—not “live” if the user keeps the app open across **local midnight**.
- **Today recap** reads the same evaluated `receiveCopy.quote`; it does not call `getDailyReceiveQuote(new Date())` on each render.

**If you need midnight refresh or per-screen dates:** call `getDailyReceiveQuote()` inside a small hook or pass quote as props from a parent that re-reads on focus—**do not** only change `getDailyReceiveQuote` without addressing `receiveCopy` construction.

---

## Future adaptations (recipes)

| Goal | Where to change |
|---|---|
| New phase (e.g. `video_intro`) | Add to `LandingPhase` in `flow.ts`; add `useEffect` + branch in `landing.tsx`; document transition table here. |
| Faster/slower hero / ponder | `config.ts` → `receiveTiming` only. |
| New quote lane | Add `quotes/<lane>.ts`, import in `quotes/dailyQuotes.ts`, extend `QuoteCategory` / `WEEKDAY_TO_CATEGORY` / `DAILY_QUOTES` / `QUOTE_CATEGORY_ORDER`. |
| Per-user quote (saved preference) | Introduce a thin resolver in `config` or `quotes/dailyQuotes.ts` that reads context/storage **before** falling back to weekday logic; keep pools in `quotes/*.ts`. |
| Lazy-loaded huge corpus | Replace eager imports in `dailyQuotes.ts` with `import()` + async state in a provider **only if** bundle size or startup becomes an issue—otherwise keep simple. |
| Remove legacy aliases | `index.ts` — drop `useReceiveLandingFlow` / `ReceiveLandingPhase` re-exports after grep confirms no callers. |

---

## Review checklist (PRs touching Receive)

- [ ] Phase table in this file still matches `flow.ts` + `landing.tsx`.
- [ ] `completeHeadingSlide` still invoked exactly once per successful slide completion.
- [ ] `pondering` effect cleans up `requestAnimationFrame` on unmount / phase change.
- [ ] Quote edits: valid TS strings, no duplicate entries **unless intentional**; run `npx tsc --noEmit`.
- [ ] If `layout` / dock constants changed: smoke **Receive dock** + **tab bar** on a notched device.
- [ ] If `WEEKDAY_TO_CATEGORY` changed: confirm product intent for Sun→Sat mapping.
- [ ] If `receiveCopy.quote` behavior changed: verify **locked Today** and **Today recap** still match product expectations.

---

## Quick edit map

| Change | File |
|---|---|
| Heading, CTA label, ponder hint | `config.ts` → `receiveCopy` |
| Durations | `config.ts` → `receiveTiming` |
| Motion / layout | `landing.tsx` (+ `parts/*` if presentational) |
| Phase logic | `flow.ts` |
| Quote line content | `quotes/<lane>.ts` |
| Which day = which lane | `quotes/dailyQuotes.ts` → `WEEKDAY_TO_CATEGORY` |

---

*Keep this file in sync when Receive architecture or quote rules change.*
