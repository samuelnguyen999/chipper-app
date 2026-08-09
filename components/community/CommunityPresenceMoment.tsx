import { useEffect, useRef } from "react";
import { Image, Modal, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, font, layout, spacing, textSize } from "../../constants";

export const COMMUNITY_PRESENCE_TITLE = "You've taken a moment to connect.";
export const COMMUNITY_PRESENCE_BODY = "Carry that presence with you.";

const COOKIE_CIRCLE = require("../../assets/watermarks/cookie_circle.png");

const ENTER_MS = 3000;
const HOLD_MS = 10000;
const EXIT_MS = 3000;
const ENTER_EASING = Easing.inOut(Easing.cubic);
const RISE_Y = 400;
/** Mark size vs shorter screen edge — keeps the circle smaller than full-bleed. */
const MARK_SIZE_RATIO = .80;

type CommunityPresenceMomentProps = {
  visible: boolean;
  /** Called after the timed hold + fade-out — not user-dismissible. */
  onClose: () => void;
};

/**
 * Presence moment — cookie-circle mark (no Watermark helper / no rectangle card).
 * Scrim fades; mark + copy rise together; hold; fade out.
 */
export default function CommunityPresenceMoment({
  visible,
  onClose,
}: CommunityPresenceMomentProps) {
  const { width, height } = useWindowDimensions();
  const markSize = Math.round(Math.min(width, height) * MARK_SIZE_RATIO);

  const backdropOpacity = useSharedValue(0);
  const stageOpacity = useSharedValue(0);
  const translateY = useSharedValue(RISE_Y);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!visible) {
      // Stay at opacity 0 — resetting to 1 + RISE_Y flashes the mark at its start pose
      // for a frame while Modal is still tearing down.
      backdropOpacity.value = 0;
      stageOpacity.value = 0;
      translateY.value = RISE_Y;
      return;
    }

    const enterTiming = { duration: ENTER_MS, easing: ENTER_EASING };
    const exitTiming = { duration: EXIT_MS, easing: ENTER_EASING };

    backdropOpacity.value = 0;
    stageOpacity.value = 0;
    translateY.value = RISE_Y;
    backdropOpacity.value = withTiming(1, enterTiming);
    stageOpacity.value = withTiming(1, enterTiming);
    translateY.value = withTiming(0, enterTiming);

    const finish = () => {
      onCloseRef.current();
    };

    const exitTimer = setTimeout(() => {
      backdropOpacity.value = withTiming(0, exitTiming);
      stageOpacity.value = withTiming(0, exitTiming, (finished) => {
        if (finished) runOnJS(finish)();
      });
    }, ENTER_MS + HOLD_MS);

    return () => clearTimeout(exitTimer);
  }, [visible, backdropOpacity, stageOpacity, translateY]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const stageStyle = useAnimatedStyle(() => ({
    opacity: stageOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        /* Intentional — presence is timed, not user-dismissible. */
      }}
      statusBarTranslucent
    >
      <View style={styles.root} pointerEvents="none">
        <Animated.View style={[styles.scrim, scrimStyle]} />
        <Animated.View style={[styles.stage, stageStyle]} accessibilityViewIsModal>
          <View style={[styles.markStack, { width: markSize, height: markSize }]}>
            <Image
              source={COOKIE_CIRCLE}
              style={styles.mark}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <View style={styles.content}>
              <Text style={[font("regular"), styles.title, textSize("md"), { lineHeight: 22 }]}>
                {COMMUNITY_PRESENCE_TITLE}
              </Text>
              <Text style={[font("regular"), styles.body, textSize("md"), { lineHeight: 22 }]}>
                {COMMUNITY_PRESENCE_BODY}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.80)",
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  /** Circle + copy share one box so text is centered in the mark. */
  markStack: {
    justifyContent: "center",
    alignItems: "center",
  },
  mark: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  content: {
    zIndex: 1,
    paddingHorizontal: layout.screenPadding,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: "center",
    alignSelf: "stretch",
  },
  body: {
    color: colors.textMuted,
    textAlign: "center",
    alignSelf: "stretch",
  },
});

