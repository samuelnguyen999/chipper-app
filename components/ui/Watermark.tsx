import { Image, StyleSheet, View } from "react-native";
import {
  watermarkBySurface,
  type WatermarkLayerProps,
} from "../../constants/watermarks";

/**
 * Non-interactive full-bleed background watermark.
 * Configure per surface in `constants/watermarks`.
 */
export default function Watermark({ surface, opacity, style }: WatermarkLayerProps) {
  const config = watermarkBySurface[surface];
  if (!config) return null;

  const resolvedOpacity = opacity ?? config.opacity;
  const fit = config.fit ?? "cover";
  const scale = config.transform?.scale;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.host, style]}
    >
      <Image
        source={config.source}
        resizeMode={fit}
        style={[
          styles.image,
          { opacity: resolvedOpacity },
          scale != null && { transform: [{ scale }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
