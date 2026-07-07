import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, screen, spacing, textSize, textStyles } from "../../../constants";
import { useReflectionResponses } from "../../../state/ReflectionResponsesContext";
import { useTabAccess } from "../../../state/TabAccessContext";
import { reflectionChoices, type ReflectionChoice } from "./config";
import ReflectCardStack from "./parts/ReflectCardStack";
import FocusView from "./parts/FocusView";

type ReflectProps = { onUnlocked?: () => void };

export default function Reflect({ onUnlocked }: ReflectProps) {
  const insets = useSafeAreaInsets();
  const { addResponse } = useReflectionResponses();
  const { unlockMainTabs, mainTabsUnlocked } = useTabAccess();
  const handleUnlocked = useCallback(() => onUnlocked?.(), [onUnlocked]);
  const [focusedChoice, setFocusedChoice] = useState<ReflectionChoice | null>(null);
  const [stackIndex, setStackIndex] = useState(0);
  const [focusBackNonce, setFocusBackNonce] = useState(0);
  const bottomPad = layout.screenScrollBottomPadding + (!mainTabsUnlocked ? insets.bottom : 0);

  const handleSelectChoice = useCallback((choice: ReflectionChoice, index: number) => {
    setStackIndex(index);
    setFocusedChoice(choice);
    setFocusBackNonce(0);
  }, []);

  const handleFocusBack = useCallback(() => {
    setFocusedChoice(null);
  }, []);

  return (
    <View
      style={[
        screen.fill,
        {
          paddingTop: layout.screenPadding,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Reflect</Text>
        <Text style={textStyles.screenSubtitle}>Choose a lens — pick the one that fits today.</Text>
      </View>
      <View style={styles.backBand}>
        {focusedChoice ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to all reflection lenses"
            onPress={() => setFocusBackNonce((n) => n + 1)}
            hitSlop={12}
            style={({ pressed }) => [styles.backRow, pressed && styles.backPressed]}
          >
            <Text style={[textSize("lg"), styles.backChevron]}>←</Text>
            <Text style={[textStyles.buttonLabel, styles.backLabel]}>All lenses</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>
        {focusedChoice ? (
          <FocusView
            choice={focusedChoice}
            backNonce={focusBackNonce}
            onBack={handleFocusBack}
            onSubmitResponse={({ mode, prompt, response }) => {
              if (addResponse({ mode, prompt, response })) {
                setFocusedChoice(null);
                unlockMainTabs();
                handleUnlocked();
              }
            }}
          />
        ) : (
          <ReflectCardStack
            choices={reflectionChoices}
            initialActiveIndex={stackIndex}
            onSelectChoice={handleSelectChoice}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignSelf: "stretch", marginBottom: layout.screenHeaderAfterMargin },
  /** Reserved above card stack / focus — back link only when a lens is open */
  backBand: {
    minHeight: 36,
    marginBottom: spacing.sm,
    justifyContent: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  backPressed: { opacity: 0.7 },
  backChevron: { color: colors.primary },
  backLabel: { color: colors.primary },
  body: { flex: 1, width: "100%", minHeight: 0 },
});
