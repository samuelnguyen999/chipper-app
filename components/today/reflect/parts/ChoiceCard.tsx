import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { colors, spacing, font, scaleLineHeight, textSize } from "../../../../constants";
import CardShell from "../../../cards/CardShell";
import { lensColorForType } from "../config";
import type { TodayQuestion } from "../questions";

export type ChoiceCardProps = {
  type: TodayQuestion["type"];
  mode: string;
  prompt: string;
  purpose: string;
  /** Shared across stack — parent owns toggle state */
  purposeExpanded: boolean;
  onTogglePurpose: () => void;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Fixed band for purpose copy so toggling never shifts the prompt block. */
export const PURPOSE_SLOT_HEIGHT = 88;
/** Slide + fade: 2× prior 400 / 320 ms for a slower, calmer feel */
const PURPOSE_ENTER_MS = 800;
const PURPOSE_EXIT_MS = 640;

export default function ChoiceCard({
  type,
  mode,
  prompt,
  purpose,
  purposeExpanded,
  onTogglePurpose,
  onPress,
  style,
}: ChoiceCardProps) {
  const modeColor = lensColorForType(type);

  return (
    <CardShell style={[styles.shell, style]}>
      <View style={styles.cardCanvas}>
        {/* Prompt at vertical center of full card; top chrome overlays with solid fill */}
        <View style={styles.promptLayer} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${mode}. ${prompt}`}
            accessibilityHint="Opens this reflection lens"
            onPress={onPress}
            android_ripple={{ color: colors.borderSubtle }}
            style={({ pressed }) => [styles.promptPressable, pressed && styles.pressed]}
          >
            <Text style={[font("semibold"), styles.prompt, textSize("title"), { lineHeight: scaleLineHeight("body") }]}>“{prompt}”</Text>
          </Pressable>
        </View>

        <View style={styles.topChrome} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${mode}. Toggle purpose`}
            accessibilityHint="Shows or hides why this lens helps"
            onPress={onTogglePurpose}
            style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
          >
            <View style={styles.leadRow}>
              <Text style={[font("semibold"), textSize("body"), { color: modeColor }]}>
                {mode}
              </Text>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.textMuted}
                style={styles.infoIcon}
              />
              <Text style={[font("regular"), styles.infoHint, textSize("sm")]}>
                {purposeExpanded ? "Hide purpose" : "Tap for purpose"}
              </Text>
            </View>
          </Pressable>

          <View style={styles.purposeSlot} pointerEvents="box-none">
            {purposeExpanded ? (
              <Animated.View
                entering={FadeInDown.duration(PURPOSE_ENTER_MS)}
                exiting={FadeOutUp.duration(PURPOSE_EXIT_MS)}
                style={styles.purposeAnimated}
              >
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.purposeScroll}
                >
                  <Text style={[font("regular"), styles.purpose, textSize("sm"), { lineHeight: 22 }]}>{purpose}</Text>
                </ScrollView>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </View>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  shell: { flexGrow: 0, overflow: "hidden", position: "relative" },
  cardCanvas: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    position: "relative",
  },
  /** Full card bounds — prompt block is vertically centered here, not below chrome */
  promptLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "stretch",
    zIndex: 0,
  },
  promptPressable: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  /** Opaque band so prompt behind header/purpose does not show through */
  topChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: colors.surfaceCard,
  },
  pressed: { opacity: 0.96 },
  leadRow: { flexDirection: "row", alignItems: "center" },
  infoRow: { alignSelf: "flex-start", marginBottom: spacing.xs },
  infoIcon: { marginLeft: spacing.xs, marginRight: spacing.xs },
  infoHint: { color: colors.textMuted },
  purposeSlot: {
    height: PURPOSE_SLOT_HEIGHT,
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  purposeAnimated: { flex: 1 },
  purposeScroll: { flex: 1 },
  prompt: {
    color: colors.text,
    textAlign: "center",
  },
  purpose: { color: colors.textMuted },
});
