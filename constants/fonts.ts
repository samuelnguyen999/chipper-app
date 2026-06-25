import type { TextStyle } from "react-native";

/**
 * Font presets — registry + runtime active preset (cycle on Profile tab).
 *
 * ## Default on cold start
 * Set `DEFAULT_FONT_PRESET` below.
 *
 * ## Add a custom font
 * 1. Add file under `assets/fonts/` (lowercase extension when possible)
 * 2. Add entry to `FONT_REGISTRY`, `FONT_PRESET_ORDER`, and `FONT_PRESET_LABELS`
 *
 * `typography.ts` and `app/_layout.tsx` read this file.
 */
export type FontPreset =
  | "system"
  | "perfectGirlSans"
  | "scaver"
  | "brownCookies"
  | "ananda"
  | "oldLondon";

/** Default before Profile font cycle (or when not using the button). */
export const DEFAULT_FONT_PRESET: FontPreset = "system";

/** @deprecated Use `DEFAULT_FONT_PRESET` */
export const FONT_PRESET = DEFAULT_FONT_PRESET;

/** Cycle order for Profile font button — keep in sync with `FONT_REGISTRY` keys. */
export const FONT_PRESET_ORDER: readonly FontPreset[] = [
  "system",
  "perfectGirlSans",
  "scaver",
  "brownCookies",
  "ananda",
  "oldLondon",
];

export const FONT_PRESET_LABELS: Record<FontPreset, string> = {
  system: "System",
  perfectGirlSans: "Perfect Girl Sans",
  scaver: "Scaver",
  brownCookies: "Brown Cookies",
  ananda: "Ananda",
  oldLondon: "Old London",
};

type FontFamilies = {
  regular: string;
  semibold: string;
};

type FontPresetConfig = {
  families: FontFamilies;
  load: Record<string, number>;
  /**
   * Multiplier on scaled title `fontSize` for `screenTitle` line height.
   * Decorative faces often report tight metrics — bump when glyphs clip vertically.
   */
  titleLineHeightScale?: number;
  /**
   * Extra left padding for `screenTitle` as a fraction of title `fontSize`.
   * Some faces draw past their reported left bearing (horizontal clip on the first glyph).
   */
  titleHorizontalInsetScale?: number;
};

/** Default title line-height scale for custom fonts without an override. */
const DEFAULT_TITLE_LINE_HEIGHT_SCALE = 1.34;

export const FONT_REGISTRY = {
  system: {
    families: { regular: "", semibold: "" },
    load: {},
  },
  perfectGirlSans: {
    families: { regular: "PerfectGirlSansSerif", semibold: "PerfectGirlSansSerif" },
    load: { PerfectGirlSansSerif: require("../assets/fonts/PerfectGirl-SansSerif.otf") },
  },
  scaver: {
    families: { regular: "Scaver", semibold: "Scaver" },
    load: { Scaver: require("../assets/fonts/Scaver-Regular.ttf") },
  },
  brownCookies: {
    families: { regular: "BrownCookies", semibold: "BrownCookies" },
    load: { BrownCookies: require("../assets/fonts/Brown Cookies.otf") },
  },
  ananda: {
    families: { regular: "Ananda", semibold: "Ananda" },
    load: { Ananda: require("../assets/fonts/Ananda.ttf") },
    titleLineHeightScale: 1.68,
    titleHorizontalInsetScale: 0.14,
  },
  oldLondon: {
    families: { regular: "OldLondon", semibold: "OldLondon" },
    load: { OldLondon: require("../assets/fonts/Old London.ttf") },
  },
} as const satisfies Record<FontPreset, FontPresetConfig>;

let activeFontPreset: FontPreset = DEFAULT_FONT_PRESET;

export function getActiveFontPreset(): FontPreset {
  return activeFontPreset;
}

export function setActiveFontPreset(preset: FontPreset): void {
  activeFontPreset = preset;
}

export function nextFontPreset(current: FontPreset): FontPreset {
  const index = FONT_PRESET_ORDER.indexOf(current);
  const nextIndex = index < 0 ? 0 : (index + 1) % FONT_PRESET_ORDER.length;
  return FONT_PRESET_ORDER[nextIndex]!;
}

export function usesAppFont(preset: FontPreset = activeFontPreset): boolean {
  return preset !== "system";
}

export function getFontFamilies(preset: FontPreset = activeFontPreset): FontFamilies {
  return FONT_REGISTRY[preset].families;
}

/** Scales `screenTitle` line height for the active (or given) preset. */
export function getTitleLineHeightScale(preset: FontPreset = activeFontPreset): number {
  const entry = FONT_REGISTRY[preset] as FontPresetConfig;
  if (entry.titleLineHeightScale != null) return entry.titleLineHeightScale;
  if (preset === "system") return 1.25;
  return DEFAULT_TITLE_LINE_HEIGHT_SCALE;
}

/** Left inset for `screenTitle` as a fraction of title `fontSize` (0 = none). */
export function getTitleHorizontalInsetScale(preset: FontPreset = activeFontPreset): number {
  const entry = FONT_REGISTRY[preset] as FontPresetConfig;
  return entry.titleHorizontalInsetScale ?? 0;
}

/** Merged map for `useFonts` — load every custom face once so cycling is instant. */
export function getAllFontLoadMap(): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const preset of FONT_PRESET_ORDER) {
    Object.assign(merged, FONT_REGISTRY[preset].load);
  }
  return merged;
}

/** @deprecated Use `getAllFontLoadMap()` in root layout */
export const fontLoadMap = getAllFontLoadMap();

/** @deprecated Use `getFontFamilies()` */
export const fontFamily = getFontFamilies();

export type FontFamilyToken = keyof FontFamilies;

export function font(token: FontFamilyToken): Pick<TextStyle, "fontFamily" | "fontWeight"> {
  if (!usesAppFont()) {
    return token === "semibold" ? { fontWeight: "600" } : {};
  }
  return { fontFamily: getFontFamilies()[token] };
}
