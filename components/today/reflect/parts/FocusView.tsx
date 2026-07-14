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
import CardShell from "../../../cards/CardShell";
import { useReflectCardFrame } from "./ReflectCardStack";
import {
  getReflectionVisibilityPreference,
  setReflectionVisibilityPreference,
} from "../../../../lib/reflectionPreferences";

export type FocusChoice = {
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
/** Soft ease-in-out — no sharp acceleration at start or end */
const GROW_EASING = Easing.inOut(Easing.cubic);
const GROW_TIMING = { duration: GROW_MS, easing: GROW_EASING };
const RESPONSE_FADE_MS = 8500;
const VISIBILITY_BTN = 32;
const VISIBILITY_GAP = 2;
const VISIBILITY_PAD = 2;
const VISIBILITY_TRACK_W = VISIBILITY_BTN * 2 + VISIBILITY_GAP + VISIBILITY_PAD * 2;
const TOGGLE_MS = 220;
const TOGGLE_TIMING = { duration: TOGGLE_MS, easing: GROW_EASING };
/** Match ChoiceCard: prompt is vertically centered on the full card face (mode overlays in stack). */
function promptStartOffset(cardHeight: number): number {
  const innerHeight = cardHeight - spacing.lg * 2;
  const modeHeight = Math.ceil(scaleFontSize("body") * 1.2);
  const promptHeight = scaleLineHeight("body");
  const promptTopInFlow = modeHeight + spacing.xs;
  return Math.max(0, innerHeight / 2 - promptTopInFlow - promptHeight / 2);
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
  const { mode, prompt } = choice;
  const { width: cardWidth, height: cardHeight } = useReflectCardFrame();
  const [response, setResponse] = useState("");
  const [visibility, setVisibility] = useState<ReflectionVisibility>("public");
  const [slotSize, setSlotSize] = useState({ width: 0, height: 0 });
  const isExitingRef = useRef(false);
  const inputRef = useRef<TextInputType>(null);
  const preferredVisibilityRef = useRef<ReflectionVisibility>("public");

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

  const animW = useSharedValue(cardWidth);
  const animH = useSharedValue(cardHeight);
  const promptTy = useSharedValue(promptStartOffset(cardHeight));
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
  }, [mode]);

  useEffect(() => {
    if (isExitingRef.current) return;
    animW.value = cardWidth;
    animH.value = cardHeight;
    promptTy.value = promptStartOffset(cardHeight);
    responseOpacity.value = 0;
  }, [mode, cardWidth, cardHeight, animW, animH, promptTy, responseOpacity]);

  useEffect(() => {
    if (slotSize.width < 1 || slotSize.height < 1 || isExitingRef.current) return;

    animW.value = withTiming(slotSize.width, GROW_TIMING);
    animH.value = withTiming(slotSize.height, GROW_TIMING);
    promptTy.value = withTiming(0, GROW_TIMING);
    responseOpacity.value = withTiming(1, {
      duration: RESPONSE_FADE_MS,
      easing: GROW_EASING,
    });
  }, [slotSize.width, slotSize.height, animW, animH, promptTy, responseOpacity]);

  useEffect(() => {
    if (backNonce < 1 || isExitingRef.current) return;
    isExitingRef.current = true;

    const promptOffset = promptStartOffset(cardHeight);
    responseOpacity.value = withTiming(0, {
      duration: GROW_MS * 0.35,
      easing: GROW_EASING,
    });
    animW.value = withTiming(cardWidth, GROW_TIMING);
    animH.value = withTiming(cardHeight, GROW_TIMING);
    promptTy.value = withTiming(promptOffset, GROW_TIMING, (finished) => {
      if (finished) runOnJS(onBack)();
    });
  }, [backNonce, cardWidth, cardHeight, animW, animH, promptTy, responseOpacity, onBack]);

  const cardStyle = useAnimatedStyle(() => ({
    width: animW.value,
    height: animH.value,
  }));

  const promptStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: promptTy.value }],
  }));

  const responseStyle = useAnimatedStyle(() => ({
    opacity: responseOpacity.value,
  }));

  const toggleRevealStyle = useAnimatedStyle(() => ({
    width: toggleReveal.value * VISIBILITY_TRACK_W,
    opacity: toggleReveal.value,
    transform: [{ translateX: (1 - toggleReveal.value) * -16 }],
  }));

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
            <CardShell style={styles.card}>
              <Text style={[font("semibold"), styles.mode, textSize("body")]}>{mode}</Text>
              <Animated.View style={promptStyle}>
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
              </Animated.View>
              <Animated.View style={[styles.responseBlock, responseStyle]}>
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
            <Text style={[textStyles.buttonLabel, styles.submitLabel, !canSubmit && styles.submitLabelDisabled]}>
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
  mode: {
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  prompt: {
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  responseBlock: {
    flex: 1,
    minHeight: 0,
    marginTop: spacing.sm,
  },
  responseInput: {
    flex: 1,
    color: colors.text,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    minHeight: 120,
  },
  /** Matches ReflectCardStack `arrowsRow` — reserve space for future actions */
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
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
