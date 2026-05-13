/**
 * Reflect lens stack — hybrid horizontal swipe + quiet arrows.
 *
 * Design intent (parameters below): calm “turn a card on a desk,” not carousel /
 * Tinder energy — stack peek, restrained motion, low visual density.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../../constants";
import type { ReflectionChoice } from "../config";
import ChoiceCard from "./ChoiceCard";

/** Playing card proportion 2.5" × 3.5" → height = width × (3.5/2.5). */
const PLAYING_CARD_WIDTH_UNITS = 2.5;
const PLAYING_CARD_HEIGHT_UNITS = 3.5;
const CARD_MAX_WIDTH = 322;
const CARD_WIDTH_SCREEN_FRAC = 0.82;
const CARD_MAX_HEIGHT_SCREEN_FRAC = 0.48;

function useReflectCardFrame() {
  const { width: sw, height: sh } = useWindowDimensions();
  return useMemo(() => {
    const maxW = Math.min(sw * CARD_WIDTH_SCREEN_FRAC, CARD_MAX_WIDTH);
    const maxH = sh * CARD_MAX_HEIGHT_SCREEN_FRAC;
    let width = maxW;
    let height = (width * PLAYING_CARD_HEIGHT_UNITS) / PLAYING_CARD_WIDTH_UNITS;
    if (height > maxH) {
      height = maxH;
      width = (height * PLAYING_CARD_WIDTH_UNITS) / PLAYING_CARD_HEIGHT_UNITS;
    }
    return { width, height };
  }, [sw, sh]);
}

/* -------------------------------------------------------------------------- */
/*  Motion & layout — tuned for quiet, weighted feel (see module comment).    */
/*  • Stack peek: subtle scale + tiny Y + modest opacity — not 3D deck.      */
/*  • Stack depth transition: slower settle after swipe (STACK_TRANSITION_MS). */
/*  • Swipe: horizontal only; drag clamped; no fling throw / no rotateZ.     */
/*  • Release drag axis: timing reset (no spring overshoot on translateX).   */
/* -------------------------------------------------------------------------- */

/** Stack depth (peek positions) after swipe / arrow — 2× prior 280ms for slower reveal */
const STACK_TRANSITION_MS = 560;

const STACK_EASING = Easing.out(Easing.cubic);

/** Horizontal activation before pan wins — reduces accidental drags vs taps */
const PAN_ACTIVE_OFFSET_X = 14;

/** Vertical tolerance before pan fails — keeps vertical scroll/taps on card */
const PAN_FAIL_OFFSET_Y = 12;

/** Commit swipe after this horizontal distance (px) — gentle, not “throw” */
const SWIPE_COMMIT_THRESHOLD_PX = 52;

/** Max drag translation (px) — slight resistance / no long fling visuals */
const SWIPE_DRAG_CLAMP_PX = 64;

/** Parallax on the card directly beneath front (fraction of dragX) */
const PEEK_PARALLAX_FRAC = 0.08;

/** Depth 0 = front reader card; 1 / 2 = recede behind with minimal Y */
const PEEK_TRANSLATE_Y: [number, number, number] = [0, 5, 11];

/** Subtle scale steps — front stays grounded at 1 */
const PEEK_SCALE: [number, number, number] = [1, 0.985, 0.97];

/** Opacity steps — low contrast peek, not a second hero surface */
const PEEK_OPACITY: [number, number, number] = [1, 0.91, 0.84];

/** Drag release after swipe decision — slightly longer to match slower stack settle */
const DRAG_RESET_MS = 480;

const stackTiming = {
  duration: STACK_TRANSITION_MS,
  easing: STACK_EASING,
};

type LayerMotion = {
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
};

/** Initial shared values assume `activeIndex === 0` (first lens on top). */
function useThreeLayerMotions(): [LayerMotion, LayerMotion, LayerMotion] {
  const translateY0 = useSharedValue(PEEK_TRANSLATE_Y[0]);
  const scale0 = useSharedValue(PEEK_SCALE[0]);
  const opacity0 = useSharedValue(PEEK_OPACITY[0]);
  const translateY1 = useSharedValue(PEEK_TRANSLATE_Y[1]);
  const scale1 = useSharedValue(PEEK_SCALE[1]);
  const opacity1 = useSharedValue(PEEK_OPACITY[1]);
  const translateY2 = useSharedValue(PEEK_TRANSLATE_Y[2]);
  const scale2 = useSharedValue(PEEK_SCALE[2]);
  const opacity2 = useSharedValue(PEEK_OPACITY[2]);
  return [
    { translateY: translateY0, scale: scale0, opacity: opacity0 },
    { translateY: translateY1, scale: scale1, opacity: opacity1 },
    { translateY: translateY2, scale: scale2, opacity: opacity2 },
  ];
}

function applyDepthTargets(
  activeIndex: number,
  layers: LayerMotion[],
  choiceCount: number
) {
  const n = choiceCount;
  for (let i = 0; i < n; i++) {
    const depth = (i - activeIndex + n * 4) % n;
    const d = Math.min(depth, 2) as 0 | 1 | 2;
    layers[i].translateY.value = withTiming(PEEK_TRANSLATE_Y[d], stackTiming);
    layers[i].scale.value = withTiming(PEEK_SCALE[d], stackTiming);
    layers[i].opacity.value = withTiming(PEEK_OPACITY[d], stackTiming);
  }
}

type ReflectCardStackProps = {
  choices: readonly ReflectionChoice[];
  onSelectChoice: (choice: ReflectionChoice) => void;
};

