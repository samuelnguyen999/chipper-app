import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import CommunityReflectionCard from "../../components/community";
import { layout, screen, textStyles } from "../../constants";
import { getTodaysCommunity, type ReflectionRow } from "../../lib/reflections";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Could not load community reflections.";
}

export default function CommunityScreen() {
  useRedirectWhenTabsLocked();
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);

        try {
          const rows = await getTodaysCommunity();
          if (!cancelled) {
            setReflections(rows);
          }
        } catch (loadError) {
          if (!cancelled) {
            setError(getLoadErrorMessage(loadError));
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void load();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={textStyles.screenTitle}>Community</Text>
      {loading ? (
        <Text style={textStyles.body}>Loading community reflections…</Text>
      ) : error ? (
        <Text style={textStyles.body}>{error}</Text>
      ) : reflections.length === 0 ? (
        <Text style={textStyles.body}>
          Your submitted reflections will appear here as cards.
        </Text>
      ) : (
        <View style={styles.cards}>
          {reflections.map((entry) => (
            <CommunityReflectionCard
              key={entry.id}
              mode={entry.card_type.toUpperCase()}
              prompt={entry.question}
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
