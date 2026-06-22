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
  | "willg"
  | "perfectGirlSans"
  | "perfectGirlScript"
  | "scaver"
  | "ancientMedium"
  | "brownCookies"
  | "neo";

/** Default before Profile font cycle (or when not using the button). */
export const DEFAULT_FONT_PRESET: FontPreset = "system";

/** @deprecated Use `DEFAULT_FONT_PRESET` */
export const FONT_PRESET = DEFAULT_FONT_PRESET;

/** Cycle order for Profile font button — keep in sync with `FONT_REGISTRY` keys. */
export const FONT_PRESET_ORDER: readonly FontPreset[] = [
  "system",
  "willg",
  "perfectGirlSans",
  "perfectGirlScript",
  "scaver",
  "ancientMedium",
  "brownCookies",
  "neo",
];

export const FONT_PRESET_LABELS: Record<FontPreset, string> = {
  system: "System",
  willg: "Willg",
  perfectGirlSans: "Perfect Girl Sans",
  perfectGirlScript: "Perfect Girl Script",
  scaver: "Scaver",
  ancientMedium: "Ancient Medium",
  brownCookies: "Brown Cookies",
  neo: "Neo",
};

type FontFamilies = {
  regular: string;
  semibold: string;
};

type FontPresetConfig = {
  families: FontFamilies;
  load: Record<string, number>;
};

export const FONT_REGISTRY = {
  system: {
    families: { regular: "", semibold: "" },
    load: {},
  },
  willg: {
    families: { regular: "Willg", semibold: "Willg" },
    load: { Willg: require("../assets/fonts/Willg.ttf") },
  },
  perfectGirlSans: {
    families: { regular: "PerfectGirlSansSerif", semibold: "PerfectGirlSansSerif" },
    load: { PerfectGirlSansSerif: require("../assets/fonts/PerfectGirl-SansSerif.otf") },
  },
  perfectGirlScript: {
    families: { regular: "PerfectGirlScript", semibold: "PerfectGirlScript" },
    load: { PerfectGirlScript: require("../assets/fonts/PerfectGirl-Script.otf") },
  },
  scaver: {
    families: { regular: "Scaver", semibold: "Scaver" },
    load: { Scaver: require("../assets/fonts/Scaver-Regular.ttf") },
  },
  ancientMedium: {
    families: { regular: "AncientMedium", semibold: "AncientMedium" },
    load: { AncientMedium: require("../assets/fonts/Ancient Medium.ttf") },
  },
  brownCookies: {
    families: { regular: "BrownCookies", semibold: "BrownCookies" },
    load: { BrownCookies: require("../assets/fonts/Brown Cookies.otf") },
  },
  neo: {
    families: { regular: "Neo", semibold: "Neo" },
    load: { Neo: require("../assets/fonts/Neo.ttf") },
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
