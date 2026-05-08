import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { colors, spacing, fontSize, fontWeight, lineHeight } from "../../../constants";
import ReflectionCardShell from "./ReflectionCardShell";

export type ReflectionChoiceCardProps = {
  mode: string;
  prompt: string;
  purpose: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function ReflectionChoiceCard({
  mode,
  prompt,
  purpose,
  onPress,
  style,
}: ReflectionChoiceCardProps) {
  const [showPurpose, setShowPurpose] = useState(false);

  return (
    <ReflectionCardShell style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${mode}. Toggle purpose`}
        accessibilityHint="Shows or hides why this lens helps"
        onPress={() => setShowPurpose((prev) => !prev)}
        style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
      >
        <View style={styles.leadRow}>
          <Text style={styles.mode}>{mode}</Text>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textMuted}
            style={styles.infoIcon}
          />
          <Text style={styles.infoHint}>
            {showPurpose ? "Hide purpose" : "Tap for purpose"}
          </Text>
        </View>
      </Pressable>

      {showPurpose ? (
        <Animated.View
          entering={FadeInDown.duration(500)}
          exiting={FadeOutUp.duration(500)}
          layout={LinearTransition.springify().damping(18).stiffness(180)}
          style={styles.purposeRow}
        >
          <Text style={styles.purposeLabel}>Purpose:</Text>
          <Text style={styles.purpose}>{purpose}</Text>
        </Animated.View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${mode}. ${prompt}`}
        accessibilityHint="Opens this reflection lens"
        onPress={onPress}
        android_ripple={{ color: colors.borderSubtle }}
        style={({ pressed }) => [styles.promptPressable, pressed && styles.pressed]}
      >
        <Text style={styles.prompt}>“{prompt}”</Text>
      </Pressable>
    </ReflectionCardShell>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.96 },
  leadRow: { flexDirection: "row", alignItems: "center" },
  infoRow: { alignSelf: "flex-start", marginBottom: spacing.sm },
  mode: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.accent },
  infoIcon: { marginLeft: spacing.xs, marginRight: spacing.xs },
  infoHint: { fontSize: fontSize.sm, color: colors.textMuted },
  promptPressable: { marginTop: spacing.sm, marginBottom: spacing.sm, flex: 1, justifyContent: "center" },
  prompt: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    lineHeight: lineHeight.body,
    textAlign: "center",
  },
  purposeRow: { marginTop: spacing.xs, marginBottom: spacing.xs },
  purposeLabel: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.xs },
  purpose: { fontSize: fontSize.sm, lineHeight: 22, color: colors.textMuted },
});
