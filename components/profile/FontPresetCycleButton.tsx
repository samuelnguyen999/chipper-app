import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, textStyles } from "../../constants";
import { useFontPreset } from "./FontPresetContext";

type PresetChipProps = {
  kicker: string;
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function PresetChip({ kicker, value, accessibilityLabel, onPress }: PresetChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Text style={[textStyles.caption, styles.kicker]} numberOfLines={1}>
        {kicker}
      </Text>
      <Text style={[textStyles.caption, styles.value]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

/** Compact Font + Size chips for the profile header (top right). */
export default function FontPresetCycleButton() {
  const { fontLabel, sizeLabel, cycleFontPreset, cycleFontSize } = useFontPreset();

  return (
    <View style={styles.row}>
      <PresetChip
        kicker="Font"
        value={fontLabel}
        accessibilityLabel={`Font: ${fontLabel}. Tap to cycle fonts.`}
        onPress={cycleFontPreset}
      />
      <PresetChip
        kicker="Size"
        value={sizeLabel}
        accessibilityLabel={`Text size: ${sizeLabel}. Tap to cycle sizes.`}
        onPress={cycleFontSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  chip: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 56,
    maxWidth: 92,
    alignItems: "flex-end",
  },
  chipPressed: {
    opacity: 0.88,
  },
  kicker: {
    marginBottom: 0,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontSize: 11,
    lineHeight: 14,
  },
  value: {
    marginBottom: 0,
    color: colors.text,
    textAlign: "right",
  },
});
