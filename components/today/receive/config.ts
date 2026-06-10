import { getDailyReceiveQuote } from "./quotes/dailyQuotes";

/**
 * Receive landing — copy, timing, and tuning.
 * Daily quote: `quotes/dailyQuotes.ts` (weekday lane + pools in `quotes/*.ts`).
 */
export const receiveCopy = {
  heading: "Today’s Message",
  /** Shown after the heading slides to the top — from `dailyQuotes.ts` by local calendar day. */
  quote: getDailyReceiveQuote(),
  continueCta: "Continue to reflect",
  /** Optional label above ponder UI (localize later) */
  ponderHint: "Take a moment with this",
} as const;

export const receiveTiming = {
  /** Centered heading “hero” hold before it slides up */
  heroHoldMs: 1800,
  /** Heading move from vertical center to top header */
  headingSlideDurationMs: 3000,
  /** Quote fade-in after the slide completes */
  quoteFadeInDurationMs: 4000,
  /** Short pause after quote before ponder starts (calm beat) */
  quoteToPonderDelayMs: 0,
  /** How long the ponder progress runs (0 → 100%) */
  ponderDurationMs: 25000,
  /** Ms after ponder phase starts before the hint appears */
  ponderHintRevealMs: 10000,
  /** Ms after ponder phase starts when the hint hides */
  ponderHintHideMs: 15000,
  /** Opacity fade when the hint appears / disappears */
  ponderHintFadeMs: 800,
} as const;

/** Whether the ponder hint caption is visible at `elapsedMs` since ponder started. */
export function isPonderHintVisible(elapsedMs: number): boolean {
  return (
    elapsedMs >= receiveTiming.ponderHintRevealMs &&
    elapsedMs < receiveTiming.ponderHintHideMs
  );
}
