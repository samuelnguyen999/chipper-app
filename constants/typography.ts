import type { TextStyle } from "react-native";
import {
  scaleFontSize,
  scaleLineHeight,
  type FontSizeToken,
} from "./fontSizes";
import { font } from "./fonts";
import { colors } from "./colors";
import { spacing } from "./spacing";

export {
  DEFAULT_FONT_PRESET,
  FONT_PRESET,
  FONT_PRESET_LABELS,
  FONT_PRESET_ORDER,
  FONT_REGISTRY,
  fontFamily,
  fontLoadMap,
  getActiveFontPreset,
  getAllFontLoadMap,
  getFontFamilies,
  nextFontPreset,
  setActiveFontPreset,
  usesAppFont,
} from "./fonts";
export type { FontFamilyToken, FontPreset } from "./fonts";

export {
  BASE_FONT_SIZE,
  BASE_LINE_HEIGHT,
  DEFAULT_FONT_SIZE_PRESET,
  FONT_SIZE_PRESET_LABELS,
  FONT_SIZE_PRESET_ORDER,
  FONT_SIZE_REGISTRY,
  getActiveFontSizePreset,
  nextFontSizePreset,
  scaleFontSize,
  scaleLineHeight,
  setActiveFontSizePreset,
} from "./fontSizes";
export type { FontSizePreset, FontSizeToken } from "./fontSizes";

/** @deprecated Use `scaleFontSize()` at render time for runtime sizing */
export const fontSize = {
  get sm() {
    return scaleFontSize("sm");
  },
  get md() {
    return scaleFontSize("md");
  },
  get body() {
    return scaleFontSize("body");
  },
  get lg() {
    return scaleFontSize("lg");
  },
  get title() {
    return scaleFontSize("title");
  },
};

export const fontWeight = {
  regular: "400" as const,
  semibold: "600" as const,
};

/** @deprecated Use `scaleLineHeight()` at render time */
export const lineHeight = {
  get body() {
    return scaleLineHeight("body");
  },
};

const textStyleBuilders = {
  screenSubtitle: (): TextStyle => ({
    ...font("regular"),
    fontSize: scaleFontSize("md"),
    lineHeight: scaleLineHeight("body"),
    color: colors.textMuted,
  }),

  screenTitle: (): TextStyle => ({
    ...font("semibold"),
    fontSize: scaleFontSize("title"),
    color: colors.text,
    marginBottom: spacing.md,
  }),

  body: (): TextStyle => ({
    ...font("regular"),
    fontSize: scaleFontSize("body"),
    color: colors.text,
  }),

  bodyCenter: (): TextStyle => ({
    ...font("regular"),
    fontSize: scaleFontSize("body"),
    lineHeight: scaleLineHeight("body"),
    textAlign: "center",
    color: colors.text,
  }),

  caption: (): TextStyle => ({
    ...font("regular"),
    fontSize: scaleFontSize("sm"),
    color: colors.textMuted,
    marginBottom: spacing.sm,
  }),

  emphasis: (): TextStyle => ({
    ...font("semibold"),
    fontSize: scaleFontSize("lg"),
    color: colors.text,
  }),

  buttonLabel: (): TextStyle => ({
    ...font("semibold"),
    fontSize: scaleFontSize("md"),
  }),

  link: (): TextStyle => ({
    ...font("regular"),
    fontSize: scaleFontSize("lg"),
    textDecorationLine: "underline",
  }),
} as const;

export type TextStyleName = keyof typeof textStyleBuilders;

/**
 * Reusable text styles — font + size follow runtime presets.
 * Use on `<Text style={textStyles.screenTitle}>` at render time.
 */
export const textStyles = new Proxy({} as Record<TextStyleName, TextStyle>, {
  get(_target, prop: string) {
    if (prop in textStyleBuilders) {
      return textStyleBuilders[prop as TextStyleName]();
    }
    return undefined;
  },
});

/** Shorthand for scaled `fontSize` on custom text (render time only). */
export function textSize(token: FontSizeToken): Pick<TextStyle, "fontSize"> {
  return { fontSize: scaleFontSize(token) };
}
