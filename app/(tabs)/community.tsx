import { StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import CommunityReflectionCard from "../../components/community";
import {
  CardInteractionProvider,
  useCardInteraction,
  type ResolveCardActionHandlers,
} from "../../components/interactions";
import ScrollRail from "../../components/ui/ScrollRail";
import { layout, screen, textStyles } from "../../constants";
import { useAnonymousAuth } from "../../hooks/useAnonymousAuth";
import {
  getTodaysCommunity,
  updateReflectionVisibility,
  type ReflectionRow,
} from "../../lib/reflections";
import { isNetworkError } from "../../lib/offlineReflections";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

type LoadState = "pending" | "ready" | "error" | "offline";

function CommunityCards({
  reflections,
  loadState,
}: {
  reflections: ReflectionRow[];
  loadState: LoadState;
}) {
  const { openCardActions } = useCardInteraction();
  const { userId } = useAnonymousAuth();

  return (
    <ScrollRail style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={textStyles.screenTitle}>Community</Text>
      {loadState === "pending" ? null : loadState === "offline" ? (
        <Text style={textStyles.body}>
          No internet.{"\n\n"}Connect to see today's community.
        </Text>
      ) : loadState === "error" ? (
        <Text style={textStyles.body}>Community public posts appear here.</Text>
      ) : reflections.length === 0 ? (
        <Text style={textStyles.body}>
          Daily public reflections will appear here.
        </Text>
      ) : (
        <View style={styles.cards}>
          {reflections.map((entry) => (
            <CommunityReflectionCard
              key={entry.id}
              reflection={entry}
              onHold={(reflection) => openCardActions(reflection, userId)}
            />
          ))}
        </View>
      )}
    </ScrollRail>
  );
}

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

  const handlers = useMemo<ResolveCardActionHandlers>(
    () => ({
      toggleVisibility: async (reflection, nextPublic) => {
        const updated = await updateReflectionVisibility(reflection.id, nextPublic);
        setReflections((prev) => {
          if (!updated.is_public) {
            return prev.filter((row) => row.id !== updated.id);
          }
          return prev.map((row) => (row.id === updated.id ? updated : row));
        });
      },
    }),
    [],
  );

  return (
    <CardInteractionProvider handlers={handlers}>
      <CommunityCards reflections={reflections} loadState={loadState} />
    </CardInteractionProvider>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
  cards: {
    gap: layout.screenColumnGap,
  },
});
