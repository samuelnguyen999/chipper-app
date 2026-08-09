import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { screen } from "../../constants";
import { resolveDevGateFlags } from "../../state/onboardingGate";
import ReceiveLanding from "./receive";
import Reflect from "./reflect";

type TodayExperienceProps = {
  onUnlocked?: () => void;
};

const CROSSFADE_MS = 375;
const CROSSFADE_EASING = Easing.inOut(Easing.cubic);
/** Reflect fade-in starts slightly below, then settles up into place. */
const SETTLE_Y = 12;

/**
 * Receive → Reflect handoff: fade out landing, swap to card stack, fade in with a slight upward settle.
 */
export default function TodayExperience({ onUnlocked }: TodayExperienceProps) {
  const devStartAt = resolveDevGateFlags().startAt;
  const [showReflect, setShowReflect] = useState(devStartAt === "reflect");
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const fadeInReflect = useCallback(() => {
    setShowReflect(true);
    opacity.value = 0;
    translateY.value = SETTLE_Y;
    const timing = { duration: CROSSFADE_MS, easing: CROSSFADE_EASING };
    opacity.value = withTiming(1, timing);
    translateY.value = withTiming(0, timing);
  }, [opacity, translateY]);

  const onContinueToReflect = useCallback(() => {
    opacity.value = withTiming(
      0,
      { duration: CROSSFADE_MS, easing: CROSSFADE_EASING },
      (finished) => {
        if (finished) runOnJS(fadeInReflect)();
      },
    );
  }, [fadeInReflect, opacity]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, sceneStyle]}>
      {showReflect ? (
        <Reflect onUnlocked={onUnlocked} />
      ) : (
        <ReceiveLanding onContinueToReflect={onContinueToReflect} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: screen.tabSceneRoot,
});
