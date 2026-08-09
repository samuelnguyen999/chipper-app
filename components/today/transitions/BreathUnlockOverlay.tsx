import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, layout, textStyles } from "../../../constants";

const INHALE_MS = 3000;
const EXHALE_MS = 4500;
const HOLD_MS = 1000;
/** After third exhale settles at tab height — fade cocoa to reveal real tabs. */
const SHEET_FADE_OUT_MS = 900;
const BREATH_EASING = Easing.inOut(Easing.cubic);

type CoverKey = "hidden" | "settled" | "half" | "bottomThird" | "topThird" | "full";

/** Single timeline — motion, opacity, labels, and callbacks all derive from this. */
const SEQUENCE: readonly {
  cover: CoverKey;
  duration: number;
  holdAfter: number;
  label: "Breathe in" | "Breathe out";
  /** Fire onCovered when this move completes (full cover). */
  covered?: boolean;
}[] = [
  /** Rise from off-screen over Focus — no cream veil. */
  { cover: "half", duration: INHALE_MS, holdAfter: HOLD_MS, label: "Breathe in" },
  { cover: "bottomThird", duration: EXHALE_MS, holdAfter: HOLD_MS, label: "Breathe out" },
  { cover: "topThird", duration: INHALE_MS, holdAfter: HOLD_MS, label: "Breathe in" },
  { cover: "half", duration: EXHALE_MS, holdAfter: HOLD_MS, label: "Breathe out" },
  { cover: "full", duration: INHALE_MS, holdAfter: HOLD_MS, label: "Breathe in", covered: true },
  /** Third breathe-out: cocoa → tab height; cream unveils 1→0 in parallel. */
  { cover: "settled", duration: EXHALE_MS, holdAfter: 0, label: "Breathe out" },
  // Then sheet opacity fades (SHEET_FADE_OUT_MS) — not a cover move.
];

type BreathUnlockOverlayProps = {
  visible: boolean;
  onFinished: () => void;
  /** End of final inhale (full cover) — navigate under the sheet here. */
  onCovered?: () => void;
};

/**
 * Post-unlock breath sheet. Presentational only — caller owns navigation.
 * Cocoa sheet rises over Focus; Community loads under full cover.
 * Cream unveils (100→0) on the third breathe-out as cocoa settles to tab height,
 * then the cocoa sheet fades out.
 */
