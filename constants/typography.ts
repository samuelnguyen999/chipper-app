import type { TextStyle } from "react-native";
import { colors } from "./colors";
import { spacing } from "./spacing";

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
 * Reusable text styles. Add `color` in the component when overriding.
 */
export const textStyles = {
  screenSubtitle: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.body,
    color: colors.textMuted,
  } satisfies TextStyle,

  screenTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  } satisfies TextStyle,

  body: {
    fontSize: fontSize.body,
    color: colors.text,
  } satisfies TextStyle,

  bodyCenter: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    textAlign: "center",
    color: colors.text,
  } satisfies TextStyle,

  caption: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  } satisfies TextStyle,

  emphasis: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  } satisfies TextStyle,

  buttonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  } satisfies TextStyle,

  link: {
    fontSize: fontSize.lg,
    textDecorationLine: "underline",
  } satisfies TextStyle,
} as const;
