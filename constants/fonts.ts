import type { TextStyle } from "react-native";

/**
 * Font presets — switch app-wide typography here.
 *
 * ## System default (San Francisco / Roboto)
 * Set `FONT_PRESET = "system"`. No files loaded; `textStyles` use `fontWeight` again.
 *
 * ## Custom font
 * 1. Add `assets/fonts/YourFont.ttf` (lowercase `.ttf` extension for Metro)
 * 2. Add a preset under `FONT_REGISTRY` (`families` + `load` map for `useFonts`)
 * 3. Set `FONT_PRESET` to that preset key
 *
 * `typography.ts` and `app/_layout.tsx` read this file — no other edits needed.
 */
export type FontPreset = "system" | "willg";

/** ← Change only this line to switch fonts app-wide */
export const FONT_PRESET: FontPreset = "system";

type FontFamilies = {
  regular: string;
  semibold: string;
};

type FontPresetConfig = {
  families: FontFamilies;
  /** Passed to `useFonts` in `app/_layout.tsx` — keys must match `families` values */
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
} as const satisfies Record<FontPreset, FontPresetConfig>;

export function usesAppFont(): boolean {
  return FONT_PRESET !== "system";
}

export const fontLoadMap = FONT_REGISTRY[FONT_PRESET].load;

export const fontFamily = FONT_REGISTRY[FONT_PRESET].families;

export type FontFamilyToken = keyof FontFamilies;

/** Spread into `textStyles` — omits `fontFamily` on system preset; restores `fontWeight` for semibold */
export function font(token: FontFamilyToken): Pick<TextStyle, "fontFamily" | "fontWeight"> {
  if (!usesAppFont()) {
    return token === "semibold" ? { fontWeight: "600" } : {};
  }
  return { fontFamily: fontFamily[token] };
}
