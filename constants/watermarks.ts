import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

/**
 * Named surfaces that can show a background watermark.
 * Set a surface to `null` to disable; swap `source` anytime for a new mark.
 */
export type WatermarkSurface = "receive" | "today" | "community" | "profile";

export type WatermarkFit = "cover" | "contain";

export type WatermarkConfig = {
  source: ImageSourcePropType;
  /** 0–1 overall fade for the mark. */
  opacity: number;
  /**
   * How the art fills the screen.
   * - cover — full-bleed (may crop edges)
   * - contain — whole art visible (may letterbox)
   */
  fit?: WatermarkFit;
};

const cookieCrumb = require("../assets/watermarks/cookie_crumb.png");

const defaultMark = (opacity: number): WatermarkConfig => ({
  source: cookieCrumb,
  opacity,
  fit: "cover",
});

/**
 * Per-surface watermark map — edit here to enable tabs or change artwork/opacity.
 */
export const watermarkBySurface: Record<WatermarkSurface, WatermarkConfig | null> = {
  receive: null, //defaultMark(0.14),
  today: null, //defaultMark(0.14),
  community: null,
  profile: null,
};

export type WatermarkLayerProps = {
  surface: WatermarkSurface;
  /** Override mapped opacity without editing the registry. */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};
