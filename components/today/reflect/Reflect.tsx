import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { saveReflection } from "../../../lib/reflections";
import {
  addOfflineReflection,
  isNetworkError,
} from "../../../lib/offlineReflections";
import { supabase } from "../../../lib/supabase";
import { colors, layout, screen, spacing, textSize, textStyles } from "../../../constants";
import { useTabAccess } from "../../../state/TabAccessContext";
import { reflectionChoices, type ReflectionChoice } from "./config";
import ReflectCardStack from "./parts/ReflectCardStack";
import FocusView from "./parts/FocusView";

type ReflectProps = { onUnlocked?: () => void };

const OFFLINE_SAVE_MESSAGE =
  "Saved on this device. We'll upload when you're connected.";

function getSaveErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Could not save reflection. Please try again.";
}

async function shouldUseOfflineQueue(error: unknown): Promise<boolean> {
  if (isNetworkError(error)) return true;
  try {
    const net = await NetInfo.fetch();
    return net.isConnected === false;
  } catch {
    return false;
  }
}

export default function Reflect({ onUnlocked }: ReflectProps) {
  const insets = useSafeAreaInsets();
  const { unlockMainTabs, mainTabsUnlocked } = useTabAccess();
  const handleUnlocked = useCallback(() => onUnlocked?.(), [onUnlocked]);
  const [focusedChoice, setFocusedChoice] = useState<ReflectionChoice | null>(null);
  const [stackIndex, setStackIndex] = useState(0);
  const [focusBackNonce, setFocusBackNonce] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const bottomPad = layout.screenScrollBottomPadding + (!mainTabsUnlocked ? insets.bottom : 0);

  const handleSelectChoice = useCallback((choice: ReflectionChoice, index: number) => {
    setStackIndex(index);
    setFocusedChoice(choice);
    setFocusBackNonce(0);
    setSaveError(null);
  }, []);

  const handleFocusBack = useCallback(() => {
    setFocusedChoice(null);
    setSaveError(null);
  }, []);

  const completeUnlock = useCallback(() => {
    setFocusedChoice(null);
    unlockMainTabs();
    handleUnlocked();
  }, [handleUnlocked, unlockMainTabs]);

  const handleSubmitResponse = useCallback(
    async ({
      prompt,
      response,
      visibility,
    }: {
      mode: string;
      prompt: string;
      response: string;
      visibility: "public" | "private";
    }) => {
      if (!focusedChoice || isSaving) return;

      setIsSaving(true);
      setSaveError(null);

      const payload = {
        cardType: focusedChoice.type,
        question: prompt,
        response,
        isPublic: visibility === "public",
      };

      const saveOfflineAndUnlock = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await addOfflineReflection(payload, session?.user?.id ?? "");
        Alert.alert("Saved offline", OFFLINE_SAVE_MESSAGE);
        completeUnlock();
      };

      try {
        const net = await NetInfo.fetch();
        if (net.isConnected === false) {
          await saveOfflineAndUnlock();
          return;
        }

        await saveReflection(payload);
        completeUnlock();
      } catch (error) {
        if (await shouldUseOfflineQueue(error)) {
          try {
            await saveOfflineAndUnlock();
            return;
          } catch (offlineError) {
            setSaveError(getSaveErrorMessage(offlineError));
            throw offlineError;
          }
        }

        setSaveError(getSaveErrorMessage(error));
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [completeUnlock, focusedChoice, isSaving],
  );

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
      {saveError ? (
        <Text style={[textStyles.caption, styles.saveError]} accessibilityRole="alert">
          {saveError}
        </Text>
      ) : null}
      <View style={styles.body}>
        {focusedChoice ? (
          <FocusView
            choice={focusedChoice}
            backNonce={focusBackNonce}
            isSubmitting={isSaving}
            onBack={handleFocusBack}
            onSubmitResponse={handleSubmitResponse}
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
  saveError: {
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: { flex: 1, width: "100%", minHeight: 0 },
});