export default function BreathUnlockOverlay({
  visible,
  onFinished,
  onCovered,
}: BreathUnlockOverlayProps) {
  const [overlayHeight, setOverlayHeight] = useState(0);
  const [label, setLabel] = useState("Breathe in");
  const translateY = useSharedValue(0);
  const stageHeight = useSharedValue(0);
  const labelHeight = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);
  /** Cream veil — fades in over Focus; unveils (1→0) on third breathe-out with cocoa settle. */
  const backdropOpacity = useSharedValue(0);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const coveredRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  const onCoveredRef = useRef(onCovered);
  onFinishedRef.current = onFinished;
  onCoveredRef.current = onCovered;

  const settledHeight = layout.tabBarDockBodyHeight;

  const yForCover = (coverHeight: number, stage: number) =>
    Math.max(0, stage - coverHeight);

  const coversForStage = (stage: number): Record<CoverKey, number> => ({
    hidden: stage,
    settled: yForCover(settledHeight, stage),
    half: yForCover(stage * 0.5, stage),
    bottomThird: yForCover(stage / 3, stage),
    topThird: yForCover((stage * 2) / 3, stage),
    full: 0,
  });

  const onOverlayLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== overlayHeight) {
      stageHeight.value = h;
      // Park sheet below the fold before React paints with a real height (avoids full-screen brown flash).
      translateY.value = h;
      labelOpacity.value = 0;
      sheetOpacity.value = 1;
      backdropOpacity.value = 0;
      setOverlayHeight(h);
    }
  };

  useEffect(() => {
    if (!visible) {
      startedRef.current = false;
      finishedRef.current = false;
      coveredRef.current = false;
      cancelAnimation(translateY);
      cancelAnimation(labelOpacity);
      cancelAnimation(sheetOpacity);
      cancelAnimation(backdropOpacity);
      labelOpacity.value = 0;
      sheetOpacity.value = 1;
      backdropOpacity.value = 0;
      setLabel("Breathe in");
      return;
    }

    if (overlayHeight <= 0 || startedRef.current) return;
    startedRef.current = true;

    const stage = overlayHeight;
    stageHeight.value = stage;
    const covers = coversForStage(stage);

    finishedRef.current = false;
    coveredRef.current = false;
    cancelAnimation(translateY);
    cancelAnimation(labelOpacity);
    cancelAnimation(sheetOpacity);
    cancelAnimation(backdropOpacity);
    translateY.value = covers.hidden;
    labelOpacity.value = 0;
    sheetOpacity.value = 1;
    backdropOpacity.value = 0;
    setLabel(SEQUENCE[0]!.label);

    const moveTo = (to: number, duration: number) =>
      withTiming(to, { duration, easing: BREATH_EASING });
    const fadeTo = (to: number, duration: number) =>
      withTiming(to, { duration, easing: BREATH_EASING });

    translateY.value = withSequence(
      moveTo(covers[SEQUENCE[0]!.cover], SEQUENCE[0]!.duration),
      withDelay(SEQUENCE[0]!.holdAfter, moveTo(covers[SEQUENCE[1]!.cover], SEQUENCE[1]!.duration)),
      withDelay(SEQUENCE[1]!.holdAfter, moveTo(covers[SEQUENCE[2]!.cover], SEQUENCE[2]!.duration)),
      withDelay(SEQUENCE[2]!.holdAfter, moveTo(covers[SEQUENCE[3]!.cover], SEQUENCE[3]!.duration)),
      withDelay(SEQUENCE[3]!.holdAfter, moveTo(covers[SEQUENCE[4]!.cover], SEQUENCE[4]!.duration)),
      withDelay(SEQUENCE[4]!.holdAfter, moveTo(covers[SEQUENCE[5]!.cover], SEQUENCE[5]!.duration)),
    );

    labelOpacity.value = withSequence(
      fadeTo(1, SEQUENCE[0]!.duration),
      withDelay(SEQUENCE[0]!.holdAfter, fadeTo(0, SEQUENCE[1]!.duration)),
      withDelay(SEQUENCE[1]!.holdAfter, fadeTo(1, SEQUENCE[2]!.duration)),
      withDelay(SEQUENCE[2]!.holdAfter, fadeTo(0, SEQUENCE[3]!.duration)),
      withDelay(SEQUENCE[3]!.holdAfter, fadeTo(1, SEQUENCE[4]!.duration)),
      withDelay(SEQUENCE[4]!.holdAfter, fadeTo(0, SEQUENCE[5]!.duration)),
    );

    // Fade in through first inhale → hold → first exhale (full cream).
    // Hold at 100% until third breathe-out, then unveil 1→0 while cocoa settles
    // to tab height — complete before the cocoa sheet opacity fade.
    const finalExhale = SEQUENCE[SEQUENCE.length - 1]!;
    const veilInMs =
      SEQUENCE[0]!.duration + SEQUENCE[0]!.holdAfter + SEQUENCE[1]!.duration;
    const toFinalExhaleStart = SEQUENCE.slice(0, -1).reduce(
      (sum, step) => sum + step.duration + step.holdAfter,
      0,
    );
    backdropOpacity.value = withSequence(
      fadeTo(1, veilInMs),
      withDelay(
        Math.max(0, toFinalExhaleStart - veilInMs),
        fadeTo(0, finalExhale.duration),
      ),
    );

    const breathMs = SEQUENCE.reduce(
      (sum, step) => sum + step.duration + step.holdAfter,
      0,
    );
    // After cream unveils and cocoa is at tab height, fade cocoa sheet away.
    sheetOpacity.value = withDelay(breathMs, fadeTo(0, SHEET_FADE_OUT_MS));

    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 0;
    for (let i = 0; i < SEQUENCE.length; i++) {
      const step = SEQUENCE[i]!;
      if (i > 0) {
        timers.push(setTimeout(() => setLabel(step.label), t));
      }
      t += step.duration;
      if (step.covered) {
        const coveredAt = t;
        timers.push(
          setTimeout(() => {
            if (coveredRef.current) return;
            coveredRef.current = true;
            onCoveredRef.current?.();
          }, coveredAt),
        );
      }
      t += step.holdAfter;
    }
    timers.push(
      setTimeout(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onFinishedRef.current();
      }, breathMs + SHEET_FADE_OUT_MS),
    );

    return () => {
      for (const id of timers) clearTimeout(id);
      cancelAnimation(translateY);
      cancelAnimation(labelOpacity);
      cancelAnimation(sheetOpacity);
      cancelAnimation(backdropOpacity);
    };
  }, [visible, overlayHeight, settledHeight]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  /** Center label in visible band via transform only (no band height layout). */
  const labelStyle = useAnimatedStyle(() => {
    const visibleBand = Math.max(0, stageHeight.value - translateY.value);
    return {
      opacity: labelOpacity.value,
      transform: [
        {
          translateY: translateY.value + visibleBand / 2 - labelHeight.value / 2,
        },
      ],
    };
  });

  if (!visible) return null;

  const ready = overlayHeight > 0;

  return (
    <View
      style={styles.overlay}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel={label}
      onLayout={onOverlayLayout}
    >
      {ready ? (
        <>
          <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
          <Animated.View
            style={[styles.sheet, { height: overlayHeight }, sheetStyle]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.labelLayer, labelStyle]}
            pointerEvents="none"
            onLayout={(e) => {
              labelHeight.value = e.nativeEvent.layout.height;
            }}
          >
            <Animated.Text style={[textStyles.screenTitle, styles.label]}>{label}</Animated.Text>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: colors.tabHeader,
  },
  labelLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    alignItems: "center",
  },
  label: {
    color: colors.background,
    textAlign: "center",
    marginBottom: 0,
  },
});
