import { ScrollView, StyleSheet, Text, View } from "react-native";
import CommunityReflectionCard from "../../components/community";
import { layout, screen, textStyles } from "../../constants";
import { useReflectionResponses } from "../../state/ReflectionResponsesContext";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function CommunityScreen() {
  useRedirectWhenTabsLocked();
  const { responses } = useReflectionResponses();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={textStyles.screenTitle}>Community</Text>
      {responses.length === 0 ? (
        <Text style={textStyles.body}>
          Your submitted reflections will appear here as cards.
        </Text>
      ) : (
        <View style={styles.cards}>
          {responses.map((entry) => (
            <CommunityReflectionCard
              key={entry.id}
              mode={entry.mode}
              prompt={entry.prompt}
              response={entry.response}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
  cards: {
    gap: layout.screenColumnGap,
  },
});