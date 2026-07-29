/**
 * Reflect lens stack — horizontal swipe + quiet arrows, calm stack peek.
 *
 * @see ../REFLECT_TUNING.md — tuning table, depth model, file section map (humans + agents).
 *
 * **At rest:** cyclic deck depth so all three lenses show peek edges on every active index.
 * **While dragging:** linear `stackPeekDepth` for z-order only (correct neighbor on 3→2, 2→1).
 * **On commit:** outgoing eases horizontally to center, then tucks to cyclic depth behind the new front.
 * **Stability:** `layers` is a memoized tuple so depth `useEffect` does not re-fire on unrelated re-renders.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../../constants";
import type { ReflectionChoice } from "../config";
import ChoiceCard from "./ChoiceCard";

// -----------------------------------------------------------------------------
// Tuning — change numbers here first; document in REFLECT_TUNING.md
// -----------------------------------------------------------------------------

/** Playing-card aspect + max size on screen */
const PLAYING_CARD_WIDTH_UNITS = 2.5;
const PLAYING_CARD_HEIGHT_UNITS = 3.5;
const CARD_MAX_WIDTH = 322;
const CARD_WIDTH_SCREEN_FRAC = 0.82;
const CARD_MAX_HEIGHT_SCREEN_FRAC = 0.48;

/** Rest stack: Y / scale / opacity per cyclic depth (0 = front, 1, 2) */
const PEEK_TRANSLATE_Y: [number, number, number] = [0, 7, 14];
const PEEK_SCALE: [number, number, number] = [1, 0.985, 0.97];
const PEEK_OPACITY: [number, number, number] = [1, 0.93, 0.88];

/** Shared motion when rest depth targets change (non-outgoing + outgoing after tuck delay) */
const STACK_TRANSITION_MS = 2000;
const STACK_EASING = Easing.out(Easing.cubic);

/** Outgoing card: horizontal return, then delayed depth tuck */
const OUTGOING_RETURN_MS = 1000;
const OUTGOING_TUCK_DELAY_MS = 100;
const OUTGOING_TUCK_MS = 760;
/** Must cover return + tuck + margin before `outgoingIndexSV` clears (see REFLECT_TUNING.md) */
const HANDOFF_CLEAR_MS = OUTGOING_RETURN_MS + OUTGOING_TUCK_DELAY_MS + OUTGOING_TUCK_MS + 80;
/** Fake horizontal offset when using chevrons (no drag distance) */
const ARROW_RELEASE_PX = 16;

/** Pan activation / vertical fail; swipe commit + drag clamp */
const PAN_ACTIVE_OFFSET_X = 14;
const PAN_FAIL_OFFSET_Y = 12;
const SWIPE_COMMIT_THRESHOLD_PX = 52;
const SWIPE_DRAG_CLAMP_PX = 64;

/** Cancelled swipe: `dragX` back to 0 */
const DRAG_RESET_MS = 2000;

// -----------------------------------------------------------------------------
// Card frame (max width/height from window)
// -----------------------------------------------------------------------------

/** Shared playing-card frame for stack + focus grow transition */
export function useReflectCardFrame() {
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

// -----------------------------------------------------------------------------
// Depth helpers — cyclic rest vs linear strip peek while dragging
// -----------------------------------------------------------------------------

function stackDepthCyclic(i: number, active: number, n: number): number {
  if (n <= 1) return 0;
  return (i - active + n * 4) % n;
}

function stackDepthCyclicUI(i: number, active: number, n: number): number {
  "worklet";
  if (n <= 1) return 0;
  return (i - active + n * 4) % n;
}

function stackPeekDepth(i: number, active: number, n: number): number {
  if (n <= 1 || i === active) return 0;
  if (n === 2) return 1;
  if (active === 0) return i === 1 ? 1 : 2;
  if (active === n - 1) return i === active - 1 ? 1 : 2;
  return i === active - 1 ? 1 : 2;
}

function stackPeekDepthUI(i: number, active: number, n: number): number {
  "worklet";
  if (n <= 1 || i === active) return 0;
  if (n === 2) return 1;
  if (active === 0) return i === 1 ? 1 : 2;
  if (active === n - 1) return i === active - 1 ? 1 : 2;
  return i === active - 1 ? 1 : 2;
}

function stackZIndexUI(
  index: number,
  ai: number,
  outgoing: number,
  n: number,
  dragX: number
): number {
  "worklet";
  if (outgoing >= 0 && outgoing < n) {
    if (index === ai) return 30;
    if (index === outgoing) return 20;
    return 10;
  }
  const dragging = Math.abs(dragX) > 1;
  const d = dragging ? stackPeekDepthUI(index, ai, n) : stackDepthCyclicUI(index, ai, n);
  return 10 + (2 - Math.min(d, 2)) * 10;
}

// -----------------------------------------------------------------------------
// Layer motion — shared values per card + depth target application
// -----------------------------------------------------------------------------

type LayerMotion = {
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
};

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
  return useMemo(
    () => [
      { translateY: translateY0, scale: scale0, opacity: opacity0 },
      { translateY: translateY1, scale: scale1, opacity: opacity1 },
      { translateY: translateY2, scale: scale2, opacity: opacity2 },
    ],
    [translateY0, scale0, opacity0, translateY1, scale1, opacity1, translateY2, scale2, opacity2]
  );
}

