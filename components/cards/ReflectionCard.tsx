import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Keyboard,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  colors,
  font,
  layout,
  scaleLineHeight,
  spacing,
  textSize,
  textStyles,
} from "../../constants";
import { lensColorForType } from "../today/reflect/config";
import { useScrollRail } from "../ui/ScrollRail";
import CardContainer from "./CardContainer";
import { ACTION_DIVIDER_WIDTH } from "../interactions/CardExpandedActions";
import CardShell, { CARD_SHELL_BORDER, CARD_SHELL_PADDING } from "./CardShell";
import type { ReflectionCardData } from "./types";

type ReflectionCardProps = {
  card: ReflectionCardData;
  onHold?: () => void;
  /** When set, rendered inside the card shell below reflection content. */
  footer?: ReactNode;
  /**
   * Bottom-border nicks under action dividers (from `resolveActionRow` splitCount).
   * Painted outside the shell so overflow can stay clipped for rounded corners.
   */
  borderSplits?: number;
  /** Inline edit — response only; prompt stays Text. */
  editing?: boolean;
  editDraft?: string;
  onEditDraftChange?: (text: string) => void;
  onSaveEdit?: () => void | Promise<void>;
  /** Delete exit: bottom edge rises to top until the card is gone. */
  exiting?: boolean;
  onExitComplete?: () => void;
};

/** Match ChoiceCard purpose toggle enter/exit durations. */
const EXPAND_MS = 800;
const COLLAPSE_MS = 640;
const EXPAND_EASING = Easing.inOut(Easing.cubic);
/** Delete presentation — height collapse / bottom-up wipe. */
const DELETE_EXIT_MS = 780;
const DELETE_EXIT_EASING = Easing.inOut(Easing.cubic);
/** Match Journal/Community `cards` column gap — collapse with the card so gaps don’t stack. */
const LIST_ITEM_GAP = layout.screenColumnGap;
/** Gray action band only — grows directly under the white card body. */
export const ACTIONS_SLOT_HEIGHT = 44;
/** Extra space above the keyboard when revealing an editing card. */
const KEYBOARD_REVEAL_PAD = 12;

