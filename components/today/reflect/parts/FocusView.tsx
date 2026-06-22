import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, font, layout, scaleFontSize, scaleLineHeight, screen, spacing, textSize, textStyles } from "../../../../constants";

export type FocusChoice = {
  mode: string;
  prompt: string;
  purpose: string;
};

type FocusViewProps = {
  choice: FocusChoice;
  onBack: () => void;
  contentBottomInset?: number;
  onSubmitResponse: (input: { mode: string; prompt: string; response: string }) => void;
};

type LensVariant = "zoom" | "stretchY" | "stretchX";
const SPRING_GROUND = { damping: 17, stiffness: 190, mass: 1 };
const SPRING_SOFT = { damping: 16, stiffness: 170, mass: 1 };

function variantForMode(mode: string): LensVariant {
  switch (mode) {
    case "Ground":
      return "zoom";
    case "Understand":
      return "stretchY";
    case "Align":
      return "stretchX";
    default:
      return "zoom";
  }
}

function useLensEntrance(mode: string) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const variant = variantForMode(mode);
    if (variant === "zoom") {
      opacity.value = 0;
      scale.value = 0.82;
      scaleX.value = 1;
      scaleY.value = 1;
      translateY.value = 0;
      opacity.value = withSpring(1, SPRING_GROUND);
      scale.value = withSpring(1, SPRING_GROUND);
      return;
    }
    if (variant === "stretchY") {
      opacity.value = 0;
      scale.value = 1;
      scaleX.value = 1;
      scaleY.value = 0.08;
      translateY.value = 44;
      opacity.value = withSpring(1, SPRING_SOFT);
      scaleY.value = withSpring(1, SPRING_SOFT);
      translateY.value = withSpring(0, SPRING_SOFT);
      return;
    }
    opacity.value = 0;
    scale.value = 1;
    scaleX.value = 0.08;
    scaleY.value = 1;
    translateY.value = 0;
    opacity.value = withSpring(1, SPRING_SOFT);
    scaleX.value = withSpring(1, SPRING_SOFT);
  }, [mode]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));
}

export default function FocusView({
  choice,
  onBack,
  contentBottomInset = 0,
  onSubmitResponse,
}: FocusViewProps) {
  const { mode, prompt } = choice;
  const animatedStyle = useLensEntrance(mode);
  const [response, setResponse] = useState("");
  useEffect(() => setResponse(""), [mode]);

  return (
    <ScrollView
      style={screen.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { ...screen.scrollContent, paddingBottom: layout.screenScrollBottomPadding + contentBottomInset },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.animatedWrap, animatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to all reflection lenses"
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backRow, pressed && styles.backPressed]}
        >
          <Text style={[textSize("lg"), styles.backChevron]}>←</Text>
          <Text style={[textStyles.buttonLabel, styles.backLabel]}>All lenses</Text>
        </Pressable>
        <View style={styles.focusBlock}>
          <Text style={[font("semibold"), styles.mode, textSize("sm")]}>{mode}</Text>
          <Text
            style={[
              font("semibold"),
              styles.prompt,
              { fontSize: scaleFontSize("title") + 2, lineHeight: scaleLineHeight("body") + 8 },
            ]}
          >
            “{prompt}”
          </Text>
          <Text style={[textStyles.caption, styles.responseLabel]}>Your response</Text>
          <TextInput
            value={response}
            onChangeText={setResponse}
            placeholder="Respond here..."
            placeholderTextColor={colors.textMuted}
            style={[font("regular"), styles.responseInput, textSize("md")]}
            returnKeyType="done"
            onSubmitEditing={() => {
              const trimmed = response.trim();
              if (!trimmed) return;
              onSubmitResponse({ mode, prompt, response: trimmed });
              setResponse("");
              onBack();
            }}
            blurOnSubmit
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: "flex-start" },
  animatedWrap: { width: "100%", alignSelf: "stretch" },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, alignSelf: "flex-start", marginBottom: spacing.xl, paddingVertical: spacing.xs },
  backPressed: { opacity: 0.7 },
  backChevron: { color: colors.primary },
  backLabel: { color: colors.primary },
  focusBlock: { width: "100%", alignItems: "stretch" },
  mode: { letterSpacing: 1, color: colors.accent, textTransform: "uppercase", marginBottom: spacing.md },
  prompt: { color: colors.text, marginBottom: spacing.xxl },
  responseLabel: { marginTop: spacing.xxl, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  responseInput: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: spacing.sm,
    backgroundColor: colors.surfaceCard,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
