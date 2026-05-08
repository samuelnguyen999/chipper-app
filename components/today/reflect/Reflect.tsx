import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout, screen, textStyles } from "../../../constants";
import { useReflectionResponses } from "../../../state/ReflectionResponsesContext";
import { useTabAccess } from "../../../state/TabAccessContext";
import { reflectionChoices, type ReflectionChoice } from "./config";
import ReflectionChoiceCard from "./ReflectionChoiceCard";
import ReflectionFocusView from "./ReflectionFocusView";

type ReflectProps = { onUnlocked?: () => void };

export default function Reflect({ onUnlocked }: ReflectProps) {
  const insets = useSafeAreaInsets();
  const { addResponse } = useReflectionResponses();
  const { unlockMainTabs, mainTabsUnlocked } = useTabAccess();
  const handleUnlocked = useCallback(() => onUnlocked?.(), [onUnlocked]);
  const [focusedChoice, setFocusedChoice] = useState<ReflectionChoice | null>(null);
  const bottomPad = layout.screenScrollBottomPadding + (!mainTabsUnlocked ? insets.bottom : 0);

  if (focusedChoice) {
    return (
      <ReflectionFocusView
        choice={focusedChoice}
        onBack={() => setFocusedChoice(null)}
        contentBottomInset={!mainTabsUnlocked ? insets.bottom : 0}
        onSubmitResponse={({ mode, prompt, response }) => {
          if (addResponse({ mode, prompt, response })) {
            unlockMainTabs();
            handleUnlocked();
          }
        }}
      />
    );
  }

  return (
    <View style={[screen.fill, { paddingTop: layout.screenPadding, paddingHorizontal: layout.screenPadding, paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reflect</Text>
        <Text style={textStyles.screenSubtitle}>Choose a lens—each opens a different way into reflection.</Text>
      </View>
      <View style={styles.cards}>
        {reflectionChoices.map((item) => (
          <ReflectionChoiceCard
            key={item.mode}
            mode={item.mode}
            prompt={item.prompt}
            purpose={item.purpose}
            onPress={() => setFocusedChoice(item)}
            style={styles.card}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignSelf: "stretch", marginBottom: layout.screenHeaderAfterMargin },
  title: { ...textStyles.screenTitle },
  cards: { flex: 1, width: "100%", gap: layout.screenColumnGap },
  card: { flex: 1 },
});
