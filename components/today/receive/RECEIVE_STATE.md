# Receive Flow Reference

This file documents the **locked Today receive experience** implemented in `components/today/receive/`.

## Source of truth

- `config.ts`
  - `receiveCopy` contains user-facing receive text (`heading`, `quote`, `ponderHint`, CTA label).
  - `receiveTiming` contains all phase timings and animation durations.
- `dailyQuotes.ts`
  - **`WEEKDAY_TO_CATEGORY`**: maps local weekday → lane (Sun action … Sat faith).
  - **`getDailyReceiveQuote()`**: weekday picks **category**; **day-of-year** picks index inside that category’s list.
  - **`getCategoryForWeekday()`** / **`getQuotesForCategory()`** for debugging or UI that shows the lane.
- `quotes/` (one file per lane)
  - `faith.ts`, `action.ts`, `discipline.ts`, `mindset.ts`, `identity.ts`, `resilience.ts`, **`connection.ts`** — edit these to add/reorder quotes.
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

## Weekday → category (receive quote lane)

| Local weekday | Category |
|---|---|
| Sunday | action |
| Monday | identity |
| Tuesday | discipline |
| Wednesday | mindset |
| Thursday | resilience |
| Friday | connection |
| Saturday | faith |

Within that day’s list, the quote still changes across the year (`day-of-year % list.length`).

## Rotation workflow (quote content)

1. Add or edit strings in **`quotes/<category>.ts`**.
2. To change **which day gets which lane**, edit **`WEEKDAY_TO_CATEGORY`** in **`dailyQuotes.ts`** (order is Sun→Sat, index `Date.getDay()`).

For **heading / CTA / ponder hint** copy, still edit `receiveCopy` in **`config.ts`**.
