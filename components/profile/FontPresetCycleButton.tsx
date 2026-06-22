import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, radii, spacing, textStyles } from "../../constants";
import { useFontPreset } from "./FontPresetContext";

/**
 * Dev typography controls — tap **Font** or **Text size** row to cycle presets.
 * Standalone card; swap rows for a dropdown later.
 */
export default function FontPresetCycleButton() {
  const { fontLabel, sizeLabel, cycleFontPreset, cycleFontSize } = useFontPreset();

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Font: ${fontLabel}. Tap to cycle fonts.`}
          onPress={cycleFontPreset}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <Text style={[textStyles.caption, styles.kicker]}>Font</Text>
          <Text style={[textStyles.buttonLabel, styles.value]} numberOfLines={1}>
            {fontLabel}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Text size: ${sizeLabel}. Tap to cycle sizes.`}
          onPress={cycleFontSize}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <Text style={[textStyles.caption, styles.kicker]}>Text size</Text>
          <Text style={[textStyles.buttonLabel, styles.value]} numberOfLines={1}>
            {sizeLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
  },
  card: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxWidth: "100%",
    overflow: "hidden",
  },
  row: {
    paddingVertical: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    gap: spacing.xs,
  },
  rowPressed: {
    opacity: 0.88,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    alignSelf: "stretch",
  },
  kicker: {
    marginBottom: 0,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    color: colors.text,
  },
});
