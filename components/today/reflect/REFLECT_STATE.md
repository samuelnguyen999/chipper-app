# Reflect Flow Reference

This file documents the **reflect flow** under `components/today/reflect/`.

## Source of truth

- `config.ts`
  - `reflectionPromptByMode` is the rotating prompt map.
  - `reflectionChoices` derives mode/purpose/prompt entries used by UI.
- `Reflect.tsx`
  - Orchestrates list view vs focus view and unlock behavior.
- `ReflectionChoiceCard.tsx`
  - Card UI for each lens choice (mode/purpose/prompt).
- `ReflectionFocusView.tsx`
  - Focused writing view and submission handling UI.
- `state/ReflectionResponsesContext.tsx` (shared state)
  - Stores submitted responses in-memory.

## Submission and unlock behavior

- On submit in `ReflectionFocusView`, `Reflect.tsx` calls:
  1. `addResponse({ mode, prompt, response })`
  2. if `true`, then `unlockMainTabs()`
  3. optional `onUnlocked()` callback (used by locked route to `router.replace("/(tabs)")`)

## Reflection response state contract

| API | Behavior |
|---|---|
| `addResponse({ mode, prompt, response })` | Trims response; returns `false` on empty input; otherwise prepends a new entry and returns `true`. |
| `responses` | Ordered newest-first and consumed by Community cards (and any recap that uses submitted data). |

## Rotation workflow (daily prompt updates)

Update `reflectionPromptByMode` in `config.ts` to rotate prompts while preserving stable `mode` and `purpose` semantics.
