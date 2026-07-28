import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  scaleFontSize,
  scaleLineHeight,
  spacing,
  textSize,
  textStyles,
} from "../../../../constants";
import CardShell, {
  cardShellContentHeight,
  cardShellContentWidth,
} from "../../../cards/CardShell";
import { PURPOSE_SLOT_HEIGHT } from "./ChoiceCard";
import { useReflectCardFrame } from "./ReflectCardStack";
import { lensColorForType } from "../config";
import type { TodayQuestion } from "../questions";
import {
  getReflectionVisibilityPreference,
  setReflectionVisibilityPreference,
} from "../../../../lib/reflectionPreferences";

export type FocusChoice = {
  type: TodayQuestion["type"];
  mode: string;
  prompt: string;
  purpose: string;
};

export type ReflectionVisibility = "public" | "private";

type FocusViewProps = {
  choice: FocusChoice;
  /** Increment from parent to run shrink-out then {@link FocusViewProps.onBack}. */
  backNonce?: number;
  isSubmitting?: boolean;
  onBack: () => void;
  onSubmitResponse: (input: {
    mode: string;
    prompt: string;
    response: string;
    visibility: ReflectionVisibility;
  }) => void | Promise<void>;
};

const GROW_MS = 2000;
const GROW_EASING = Easing.inOut(Easing.cubic);
const GROW_TIMING = { duration: GROW_MS, easing: GROW_EASING };
/** Shared with Reflect “All lenses” back link — long soft fade with the response field. */
export const FOCUS_RESPONSE_FADE_MS = 8500;
export const FOCUS_GROW_MS = GROW_MS;
export const FOCUS_GROW_EASING = GROW_EASING;
const RESPONSE_FADE_MS = FOCUS_RESPONSE_FADE_MS;
const VISIBILITY_BTN = 32;
const VISIBILITY_GAP = 2;
const VISIBILITY_PAD = 2;
const VISIBILITY_TRACK_W = VISIBILITY_BTN * 2 + VISIBILITY_GAP + VISIBILITY_PAD * 2;
const TOGGLE_MS = 220;
const TOGGLE_TIMING = { duration: TOGGLE_MS, easing: GROW_EASING };

/** Match ChoiceCard info row + purpose slot — Focus collapses this in sync with prompt. */
function modeRowHeight(): number {
  return Math.ceil(scaleFontSize("body") * 1.2) + spacing.xs;
}

function focusChromeHeight(): number {
  return modeRowHeight();
}

/**
 * translateY from ChoiceCard absolute center (0) to header under compact mode row.
 * Negative moves up. Uses measured prompt height + target card content height.
 */
function promptHeaderOffset(innerHeight: number, promptHeight: number): number {
  if (innerHeight < 1 || promptHeight < 1) return 0;
  const targetCenter = focusChromeHeight() + promptHeight / 2;
  return targetCenter - innerHeight / 2;
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value: ReflectionVisibility;
  onChange: (value: ReflectionVisibility) => void;
}) {
  const isPrivate = value === "private";
  const thumbX = useSharedValue(isPrivate ? VISIBILITY_BTN : 0);

  useEffect(() => {
    thumbX.value = withTiming(isPrivate ? VISIBILITY_BTN : 0, TOGGLE_TIMING);
  }, [isPrivate, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isPrivate ? "Private. Tap to switch to public." : "Public. Tap to switch to private."
      }
      onPress={() => onChange(isPrivate ? "public" : "private")}
      style={({ pressed }) => [styles.visibilityTrack, pressed && styles.visibilityTrackPressed]}
    >
      <Animated.View pointerEvents="none" style={[styles.visibilityThumb, thumbStyle]} />
      <View style={styles.visibilityBtn}>
        <Ionicons
          name="globe-outline"
          size={20}
          color={!isPrivate ? colors.onPrimary : colors.textMuted}
        />
      </View>
      <View style={styles.visibilityBtn}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={isPrivate ? colors.onPrimary : colors.textMuted}
          style={styles.visibilityLockIcon}
        />
      </View>
    </Pressable>
  );
}

