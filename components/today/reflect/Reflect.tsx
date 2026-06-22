import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout, screen, textStyles } from "../../../constants";
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
  const bottomPad = layout.screenScrollBottomPadding + (!mainTabsUnlocked ? insets.bottom : 0);

  if (focusedChoice) {
    return (
      <FocusView
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
        <Text style={textStyles.screenTitle}>Reflect</Text>
        <Text style={textStyles.screenSubtitle}>Choose a lens — pick the reflection that fits today.</Text>
      </View>
      <View style={styles.cards}>
        <ReflectCardStack choices={reflectionChoices} onSelectChoice={setFocusedChoice} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignSelf: "stretch", marginBottom: layout.screenHeaderAfterMargin },
  cards: { flex: 1, width: "100%" },
});
