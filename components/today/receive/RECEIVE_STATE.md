# Receive Flow Reference

This file documents the **locked Today receive experience** implemented in `components/today/receive/`.

## Source of truth

- `config.ts`
  - `receiveCopy` contains user-facing receive text (`heading`, `quote`, `ponderHint`, CTA label).
  - `receiveTiming` contains all phase timings and animation durations.
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

## Rotation workflow (daily content updates)

Update only `receiveCopy` in `config.ts` for regular copy rotation.  
Do not edit `parts/*` for content-only updates.