export default function FocusView({
  choice,
  backNonce = 0,
  isSubmitting = false,
  onBack,
  onSubmitResponse,
}: FocusViewProps) {
  const { type, mode, prompt } = choice;
  const { width: cardWidth, height: cardHeight } = useReflectCardFrame();
  const stackPromptWidth = cardShellContentWidth(cardWidth);
  const modeColor = lensColorForType(type);
  const [response, setResponse] = useState("");
  const [visibility, setVisibility] = useState<ReflectionVisibility>("public");
  const [slotSize, setSlotSize] = useState({ width: 0, height: 0 });
  const [promptHeight, setPromptHeight] = useState(0);
  const isExitingRef = useRef(false);
  const inputRef = useRef<TextInputType>(null);
  const preferredVisibilityRef = useRef<ReflectionVisibility>("public");
  const growStartedRef = useRef(false);

  const canSubmit = response.trim().length > 0 && !isSubmitting;

  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = response.trim();
    if (!trimmed || isSubmitting) return;
    dismissKeyboard();
    try {
      await onSubmitResponse({ mode, prompt, response: trimmed, visibility });
      preferredVisibilityRef.current = visibility;
      await setReflectionVisibilityPreference(visibility);
    } catch {
      // Parent owns error UI; do not persist preference on failed save.
    }
  }, [dismissKeyboard, isSubmitting, mode, onSubmitResponse, prompt, response, visibility]);

  /** 0 = stack handoff (full purpose chrome, centered prompt); 1 = focus settled. */
  const progress = useSharedValue(0);
  const animW = useSharedValue(cardWidth);
  const animH = useSharedValue(cardHeight);
  const promptTy = useSharedValue(0);
  const responseOpacity = useSharedValue(0);
  const toggleReveal = useSharedValue(0);

  useEffect(() => {
    toggleReveal.value = withTiming(canSubmit ? 1 : 0, TOGGLE_TIMING);
  }, [canSubmit, toggleReveal]);

  useEffect(() => {
    let cancelled = false;

    void getReflectionVisibilityPreference().then((preferred) => {
      if (cancelled) return;
      preferredVisibilityRef.current = preferred;
      setVisibility(preferred);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setResponse("");
    setVisibility(preferredVisibilityRef.current);
    setPromptHeight(0);
    growStartedRef.current = false;
    isExitingRef.current = false;
  }, [mode]);

  useEffect(() => {
    if (isExitingRef.current) return;
    progress.value = 0;
    animW.value = cardWidth;
    animH.value = cardHeight;
    promptTy.value = 0;
    responseOpacity.value = 0;
    growStartedRef.current = false;
  }, [mode, cardWidth, cardHeight, progress, animW, animH, promptTy, responseOpacity]);

  useEffect(() => {
    if (isExitingRef.current || growStartedRef.current) return;
    if (slotSize.width < 1 || slotSize.height < 1 || promptHeight < 1) return;

    growStartedRef.current = true;
    const headerTy = promptHeaderOffset(
      cardShellContentHeight(slotSize.height),
      promptHeight,
    );

    progress.value = withTiming(1, GROW_TIMING);
    animW.value = withTiming(slotSize.width, GROW_TIMING);
    animH.value = withTiming(slotSize.height, GROW_TIMING);
    promptTy.value = withTiming(headerTy, GROW_TIMING);
    responseOpacity.value = withTiming(1, {
      duration: RESPONSE_FADE_MS,
      easing: GROW_EASING,
    });
  }, [
    slotSize.width,
    slotSize.height,
    promptHeight,
    progress,
    animW,
    animH,
    promptTy,
    responseOpacity,
  ]);

  useEffect(() => {
    if (backNonce < 1 || isExitingRef.current) return;
    isExitingRef.current = true;

    responseOpacity.value = withTiming(0, {
      duration: GROW_MS * 0.35,
      easing: GROW_EASING,
    });
    progress.value = withTiming(0, GROW_TIMING);
    animW.value = withTiming(cardWidth, GROW_TIMING);
    animH.value = withTiming(cardHeight, GROW_TIMING);
    // Return to absolute center + full stack chrome, then unmount.
    promptTy.value = withTiming(0, GROW_TIMING, (finished) => {
      if (finished) runOnJS(onBack)();
    });
  }, [backNonce, cardWidth, cardHeight, progress, animW, animH, promptTy, responseOpacity, onBack]);

  const cardStyle = useAnimatedStyle(() => ({
    width: animW.value,
    height: animH.value,
  }));

  const promptStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: promptTy.value }],
  }));

  const purposeSlotStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [PURPOSE_SLOT_HEIGHT, 0]),
  }));

  const chromeExtrasStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45], [1, 0], "clamp"),
  }));

  const responseStyle = useAnimatedStyle(() => ({
    opacity: responseOpacity.value,
  }));

  const toggleRevealStyle = useAnimatedStyle(() => ({
    width: toggleReveal.value * VISIBILITY_TRACK_W,
    opacity: toggleReveal.value,
    transform: [{ translateX: (1 - toggleReveal.value) * -16 }],
  }));

  const responseTopPad =
    focusChromeHeight() + Math.max(promptHeight, scaleLineHeight("body")) + spacing.md;

  return (
    <View style={styles.main}>
      <View
        style={styles.slot}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSlotSize((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height },
          );
        }}
      >
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <CardShell style={[styles.card, { borderColor: modeColor }]}>
            <View style={styles.canvas}>
              {/* Match ChoiceCard: prompt centered on full face; chrome overlays. */}
              <Animated.View
                style={[styles.promptLayer, promptStyle]}
                pointerEvents="none"
              >
                <View style={styles.promptPressable}>
                  <View
                    style={{ width: stackPromptWidth }}
                    onLayout={(e) => {
                      const h = e.nativeEvent.layout.height;
                      setPromptHeight((prev) => (prev === h ? prev : h));
                    }}
                  >
                    <Text
                      style={[
                        font("semibold"),
                        styles.prompt,
                        textSize("title"),
                        { lineHeight: scaleLineHeight("body") },
                      ]}
                    >
                      “{prompt}”
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <View style={styles.modeChrome} pointerEvents="none">
                <View style={styles.leadRow}>
                  <Text style={[font("semibold"), textSize("body"), { color: modeColor }]}>
                    {mode}
                  </Text>
                  <Animated.View style={[styles.chromeExtras, chromeExtrasStyle]}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.textMuted}
                      style={styles.infoIcon}
                    />
                    <Text style={[font("regular"), styles.infoHint, textSize("sm")]}>
                      Tap for purpose
                    </Text>
                  </Animated.View>
                </View>
                <Animated.View style={purposeSlotStyle} />
              </View>

              <Animated.View
                style={[
                  styles.responseBlock,
                  responseStyle,
                  { paddingTop: responseTopPad },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  value={response}
                  onChangeText={setResponse}
                  placeholder="Respond here..."
                  placeholderTextColor={colors.textMuted}
                  style={[font("regular"), styles.responseInput, textSize("md")]}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={dismissKeyboard}
                />
              </Animated.View>
            </View>
          </CardShell>
        </Animated.View>
      </View>

      <View style={styles.footerRow} accessibilityRole="toolbar">
        <Animated.View
          style={[styles.footerToggleSlot, toggleRevealStyle]}
          pointerEvents={canSubmit ? "auto" : "none"}
        >
          <VisibilityToggle value={visibility} onChange={setVisibility} />
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Submit reflection"
          accessibilityState={{ disabled: !canSubmit }}
          disabled={!canSubmit}
          hitSlop={8}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitHit,
            !canSubmit && styles.submitDisabled,
            pressed && canSubmit && styles.submitPressed,
          ]}
        >
          <Text
            style={[
              textStyles.buttonLabel,
              styles.submitLabel,
              !canSubmit && styles.submitLabelDisabled,
            ]}
          >
            {isSubmitting ? "Saving…" : "Submit"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  slot: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrap: {
    maxWidth: "100%",
  },
  card: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    overflow: "hidden",
  },
  canvas: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    position: "relative",
  },
  /** Same idea as ChoiceCard promptLayer — full-face vertical center. */
  promptLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "stretch",
    zIndex: 1,
  },
  /** Match ChoiceCard promptPressable so vertical center lines up on handoff. */
  promptPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  modeChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: colors.surfaceCard,
  },
  leadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  chromeExtras: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  infoHint: {
    color: colors.textMuted,
  },
  prompt: {
    color: colors.text,
    textAlign: "center",
    width: "100%",
  },
  responseBlock: {
    flex: 1,
    minHeight: 0,
    zIndex: 0,
  },
  responseInput: {
    flex: 1,
    color: colors.text,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    minHeight: 120,
  },
  /** Match ReflectCardStack arrowsRow so the card slot shares the same vertical center. */
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  footerToggleSlot: {
    overflow: "hidden",
  },
  visibilityTrack: {
    flexDirection: "row",
    alignItems: "center",
    width: VISIBILITY_TRACK_W,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: (VISIBILITY_BTN + VISIBILITY_PAD * 2) / 2,
    padding: VISIBILITY_PAD,
    gap: VISIBILITY_GAP,
    position: "relative",
    overflow: "hidden",
  },
  visibilityTrackPressed: {
    opacity: 0.75,
  },
  visibilityThumb: {
    position: "absolute",
    top: VISIBILITY_PAD,
    left: VISIBILITY_PAD,
    width: VISIBILITY_BTN,
    height: VISIBILITY_BTN,
    borderRadius: VISIBILITY_BTN / 2,
    backgroundColor: colors.textMuted,
  },
  visibilityBtn: {
    width: VISIBILITY_BTN,
    height: VISIBILITY_BTN,
    borderRadius: VISIBILITY_BTN / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  visibilityLockIcon: {
    transform: [{ translateX: -1.5 }, { translateY: 0 }],
  },
  submitHit: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  submitPressed: { opacity: 0.75 },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { color: colors.primary },
  submitLabelDisabled: { color: colors.textMuted },
});
