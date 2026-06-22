import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, textStyles } from "../../../../constants";

type ReceiveLandingPonderCtaSlotProps = {
  visible: boolean;
  showButton: boolean;
  progress: number;
  label: string;
  ponderHint: string;
  onContinue: () => void;
};

export default function ReceiveLandingPonderCtaSlot({
  visible,
  showButton,
  progress,
  label,
  ponderHint,
  onContinue,
}: ReceiveLandingPonderCtaSlotProps) {
  const insets = useSafeAreaInsets();
  const progressLayerOpacity = useSharedValue(1);
  const buttonLayerOpacity = useSharedValue(0);
  const clamped = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    if (!visible) return;
    if (showButton) {
      progressLayerOpacity.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) });
      buttonLayerOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
    } else {
      progressLayerOpacity.value = 1;
      buttonLayerOpacity.value = 0;
    }
  }, [visible, showButton]);

  const progressLayerStyle = useAnimatedStyle(() => ({ opacity: progressLayerOpacity.value }));
  const buttonLayerStyle = useAnimatedStyle(() => ({ opacity: buttonLayerOpacity.value }));
  if (!visible) return null;

  const a11yProgress = !showButton;
  return (
    <View style={[styles.wrap, { marginBottom: -insets.bottom, paddingBottom: insets.bottom }]}>
      <View
        style={styles.measurementHost}
        importantForAccessibility={showButton ? "no" : "yes"}
        accessibilityRole={a11yProgress ? "progressbar" : undefined}
        accessibilityLabel={a11yProgress ? `${ponderHint}. ${Math.round(clamped)} percent.` : undefined}
        accessibilityValue={a11yProgress ? { min: 0, max: 100, now: Math.round(clamped) } : undefined}
      >
        <View style={styles.sizer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[textStyles.buttonLabel, styles.buttonLabelText]} numberOfLines={1}>{label}</Text>
        </View>
        <Animated.View style={[styles.layer, progressLayerStyle]} pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <View style={styles.track}><View style={[styles.fill, { width: `${clamped}%` }]} /></View>
        </Animated.View>
        <Animated.View
          style={[styles.layer, buttonLayerStyle]}
          pointerEvents={showButton ? "box-none" : "none"}
          importantForAccessibility={showButton ? "yes" : "no-hide-descendants"}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={!showButton}
            onPress={onContinue}
            style={({ pressed }) => [styles.pressable, pressed && showButton && styles.pressablePressed]}
          >
            <Text style={[textStyles.buttonLabel, styles.buttonLabelText]} numberOfLines={1}>{label}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: colors.tabHeader,
    borderTopWidth: layout.tabBarDockBorderTop,
    borderTopColor: colors.borderSubtle,
  },
  measurementHost: {
    position: "relative",
    width: "100%",
    height: layout.tabBarDockBodyHeight,
    paddingBottom: layout.tabBarDockPaddingBottom,
    overflow: "hidden",
  },
  sizer: {
    opacity: 0,
    width: "100%",
    height: "100%",
    paddingTop: layout.tabBarDockPaddingTop,
    paddingBottom: layout.tabBarDockItemPaddingBottom,
    paddingHorizontal: layout.screenPadding,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { ...StyleSheet.absoluteFillObject },
  track: { width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.18)", overflow: "hidden" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: colors.accent },
  pressable: {
    flex: 1, width: "100%", height: "100%", backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    paddingTop: layout.tabBarDockPaddingTop, paddingBottom: layout.tabBarDockItemPaddingBottom, paddingHorizontal: layout.screenPadding,
  },
  pressablePressed: { opacity: 0.92 },
  buttonLabelText: { color: colors.onPrimary },
});
