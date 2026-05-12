import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { layout, spacing } from "../../../constants";
import { receiveCopy, receiveTiming } from "./config";
import { useLandingFlow } from "./flow";
import ReceiveLandingPonderCtaSlot from "./parts/PonderCtaSlot";
import ReceiveLandingPonderHint from "./parts/PonderHint";
import ReceiveLandingHeading from "./parts/Heading";
import ReceiveLandingQuote from "./parts/Quote";

type LandingProps = { onContinueToReflect: () => void };

export default function Landing({ onContinueToReflect }: LandingProps) {
  const { phase, ponderProgress, completeHeadingSlide } = useLandingFlow();
  const [containerHeight, setContainerHeight] = useState(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const translateY = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  const layoutReady = containerHeight > 0 && headingHeight > 0;
  const slideStartedRef = useRef(false);
  const fadeStartedRef = useRef(false);
  const [headingShown, setHeadingShown] = useState(false);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => setContainerHeight(e.nativeEvent.layout.height), []);
  const onHeadingLayout = useCallback((e: LayoutChangeEvent) => setHeadingHeight(e.nativeEvent.layout.height), []);
  const onHeadingSlideDone = useCallback(() => completeHeadingSlide(), [completeHeadingSlide]);

  useEffect(() => {
    if (!layoutReady || phase !== "message_only") return;
    translateY.value = (containerHeight - headingHeight) / 2;
    setHeadingShown(true);
  }, [layoutReady, phase, containerHeight, headingHeight]);

  useEffect(() => {
    if (phase !== "heading_sliding" || !layoutReady) {
      if (phase !== "heading_sliding") slideStartedRef.current = false;
      return;
    }
    if (slideStartedRef.current) return;
    slideStartedRef.current = true;
    setHeadingShown(true);
    const startY = (containerHeight - headingHeight) / 2;
    translateY.value = startY;
    translateY.value = withTiming(
      spacing.md,
      { duration: receiveTiming.headingSlideDurationMs, easing: Easing.inOut(Easing.cubic) },
      (finished) => finished && runOnJS(onHeadingSlideDone)(),
    );
  }, [phase, layoutReady, containerHeight, headingHeight, onHeadingSlideDone]);

  useEffect(() => {
    if (phase !== "quote_visible" || fadeStartedRef.current) return;
    fadeStartedRef.current = true;
    quoteOpacity.value = withTiming(1, {
      duration: receiveTiming.quoteFadeInDurationMs,
      easing: Easing.out(Easing.quad),
    });
  }, [phase]);

  const headingAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const quoteAnimatedStyle = useAnimatedStyle(() => ({ opacity: quoteOpacity.value }));
  const showQuote = phase === "quote_visible" || phase === "pondering" || phase === "continue_ready";
  const showPonderBand = phase === "pondering" || phase === "continue_ready";
  const ponderProgressValue = phase === "continue_ready" ? 100 : phase === "pondering" ? ponderProgress : 0;
  const headerBandReserve = headingHeight > 0 ? spacing.md + headingHeight : spacing.md + 32;

  return (
    <View style={styles.root} onLayout={onContainerLayout}>
      <View style={styles.mainPadded}>
        <View style={[styles.centerStage, { paddingTop: headerBandReserve }]} pointerEvents="box-none">
          <View style={styles.centerCluster} pointerEvents="box-none">
            <Animated.View
              style={[styles.stretchSlot, quoteAnimatedStyle]}
              pointerEvents={showQuote ? "auto" : "none"}
              accessibilityElementsHidden={!showQuote}
              importantForAccessibility={showQuote ? "auto" : "no"}
            >
              <ReceiveLandingQuote text={receiveCopy.quote} />
            </Animated.View>
            {showPonderBand ? <ReceiveLandingPonderHint text={receiveCopy.ponderHint} /> : null}
          </View>
        </View>
      </View>

      <ReceiveLandingPonderCtaSlot
        visible={showPonderBand}
        showButton={phase === "continue_ready"}
        progress={ponderProgressValue}
        label={receiveCopy.continueCta}
        ponderHint={receiveCopy.ponderHint}
        onContinue={onContinueToReflect}
      />

      <Animated.View
        style={[styles.headingLayer, headingAnimatedStyle, !headingShown && styles.headingPreLayout]}
        pointerEvents="box-none"
      >
        <View onLayout={onHeadingLayout}>
          <ReceiveLandingHeading title={receiveCopy.heading} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: "100%", paddingTop: layout.receiveLandingPaddingTop },
  mainPadded: { flex: 1, minHeight: 0, paddingHorizontal: layout.screenPadding },
  centerStage: { flex: 1, justifyContent: "center", minHeight: 0 },
  centerCluster: { gap: layout.sectionGap, alignSelf: "stretch" },
  headingLayer: {
    position: "absolute", left: 0, right: 0, top: 0, alignItems: "center",
    paddingHorizontal: layout.screenPadding, zIndex: 2,
  },
  headingPreLayout: { opacity: 0 },
  stretchSlot: { alignSelf: "stretch" },
});
