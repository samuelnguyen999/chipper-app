import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  font,
  getTitleLineHeightScale,
  layout,
  radii,
  scaleFontSize,
  spacing,
  textSize,
  textStyles,
} from "../../constants";

export const COMMUNITY_PURPOSE_COPY = [
  "Read with curiosity.",
  "Hold space for another person.",
  "Leave encouraged to take your next step.",
  "",
  "When a reflection connects with you, offer a quiet acknowledgment. Your support stays private. The writer will never know.",
  "",
  "Together, we build shared understanding, connection, and growth.",
].join("\n");

/** Match ChoiceCard purpose toggle enter/exit. */
const PURPOSE_ENTER_MS = 450;
const PURPOSE_EXIT_MS = 300;
const FADE_EASING = Easing.inOut(Easing.cubic);

/** Match Community header block: title line + screenTitle marginBottom. */
function communityHeaderBlockHeight(): number {
  const fontSize = scaleFontSize("title");
  const lineHeight = Math.round(fontSize * getTitleLineHeightScale());
  return lineHeight + spacing.md;
}

/**
 * Community header purpose control — same info icon + muted copy language as Reflect ChoiceCard.
 * Sheet uses FadeInDown / FadeOut; scrim opacity tracks the same enter/exit timing.
 */
export default function CommunityPurposeInfo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);
  const closingRef = useRef(false);
  const backdropOpacity = useSharedValue(0);
  const insets = useSafeAreaInsets();
  /** Align sheet top with first card (under scene safe area + scroll pad + header). */
  const sheetTop =
    insets.top + layout.screenPadding + communityHeaderBlockHeight();

  const open = () => {
    closingRef.current = false;
    backdropOpacity.value = 0;
    setModalOpen(true);
    setSheetMounted(true);
    backdropOpacity.value = withTiming(1, {
      duration: PURPOSE_ENTER_MS,
      easing: FADE_EASING,
    });
  };

  const dismiss = () => {
    if (closingRef.current || !sheetMounted) return;
    closingRef.current = true;
    setSheetMounted(false);
    backdropOpacity.value = withTiming(0, {
      duration: PURPOSE_EXIT_MS,
      easing: FADE_EASING,
    });
    setTimeout(() => {
      setModalOpen(false);
      closingRef.current = false;
    }, PURPOSE_EXIT_MS);
  };

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Community purpose"
        accessibilityHint="Shows why Community exists"
        onPress={open}
        style={({ pressed }) => [styles.infoHit, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.textMuted}
          style={styles.infoIcon}
        />
      </Pressable>

      <Modal
        visible={modalOpen}
        transparent
        animationType="none"
        onRequestClose={dismiss}
        statusBarTranslucent
      >
        <View style={[styles.root, { paddingTop: sheetTop }]}>
          <Animated.View style={[styles.scrim, scrimStyle]} pointerEvents="none" />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Close purpose"
          />
          {sheetMounted ? (
            <Animated.View
              entering={FadeInDown.duration(PURPOSE_ENTER_MS)}
              exiting={FadeOut.duration(PURPOSE_EXIT_MS)}
              style={styles.sheet}
              accessibilityViewIsModal
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
              >
                <Text
                  style={[font("regular"), styles.purpose, textSize("md"), { lineHeight: 24 }]}
                >
                  {COMMUNITY_PURPOSE_COPY}
                </Text>
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={dismiss}
                style={({ pressed }) => [styles.closeBand, pressed && styles.pressed]}
              >
                <Text style={[textStyles.caption, styles.closeHint]}>Close</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoHit: {
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  infoIcon: {
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  root: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: layout.screenPadding,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.70)",
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 0,
    maxHeight: "70%",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  purpose: {
    color: colors.textMuted,
  },
  /** Equal air above Close (after copy) and below Close (to card edge). */
  closeBand: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  closeHint: {
    color: colors.textMuted,
    marginBottom: 0,
    opacity: 0.4,
  },
});