export default function ReflectCardStack({ choices, onSelectChoice }: ReflectCardStackProps) {
  const n = choices.length;
  if (n < 1 || n > 3) {
    throw new Error("ReflectCardStack supports 1–3 choices (current reflect lenses).");
  }

  const { width: cardWidth, height: cardHeight } = useReflectCardFrame();

  const [activeIndex, setActiveIndex] = useState(0);
  const [purposeExpanded, setPurposeExpanded] = useState(false);
  const togglePurpose = useCallback(() => setPurposeExpanded((p) => !p), []);

  const activeIdxSV = useSharedValue(0);
  const dragX = useSharedValue(0);

  const layers = useThreeLayerMotions();

  useEffect(() => {
    activeIdxSV.value = activeIndex;
  }, [activeIndex, activeIdxSV]);

  useEffect(() => {
    applyDepthTargets(activeIndex, layers, n);
  }, [activeIndex, layers, n]);

  const bumpIndex = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => Math.max(0, Math.min(n - 1, prev + delta)));
    },
    [n]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-PAN_ACTIVE_OFFSET_X, PAN_ACTIVE_OFFSET_X])
        .failOffsetY([-PAN_FAIL_OFFSET_Y, PAN_FAIL_OFFSET_Y])
        .onUpdate((e) => {
          "worklet";
          const x = e.translationX;
          dragX.value = Math.max(-SWIPE_DRAG_CLAMP_PX, Math.min(SWIPE_DRAG_CLAMP_PX, x));
        })
        .onEnd(() => {
          "worklet";
          const x = dragX.value;
          const ai = activeIdxSV.value;
          const atEnd = n - 1;
          if (x < -SWIPE_COMMIT_THRESHOLD_PX && ai < atEnd) {
            runOnJS(bumpIndex)(1);
          } else if (x > SWIPE_COMMIT_THRESHOLD_PX && ai > 0) {
            runOnJS(bumpIndex)(-1);
          }
          dragX.value = withTiming(0, { duration: DRAG_RESET_MS, easing: STACK_EASING });
        }),
    [activeIdxSV, bumpIndex, dragX, n]
  );

  return (
    <View style={styles.root} accessibilityLabel={`Lens ${activeIndex + 1} of ${n}`}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.stackSlot} collapsable={false}>
          {choices.map((item, i) => (
            <StackedChoiceCard
              key={item.mode}
              choice={item}
              index={i}
              activeIndex={activeIndex}
              choiceCount={n}
              layer={layers[i]!}
              dragX={dragX}
              parallaxFrac={PEEK_PARALLAX_FRAC}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              purposeExpanded={purposeExpanded}
              onTogglePurpose={togglePurpose}
              onSelectChoice={() => onSelectChoice(item)}
            />
          ))}
        </View>
      </GestureDetector>

      <View style={styles.arrowsRow} accessibilityRole="toolbar">
        <Pressable
          accessibilityLabel="Previous lens"
          accessibilityState={{ disabled: activeIndex <= 0 }}
          disabled={activeIndex <= 0}
          hitSlop={12}
          onPress={() => bumpIndex(-1)}
          style={({ pressed }) => [styles.arrowHit, pressed && styles.arrowPressed]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={colors.textMuted}
            style={[styles.arrowIcon, activeIndex <= 0 && styles.arrowIconDisabled]}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Next lens"
          accessibilityState={{ disabled: activeIndex >= n - 1 }}
          disabled={activeIndex >= n - 1}
          hitSlop={12}
          onPress={() => bumpIndex(1)}
          style={({ pressed }) => [styles.arrowHit, pressed && styles.arrowPressed]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
            style={[styles.arrowIcon, activeIndex >= n - 1 && styles.arrowIconDisabled]}
          />
        </Pressable>
      </View>
    </View>
  );
}

type StackedChoiceCardProps = {
  choice: ReflectionChoice;
  index: number;
  activeIndex: number;
  choiceCount: number;
  layer: LayerMotion;
  dragX: SharedValue<number>;
  parallaxFrac: number;
  cardWidth: number;
  cardHeight: number;
  purposeExpanded: boolean;
  onTogglePurpose: () => void;
  onSelectChoice: () => void;
};

function StackedChoiceCard({
  choice,
  index,
  activeIndex,
  choiceCount,
  layer,
  dragX,
  parallaxFrac,
  cardWidth,
  cardHeight,
  purposeExpanded,
  onTogglePurpose,
  onSelectChoice,
}: StackedChoiceCardProps) {
  const depth = (index - activeIndex + choiceCount * 4) % choiceCount;

  const animatedStyle = useAnimatedStyle(() => {
    const dx = dragX.value;
    let tx = 0;
    if (depth === 0) tx = dx;
    else if (depth === 1) tx = dx * parallaxFrac;
    return {
      transform: [{ translateX: tx }, { translateY: layer.translateY.value }, { scale: layer.scale.value }],
      opacity: layer.opacity.value,
    };
  }, [depth, parallaxFrac, layer.opacity, layer.scale, layer.translateY, dragX]);

  const zIndex = 30 - Math.min(depth, 2) * 8;

  return (
    <Animated.View
      pointerEvents={depth === 0 ? "auto" : "none"}
      style={[StyleSheet.absoluteFillObject, animatedStyle, { zIndex, justifyContent: "center", alignItems: "center" }]}
    >
      <ChoiceCard
        mode={choice.mode}
        prompt={choice.prompt}
        purpose={choice.purpose}
        purposeExpanded={purposeExpanded}
        onTogglePurpose={onTogglePurpose}
        onPress={onSelectChoice}
        style={{ width: cardWidth, height: cardHeight }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
  },
  stackSlot: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  /** Icons low in the column — avoids “hero carousel” center weight */
  arrowsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  arrowHit: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  arrowPressed: {
    opacity: 0.75,
  },
  arrowIcon: {
    opacity: 0.85,
  },
  arrowIconDisabled: {
    opacity: 0.28,
  },
});
