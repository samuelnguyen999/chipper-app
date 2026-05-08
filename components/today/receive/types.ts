/**
 * Phases for the receive landing. Order is fixed; transitions are centralized in the hook.
 * Add intermediate phases here when you introduce staggered animations.
 */
export type ReceiveLandingPhase =
  | "message_only"
  | "heading_sliding"
  | "quote_visible"
  | "pondering"
  | "continue_ready";
