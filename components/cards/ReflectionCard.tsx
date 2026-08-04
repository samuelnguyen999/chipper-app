import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, font, scaleLineHeight, spacing, textSize, textStyles } from "../../constants";
import { lensColorForType } from "../today/reflect/config";
import CardContainer from "./CardContainer";
import CardShell, { CARD_SHELL_PADDING } from "./CardShell";
import type { ReflectionCardData } from "./types";

type ReflectionCardProps = {
  card: ReflectionCardData;
  onHold?: () => void;
  /** When set, rendered inside the card shell below reflection content. */
  footer?: ReactNode;
};

/** Match ChoiceCard purpose toggle enter/exit durations. */
const EXPAND_MS = 800;
const COLLAPSE_MS = 640;
const EXPAND_EASING = Easing.inOut(Easing.cubic);
/** Gray action band only — grows directly under the white card body. */
export const ACTIONS_SLOT_HEIGHT = 44;

export default function ReflectionCard({
  card,
  onHold,
  footer,
}: ReflectionCardProps) {
  const borderColor = lensColorForType(card.type);
  const expanded = footer != null;
  const progress = useSharedValue(0);
  const [slotFooter, setSlotFooter] = useState<ReactNode>(null);

  useEffect(() => {
    if (expanded) {
      setSlotFooter(footer);
    }
  }, [expanded, footer]);

  useEffect(() => {
    if (expanded) {
      progress.value = withTiming(1, {
        duration: EXPAND_MS,
        easing: EXPAND_EASING,
      });
      return;
    }

    progress.value = withTiming(
      0,
      { duration: COLLAPSE_MS, easing: EXPAND_EASING },
      (finished) => {
        if (finished) {
          runOnJS(setSlotFooter)(null);
        }
      },
    );
  }, [expanded, progress]);

  const actionsSlotStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, ACTIONS_SLOT_HEIGHT]),
    overflow: "hidden" as const,
  }));

  return (
    <CardContainer onHold={onHold}>
      <CardShell style={[styles.shell, { borderColor }]}>
        <View style={styles.content}>
          <Text
            style={[
              font("semibold"),
              styles.prompt,
              textSize("body"),
              { lineHeight: scaleLineHeight("body") },
            ]}
          >
            “{card.prompt}”
          </Text>
          <Text style={textStyles.body}>{card.response}</Text>
        </View>
        <Animated.View
          style={[styles.actionsBand, actionsSlotStyle, { backgroundColor: borderColor }]}
        >
          {slotFooter}
        </Animated.View>
      </CardShell>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    backgroundColor: colors.surfaceCard,
    padding: 0,
  },
  /** White card body — same insets collapsed and expanded (no extra breath on hold). */
  content: {
    padding: CARD_SHELL_PADDING,
  },
  prompt: {
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  actionsBand: {
    justifyContent: "center",
  },
});

