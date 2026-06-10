import type { TextStyle } from "react-native";
import { font } from "./fonts";
import { colors } from "./colors";
import { spacing } from "./spacing";

export { FONT_PRESET, FONT_REGISTRY, fontFamily, fontLoadMap, usesAppFont } from "./fonts";
export type { FontFamilyToken, FontPreset } from "./fonts";

export const fontSize = {
  sm: 14,
  md: 17,
  body: 18,
  lg: 20,
  title: 22,
} as const;

export const fontWeight = {
  regular: "400" as const,
  semibold: "600" as const,
};

export const lineHeight = {
  body: 26,
} as const;

/**
 * Reusable text styles. Font face comes from `constants/fonts.ts` (`FONT_PRESET`).
 * Add `color` in the component when overriding.
 */
export const textStyles = {
  screenSubtitle: {
    ...font("regular"),
    fontSize: fontSize.md,
    lineHeight: lineHeight.body,
    color: colors.textMuted,
  } satisfies TextStyle,

  screenTitle: {
    ...font("semibold"),
    fontSize: fontSize.title,
    color: colors.text,
    marginBottom: spacing.md,
  } satisfies TextStyle,

  body: {
    ...font("regular"),
    fontSize: fontSize.body,
    color: colors.text,
  } satisfies TextStyle,

  bodyCenter: {
    ...font("regular"),
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    textAlign: "center",
    color: colors.text,
  } satisfies TextStyle,

  caption: {
    ...font("regular"),
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  } satisfies TextStyle,

  emphasis: {
    ...font("semibold"),
    fontSize: fontSize.lg,
    color: colors.text,
  } satisfies TextStyle,

  buttonLabel: {
    ...font("semibold"),
    fontSize: fontSize.md,
  } satisfies TextStyle,

  link: {
    ...font("regular"),
    fontSize: fontSize.lg,
    textDecorationLine: "underline",
  } satisfies TextStyle,
} as const;
