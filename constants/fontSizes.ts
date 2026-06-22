/**
 * Text size presets — registry + runtime scale (cycle on Profile tab).
 *
 * ## Add a preset
 * 1. Add to `FONT_SIZE_REGISTRY`, `FONT_SIZE_PRESET_ORDER`, `FONT_SIZE_PRESET_LABELS`
 * 2. Profile **Text size** row cycles automatically
 */
export type FontSizePreset = "system" | "compact" | "large" | "extraLarge";

export type FontSizeToken = "sm" | "md" | "body" | "lg" | "title";

export const DEFAULT_FONT_SIZE_PRESET: FontSizePreset = "system";

export const FONT_SIZE_PRESET_ORDER: readonly FontSizePreset[] = [
  "system",
  "compact",
  "large",
  "extraLarge",
];

export const FONT_SIZE_PRESET_LABELS: Record<FontSizePreset, string> = {
  system: "System",
  compact: "Compact",
  large: "Large",
  extraLarge: "Extra Large",
};

export const BASE_FONT_SIZE = {
  sm: 14,
  md: 17,
  body: 18,
  lg: 20,
  title: 22,
} as const satisfies Record<FontSizeToken, number>;

export const BASE_LINE_HEIGHT = {
  body: 26,
} as const;

export const FONT_SIZE_REGISTRY = {
  system: { scale: 1 },
  compact: { scale: 0.9 },
  large: { scale: 1.12 },
  extraLarge: { scale: 1.42 },
} as const satisfies Record<FontSizePreset, { scale: number }>;

let activeFontSizePreset: FontSizePreset = DEFAULT_FONT_SIZE_PRESET;

export function getActiveFontSizePreset(): FontSizePreset {
  return activeFontSizePreset;
}

export function setActiveFontSizePreset(preset: FontSizePreset): void {
  activeFontSizePreset = preset;
}

export function nextFontSizePreset(current: FontSizePreset): FontSizePreset {
  const index = FONT_SIZE_PRESET_ORDER.indexOf(current);
  const nextIndex = index < 0 ? 0 : (index + 1) % FONT_SIZE_PRESET_ORDER.length;
  return FONT_SIZE_PRESET_ORDER[nextIndex]!;
}

function currentScale(): number {
  return FONT_SIZE_REGISTRY[activeFontSizePreset].scale;
}

/** Use at render time — not inside `StyleSheet.create`. */
export function scaleFontSize(token: FontSizeToken): number {
  return Math.round(BASE_FONT_SIZE[token] * currentScale());
}

/** Use at render time — not inside `StyleSheet.create`. */
export function scaleLineHeight(token: keyof typeof BASE_LINE_HEIGHT): number {
  return Math.round(BASE_LINE_HEIGHT[token] * currentScale());
}
