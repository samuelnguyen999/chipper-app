/**
 * App color tokens. Prefer semantic names over raw hex in components.
 */
export const colors = {
  /** Primary actions (buttons, key CTAs) */
  primary: "#2563eb",
  primaryPressed: "#1d4ed8",
  onPrimary: "#ffffff",
  onPrimaryMuted: "#e2e8f0",

  /** Default body and headings on light surfaces */
  text: "#000000",
  textMuted: "#64748b",

  /** Navigation accent (tabs, links) */
  accent: "#0000ff",

  /** Surfaces */
  background: "#ead699",
  tabHeader: "#69350f",
  surfaceCard: "#ffffff",
  borderSubtle: "#ead699",

  /** One-off / legacy screens — tighten when design system grows */
  notFoundBackground: "#ead699",
  notFoundText: "#000000",
  notFoundLink: "#ffffff",
} as const;

export type ColorName = keyof typeof colors;
