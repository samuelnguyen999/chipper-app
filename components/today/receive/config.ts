/**
 * Receive landing — copy, timing, and tuning.
 * Swap strings / durations here; wire assets and motion in step components later.
 */
export const receiveCopy = {
  heading: "Today’s Message",
  /** Shown after the heading slides to the top */
  quote: "Stay grounded. Move with purpose.",
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
} as const;