export default function ReflectionCard({
  card,
  onHold,
  footer,
  borderSplits = 0,
  editing = false,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  exiting = false,
  onExitComplete,
}: ReflectionCardProps) {
  const borderColor = lensColorForType(card.type);
  const expanded = footer != null && !exiting;
  const scrollRail = useScrollRail();
  const cardRef = useRef<View>(null);
  const progress = useSharedValue(0);
  const exitProgress = useSharedValue(0);
  const measuredHeight = useSharedValue(0);
  const [slotFooter, setSlotFooter] = useState<ReactNode>(null);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const draft = editDraft ?? card.response;
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
  const exitStartedRef = useRef(false);
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

  const notifyExitComplete = () => {
    onExitCompleteRef.current?.();
  };

  /** Keep expanded actions above the rail’s bottom edge (last list items). */
  const revealInScroll = useCallback(
    (extraBottom = 0) => {
      if (!scrollRail) return;
      cardRef.current?.measureInWindow((_x, y, _w, h) => {
        if (h < 1) return;
        scrollRail.ensureWindowRectVisible(y, h + extraBottom);
      });
    },
    [scrollRail],
  );

  useEffect(() => {
    if (expanded) {
      setSlotFooter(footer);
    }
  }, [expanded, footer]);

  useEffect(() => {
    if (expanded) {
      progress.value = withTiming(1, {
        duration: EXPAND_MS,
        easing: EXPAND_EASING,
      });
      return;
    }

    progress.value = withTiming(
      0,
      { duration: COLLAPSE_MS, easing: EXPAND_EASING },
      (finished) => {
        if (finished) {
          runOnJS(setSlotFooter)(null);
        }
      },
    );
  }, [expanded, progress]);

  useEffect(() => {
    if (!expanded || !scrollRail) return;
    // Band height may still be 0 — reserve full action slot up front.
    revealInScroll(ACTIONS_SLOT_HEIGHT);
    // Re-measure as Reanimated height grows.
    const timers = [160, 320, 520, EXPAND_MS].map((ms) =>
      setTimeout(() => revealInScroll(0), ms),
    );
    return () => {
      for (const t of timers) clearTimeout(t);
      scrollRail.releaseBottomReserve();
    };
  }, [expanded, scrollRail, revealInScroll]);

  useEffect(() => {
    if (!editing) {
      setSelection(undefined);
      return;
    }
    const len = draft.length;
    setSelection({ start: len, end: len });
  }, [editing, card.id]);

  /** While editing, treat keyboard height as occluding the rail bottom. */
  useEffect(() => {
    if (!editing || !scrollRail) return;

    const onKeyboardShow = (e: KeyboardEvent) => {
      const keyboardHeight = e.endCoordinates.height;
      if (keyboardHeight < 1) return;
      const extra = keyboardHeight + KEYBOARD_REVEAL_PAD;
      requestAnimationFrame(() => {
        revealInScroll(extra);
        // Second pass after scroll/spacer layout settles.
        setTimeout(() => revealInScroll(extra), 80);
      });
    };

    const onKeyboardHide = () => {
      scrollRail.releaseBottomReserve();
    };

    const showSub = Keyboard.addListener("keyboardDidShow", onKeyboardShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
      scrollRail.releaseBottomReserve();
    };
  }, [editing, scrollRail, revealInScroll]);

  useEffect(() => {
    if (!exiting) {
      // Only reset if we never finished — avoid snapping full-height after a completed exit.
      if (exitProgress.value < 1) {
        exitStartedRef.current = false;
        exitProgress.value = 0;
      }
      return;
    }
    if (layoutHeight < 1 || exitStartedRef.current) return;
    exitStartedRef.current = true;
    measuredHeight.value = layoutHeight;
    exitProgress.value = withTiming(
      1,
      { duration: DELETE_EXIT_MS, easing: DELETE_EXIT_EASING },
      (finished) => {
        if (finished) {
          runOnJS(notifyExitComplete)();
        }
      },
    );
  }, [exiting, layoutHeight, exitProgress, measuredHeight]);

  const onCardLayout = (e: LayoutChangeEvent) => {
    if (exiting) return;
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== layoutHeight) {
      setLayoutHeight(h);
    }
  };

  const actionsSlotStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, ACTIONS_SLOT_HEIGHT]),
    overflow: "hidden" as const,
  }));

  /**
   * Collapse height in place (bottom-up wipe). List spacing lives on marginBottom
   * (not parent `gap`) so the wipe can shrink card + gap together — no double-gap jump
   * when the row is removed. Height is only locked while exiting so hold-expand can grow.
   */
  const exitStyle = useAnimatedStyle(() => {
    const marginBottom = interpolate(
      exitProgress.value,
      [0, 1],
      [LIST_ITEM_GAP, 0],
    );
    if (exitProgress.value === 0) {
      return { marginBottom };
    }
    const h = measuredHeight.value;
    if (h < 1) {
      return { marginBottom };
    }
    return {
      height: interpolate(exitProgress.value, [0, 1], [h, 0]),
      marginBottom,
      overflow: "hidden" as const,
    };
  });

  return (
    <Animated.View ref={cardRef} style={exitStyle} onLayout={onCardLayout}>
      <CardContainer onHold={editing || exiting ? undefined : onHold}>
        <View style={styles.shellWrap}>
          <CardShell style={[styles.shell, { borderColor }]}>
            <View style={styles.content}>
              <Text
                style={[
                  font("semibold"),
                  styles.prompt,
                  textSize("body"),
                  { lineHeight: scaleLineHeight("body") },
                ]}
              >
                “{card.prompt}”
              </Text>
              {editing ? (
                <TextInput
                  value={draft}
                  onChangeText={onEditDraftChange}
                  onSubmitEditing={() => void onSaveEdit?.()}
                  onBlur={() => void onSaveEdit?.()}
                  autoFocus
                  multiline
                  blurOnSubmit
                  returnKeyType="done"
                  textAlignVertical="top"
                  selection={selection}
                  onSelectionChange={() => {
                    if (selection != null) setSelection(undefined);
                  }}
                  style={[textStyles.body, styles.responseInput]}
                  accessibilityLabel="Edit reflection response"
                />
              ) : (
                <Text style={textStyles.body}>{card.response}</Text>
              )}
            </View>
            <Animated.View
              style={[styles.actionsBand, actionsSlotStyle, { backgroundColor: borderColor }]}
            >
              {slotFooter}
            </Animated.View>
          </CardShell>
          {expanded && borderSplits > 0
            ? Array.from({ length: borderSplits }, (_, i) => (
                <View
                  key={`border-notch-${i}`}
                  pointerEvents="none"
                  style={[
                    styles.borderNotch,
                    { left: `${((i + 1) / (borderSplits + 1)) * 100}%` },
                  ]}
                />
              ))
            : null}
        </View>
      </CardContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shellWrap: {
    position: "relative",
  },
  shell: {
    overflow: "hidden",
    backgroundColor: colors.surfaceCard,
    padding: 0,
  },
  /** White nick on the bottom border under each action divider. */
  borderNotch: {
    position: "absolute",
    bottom: 0,
    marginLeft: -ACTION_DIVIDER_WIDTH / 2,
    width: ACTION_DIVIDER_WIDTH,
    height: CARD_SHELL_BORDER,
    backgroundColor: colors.onPrimary,
    zIndex: 2,
  },
  /** White card body — same insets collapsed and expanded (no extra breath on hold). */
  content: {
    padding: CARD_SHELL_PADDING,
  },
  prompt: {
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  responseInput: {
    padding: 0,
    margin: 0,
    color: colors.text,
  },
  actionsBand: {
    justifyContent: "center",
  },
});
