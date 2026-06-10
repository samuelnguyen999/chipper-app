import { StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { colors, textStyles } from "../../../../constants";

type ReceiveLandingPonderHintProps = {
  text: string;
  opacity: SharedValue<number>;
  /** A11y: true while the hint is meaningfully visible (not only reserved layout). */
  visible: boolean;
};

/**
 * Caption below the centered quote during ponder.
 * Always occupies layout space while mounted so the quote does not shift when opacity animates.
 */
export default function ReceiveLandingPonderHint({
  text,
  opacity,
  visible,
}: ReceiveLandingPonderHintProps) {
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.slot, animatedStyle]}
      pointerEvents="none"
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    >
      <Text style={styles.hint}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignSelf: "stretch",
  },
  hint: {
    ...textStyles.caption,
    marginBottom: 0,
    textAlign: "center",
    alignSelf: "stretch",
    color: colors.textMuted,
  },
});
