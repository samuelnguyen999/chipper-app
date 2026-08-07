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
import Watermark from "../../ui/Watermark";
import { isPonderHintVisible, receiveCopy, receiveTiming } from "./config";
import { useLandingFlow } from "./flow";
import ReceiveLandingPonderCtaSlot from "./parts/PonderCtaSlot";
import ReceiveLandingPonderHint from "./parts/PonderHint";
import ReceiveLandingHeading from "./parts/Heading";
import ReceiveLandingQuote from "./parts/Quote";

type LandingProps = { onContinueToReflect: () => void };

export default function Landing({ onContinueToReflect }: LandingProps) {
  const { phase, ponderProgress, completeHeadingSlide } = useLandingFlow();
  /** Stage above CTA dock — same box Today recap uses above the tab bar. */
  const [stageHeight, setStageHeight] = useState(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const translateY = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  const ponderHintOpacity = useSharedValue(0);
  const layoutReady = stageHeight > 0 && headingHeight > 0;
  const slideStartedRef = useRef(false);
  const fadeStartedRef = useRef(false);
  const [headingShown, setHeadingShown] = useState(false);

  const onStageLayout = useCallback((e: LayoutChangeEvent) => setStageHeight(e.nativeEvent.layout.height), []);
  const onHeadingLayout = useCallback((e: LayoutChangeEvent) => setHeadingHeight(e.nativeEvent.layout.height), []);
  const onHeadingSlideDone = useCallback(() => completeHeadingSlide(), [completeHeadingSlide]);

  useEffect(() => {
    if (!layoutReady || phase !== "message_only") return;
    translateY.value = (stageHeight - headingHeight) / 2;
    setHeadingShown(true);
  }, [layoutReady, phase, stageHeight, headingHeight]);

  useEffect(() => {
    if (phase !== "heading_sliding" || !layoutReady) {
      if (phase !== "heading_sliding") slideStartedRef.current = false;
      return;
    }
    if (slideStartedRef.current) return;
    slideStartedRef.current = true;
    setHeadingShown(true);
    const startY = (stageHeight - headingHeight) / 2;
    translateY.value = startY;
    translateY.value = withTiming(
      spacing.md,
      { duration: receiveTiming.headingSlideDurationMs, easing: Easing.inOut(Easing.cubic) },
      (finished) => finished && runOnJS(onHeadingSlideDone)(),
    );
  }, [phase, layoutReady, stageHeight, headingHeight, onHeadingSlideDone]);

  useEffect(() => {
    if (phase !== "quote_visible" || fadeStartedRef.current) return;
    fadeStartedRef.current = true;
    quoteOpacity.value = withTiming(1, {
      duration: receiveTiming.quoteFadeInDurationMs,
      easing: Easing.out(Easing.quad),
    });
  }, [phase]);

  const showQuote = phase === "quote_visible" || phase === "pondering" || phase === "continue_ready";
  const showPonderBand = phase === "pondering" || phase === "continue_ready";
  const ponderProgressValue = phase === "continue_ready" ? 100 : phase === "pondering" ? ponderProgress : 0;
  const ponderElapsedMs = (ponderProgressValue / 100) * receiveTiming.ponderDurationMs;
  const showPonderHint = showPonderBand && isPonderHintVisible(ponderElapsedMs);

  useEffect(() => {
    if (!showPonderBand) {
      ponderHintOpacity.value = 0;
      return;
    }
    ponderHintOpacity.value = withTiming(showPonderHint ? 1 : 0, {
      duration: receiveTiming.ponderHintFadeMs,
      easing: Easing.inOut(Easing.quad),
    });
  }, [showPonderBand, showPonderHint, ponderHintOpacity]);

  const headingAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const quoteAnimatedStyle = useAnimatedStyle(() => ({ opacity: quoteOpacity.value }));
  const headerBandReserve = headingHeight > 0 ? spacing.md + headingHeight : spacing.md + 32;

  return (
    <View style={styles.root}>
      <View style={styles.watermarkStage} onLayout={onStageLayout}>
        <Watermark surface="receive" />
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
              {showPonderBand ? (
                <ReceiveLandingPonderHint
                  text={receiveCopy.ponderHint}
                  opacity={ponderHintOpacity}
                  visible={showPonderHint}
                />
              ) : null}
            </View>
          </View>
        </View>

        <Animated.View
          style={[styles.headingLayer, headingAnimatedStyle, !headingShown && styles.headingPreLayout]}
          pointerEvents="box-none"
        >
          <View onLayout={onHeadingLayout}>
            <ReceiveLandingHeading title={receiveCopy.heading} />
          </View>
        </Animated.View>
      </View>

      {/* Same height as tab bar body — keeps watermark stage identical to Today recap. */}
      {showPonderBand ? (
        <ReceiveLandingPonderCtaSlot
          visible
          showButton={phase === "continue_ready"}
          progress={ponderProgressValue}
          label={receiveCopy.continueCta}
          ponderHint={receiveCopy.ponderHint}
          onContinue={onContinueToReflect}
        />
      ) : (
        <View style={styles.ctaDockReserve} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    /** Landing-only top breathe — keeps “Today’s Message” at the pre-stage settle. */
    paddingTop: layout.receiveLandingPaddingTop,
  },
  /** Above CTA/tab dock — same vertical box as TodayRecap `watermarkStage`. */
  watermarkStage: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    overflow: "hidden",
  },
  mainPadded: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: layout.screenPadding,
    zIndex: 1,
  },
  centerStage: { flex: 1, justifyContent: "center", minHeight: 0 },
  centerCluster: { gap: layout.sectionGap, alignSelf: "stretch" },
  headingLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    zIndex: 2,
  },
  headingPreLayout: { opacity: 0 },
  stretchSlot: { alignSelf: "stretch" },
  ctaDockReserve: {
    width: "100%",
    height: layout.tabBarDockBodyHeight,
  },
});
