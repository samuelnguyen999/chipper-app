import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import CommunityReflectionCard from "../../components/community";
import { layout, screen, textStyles } from "../../constants";
import { getTodaysCommunity, type ReflectionRow } from "../../lib/reflections";
import { isNetworkError } from "../../lib/offlineReflections";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

type LoadState = "pending" | "ready" | "error" | "offline";

export default function CommunityScreen() {
  useRedirectWhenTabsLocked();
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("pending");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const net = await NetInfo.fetch();
          if (net.isConnected === false) {
            if (!cancelled) {
              setLoadState((prev) => (prev === "ready" ? prev : "offline"));
            }
            return;
          }

          const rows = await getTodaysCommunity();
          if (!cancelled) {
            setReflections(rows);
            setLoadState("ready");
          }
        } catch (error) {
          if (!cancelled) {
            const offline = isNetworkError(error);
            setLoadState((prev) => {
              if (prev === "ready") return prev;
              return offline ? "offline" : "error";
            });
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
      {loadState === "pending" ? null : loadState === "offline" ? (
        <Text style={textStyles.body}>
          No internet.{"\n\n"}Connect to see today's community.
        </Text>
      ) : loadState === "error" ? (
        <Text style={textStyles.body}>Community public posts appear here.</Text>
      ) : reflections.length === 0 ? (
        <Text style={textStyles.body}>
          Your submitted reflections will appear here as cards.
        </Text>
      ) : (
        <View style={styles.cards}>
          {reflections.map((entry) => (
            <CommunityReflectionCard key={entry.id} reflection={entry} />
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