function applyDepthTargets(
  activeIndex: number,
  layers: LayerMotion[],
  choiceCount: number,
  outgoingIdx: number
) {
  const n = choiceCount;
  const timing = { duration: STACK_TRANSITION_MS, easing: STACK_EASING };
  const tuckTiming = { duration: OUTGOING_TUCK_MS, easing: STACK_EASING };
  const handoff = outgoingIdx >= 0 && outgoingIdx < n;

  for (let i = 0; i < n; i++) {
    cancelAnimation(layers[i]!.translateY);
    cancelAnimation(layers[i]!.scale);
    cancelAnimation(layers[i]!.opacity);

    const d = Math.min(stackDepthCyclic(i, activeIndex, n), 2) as 0 | 1 | 2;
    const ty = PEEK_TRANSLATE_Y[d];
    const sc = PEEK_SCALE[d];
    const op = PEEK_OPACITY[d];

    if (handoff && i === outgoingIdx) {
      layers[i]!.translateY.value = withDelay(
        OUTGOING_TUCK_DELAY_MS,
        withTiming(ty, tuckTiming)
      );
      layers[i]!.scale.value = withDelay(OUTGOING_TUCK_DELAY_MS, withTiming(sc, tuckTiming));
      layers[i]!.opacity.value = withDelay(OUTGOING_TUCK_DELAY_MS, withTiming(op, tuckTiming));
    } else {
      layers[i]!.translateY.value = withTiming(ty, timing);
      layers[i]!.scale.value = withTiming(sc, timing);
      layers[i]!.opacity.value = withTiming(op, timing);
    }
  }
}

type ReflectCardStackProps = {
  choices: readonly ReflectionChoice[];
  initialActiveIndex?: number;
  onSelectChoice: (choice: ReflectionChoice, index: number) => void;
};

// -----------------------------------------------------------------------------
// ReflectCardStack — state, gestures, arrows
// -----------------------------------------------------------------------------

