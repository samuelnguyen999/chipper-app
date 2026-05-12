# Receive Flow Reference

This file documents the **locked Today receive experience** implemented in `components/today/receive/`.

## Source of truth

- `config.ts`
  - `receiveCopy` contains user-facing receive text (`heading`, `quote`, `ponderHint`, CTA label).
  - `receiveTiming` contains all phase timings and animation durations.
- `dailyQuotes.ts`
  - Imports `./quotes/*.ts` and builds `DAILY_QUOTES` + `QUOTE_CATEGORY_ORDER`.
  - `getDailyReceiveQuote()` picks by local calendar day without flattening all quotes up front.
  - `getQuotesForCategory()` for screens that only need one bucket.
- `quotes/` (one file per category)
  - `faith.ts`, `action.ts`, `discipline.ts`, `mindset.ts`, `identity.ts`, `resilience.ts` — edit these to add/reorder quotes.
- `useReceiveLandingFlow.ts`
  - Owns phase progression and ponder progress updates.
- `ReceiveLanding.tsx`
  - Owns layout, heading motion, quote fade-in, and wiring between phase state and `parts/*` UI.
- `parts/`
  - Presentational pieces only (`Heading`, `Quote`, `PonderHint`, `PonderCtaSlot`).

## Phase lifecycle

| Phase transition | Trigger |
|---|---|
| `message_only` → `heading_sliding` | Timeout: `receiveTiming.heroHoldMs` |
| `heading_sliding` → `quote_visible` | `completeHeadingSlide()` callback after heading animation completes |
| `quote_visible` → `pondering` | Timeout: `receiveTiming.quoteToPonderDelayMs` |
| `pondering` → `continue_ready` | RAF-based progress reaches 100 using `receiveTiming.ponderDurationMs` |

## What must stay aligned

- `ReceiveLanding` and `useReceiveLandingFlow` should stay in sync:
  - The hook controls **state progression**.
  - The component controls **visual animations** and calls `completeHeadingSlide()` at the right moment.
- `PonderCtaSlot` expects `progress` from 0..100 and switches from progress fill to CTA using `showButton`.
- `ReceiveQuote` content should come from `receiveCopy.quote` to keep locked Today and recap consistent.

## Rotation workflow (daily quote updates)

1. Add or edit strings in **`quotes/<category>.ts`** (keep each quote on its own string entry).
2. To change rotation order across categories, edit **`QUOTE_CATEGORY_ORDER`** in **`dailyQuotes.ts`**.

For **heading / CTA / ponder hint** copy, still edit `receiveCopy` in **`config.ts`**.