export default function ReflectCardStack({
  choices,
  initialActiveIndex = 0,
  onSelectChoice,
}: ReflectCardStackProps) {
  const n = choices.length;
  if (n < 1 || n > 3) {
    throw new Error("ReflectCardStack supports 1–3 choices (current reflect lenses).");
  }

  const { width: cardWidth, height: cardHeight } = useReflectCardFrame();

  const clampedInitial = Math.max(0, Math.min(n - 1, initialActiveIndex));
  const [activeIndex, setActiveIndex] = useState(clampedInitial);
  const [purposeExpanded, setPurposeExpanded] = useState(false);
  const togglePurpose = useCallback(() => setPurposeExpanded((p) => !p), []);

  const activeIdxSV = useSharedValue(clampedInitial);
  const dragX = useSharedValue(0);
  const outgoingIndexSV = useSharedValue(-1);
  const outgoingHandoffX = useSharedValue(0);
  const layers = useThreeLayerMotions();

  useEffect(() => {
    activeIdxSV.value = activeIndex;
    const oi = outgoingIndexSV.value;
    applyDepthTargets(activeIndex, layers, n, oi);
    const id = setTimeout(() => {
      outgoingIndexSV.value = -1;
      outgoingHandoffX.value = 0;
      cancelAnimation(outgoingHandoffX);
    }, HANDOFF_CLEAR_MS);
    return () => clearTimeout(id);
  }, [activeIndex, n, layers, activeIdxSV, outgoingHandoffX, outgoingIndexSV]);

  const bumpActiveOnly = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => Math.max(0, Math.min(n - 1, prev + delta)));
    },
    [n]
  );

  const bumpIndex = useCallback(
    (delta: number) => {
      cancelAnimation(dragX);
      cancelAnimation(outgoingHandoffX);
      dragX.value = 0;
      setActiveIndex((prev) => {
        const next = Math.max(0, Math.min(n - 1, prev + delta));
        if (next !== prev) {
          outgoingIndexSV.value = prev;
          activeIdxSV.value = next;
          const startX = delta > 0 ? -ARROW_RELEASE_PX : ARROW_RELEASE_PX;
          outgoingHandoffX.value = startX;
          outgoingHandoffX.value = withTiming(0, { duration: OUTGOING_RETURN_MS, easing: STACK_EASING });
        }
        return next;
      });
    },
    [activeIdxSV, dragX, n, outgoingHandoffX, outgoingIndexSV]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-PAN_ACTIVE_OFFSET_X, PAN_ACTIVE_OFFSET_X])
        .failOffsetY([-PAN_FAIL_OFFSET_Y, PAN_FAIL_OFFSET_Y])
        .onBegin(() => {
          "worklet";
          cancelAnimation(dragX);
          cancelAnimation(outgoingHandoffX);
        })
        .onUpdate((e) => {
          "worklet";
          const x = e.translationX;
          dragX.value = Math.max(-SWIPE_DRAG_CLAMP_PX, Math.min(SWIPE_DRAG_CLAMP_PX, x));
        })
        .onEnd(() => {
          "worklet";
          const releaseX = dragX.value;
          const ai = activeIdxSV.value;
          const atEnd = n - 1;
          let committed = false;
          if (releaseX < -SWIPE_COMMIT_THRESHOLD_PX && ai < atEnd) {
            dragX.value = 0;
            outgoingIndexSV.value = ai;
            activeIdxSV.value = ai + 1;
            outgoingHandoffX.value = releaseX;
            outgoingHandoffX.value = withTiming(0, { duration: OUTGOING_RETURN_MS, easing: STACK_EASING });
            runOnJS(bumpActiveOnly)(1);
            committed = true;
          } else if (releaseX > SWIPE_COMMIT_THRESHOLD_PX && ai > 0) {
            dragX.value = 0;
            outgoingIndexSV.value = ai;
            activeIdxSV.value = ai - 1;
            outgoingHandoffX.value = releaseX;
            outgoingHandoffX.value = withTiming(0, { duration: OUTGOING_RETURN_MS, easing: STACK_EASING });
            runOnJS(bumpActiveOnly)(-1);
            committed = true;
          }
          if (!committed) {
            dragX.value = withTiming(0, { duration: DRAG_RESET_MS, easing: STACK_EASING });
          }
        }),
    [activeIdxSV, bumpActiveOnly, dragX, n, outgoingHandoffX, outgoingIndexSV]
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
              activeIdxSV={activeIdxSV}
              outgoingIndexSV={outgoingIndexSV}
              outgoingHandoffX={outgoingHandoffX}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              purposeExpanded={purposeExpanded}
              onTogglePurpose={togglePurpose}
              onSelectChoice={() => onSelectChoice(item, i)}
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

// -----------------------------------------------------------------------------
// StackedChoiceCard — per-card animated wrapper + ChoiceCard
// -----------------------------------------------------------------------------

type StackedChoiceCardProps = {
  choice: ReflectionChoice;
  index: number;
  activeIndex: number;
  choiceCount: number;
  layer: LayerMotion;
  dragX: SharedValue<number>;
  activeIdxSV: SharedValue<number>;
  outgoingIndexSV: SharedValue<number>;
  outgoingHandoffX: SharedValue<number>;
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
  activeIdxSV,
  outgoingIndexSV,
  outgoingHandoffX,
  cardWidth,
  cardHeight,
  purposeExpanded,
  onTogglePurpose,
  onSelectChoice,
}: StackedChoiceCardProps) {
  const depth = stackDepthCyclic(index, activeIndex, choiceCount);

  const animatedStyle = useAnimatedStyle(() => {
    const ai = activeIdxSV.value;
    const oi = outgoingIndexSV.value;
    const dx = dragX.value;
    const isOutgoing = oi === index;
    const tx = isOutgoing ? outgoingHandoffX.value : index === ai ? dx : 0;
    const z = stackZIndexUI(index, ai, oi, choiceCount, dx);

    return {
      transform: [
        { translateX: tx },
        { translateY: layer.translateY.value },
        { scale: layer.scale.value },
      ],
      opacity: layer.opacity.value,
      zIndex: z,
    };
  }, [
    index,
    choiceCount,
    activeIdxSV,
    outgoingIndexSV,
    outgoingHandoffX,
    layer.translateY,
    layer.scale,
    layer.opacity,
    dragX,
  ]);

  return (
    <Animated.View
      pointerEvents={depth === 0 ? "auto" : "none"}
      style={[StyleSheet.absoluteFillObject, animatedStyle, { justifyContent: "center", alignItems: "center" }]}
    >
      <ChoiceCard
        type={choice.type}
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

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

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
