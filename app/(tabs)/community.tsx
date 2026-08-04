import { StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import CommunityReflectionCard from "../../components/community";
import CommunityPresenceMoment from "../../components/community/CommunityPresenceMoment";
import CommunityPurposeInfo from "../../components/community/CommunityPurposeInfo";
import {
  CardInteractionProvider,
  useCardInteraction,
  type ResolveCardActionHandlers,
} from "../../components/interactions";
import ScrollRail from "../../components/ui/ScrollRail";
import { layout, screen, spacing, textStyles } from "../../constants";
import { useAnonymousAuth } from "../../hooks/useAnonymousAuth";
import {
  ACKNOWLEDGEMENTS_DAILY_LIMIT,
  acknowledgeReflection,
  getTodaysAcknowledgedIds,
} from "../../lib/acknowledgementService";
import { isAcknowledgementsEnabled } from "../../lib/featureFlags";
import {
  getTodaysCommunity,
  updateReflectionVisibility,
  type ReflectionRow,
} from "../../lib/reflections";
import { isNetworkError } from "../../lib/offlineReflections";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

const ACKNOWLEDGEMENTS_ENABLED = isAcknowledgementsEnabled();

type LoadState = "pending" | "ready" | "error" | "offline";

function CommunityCards({
  reflections,
  loadState,
  acknowledgedIds,
}: {
  reflections: ReflectionRow[];
  loadState: LoadState;
  acknowledgedIds: Set<string>;
}) {
  const { openCardActions, closeCardActions } = useCardInteraction();
  const { userId } = useAnonymousAuth();

  return (
    <ScrollRail
      style={styles.scroll}
      contentContainerStyle={styles.container}
      onScrollBeginDrag={closeCardActions}
    >
      <View style={styles.header}>
        <Text style={[textStyles.screenTitle, styles.title]}>Community</Text>
        <CommunityPurposeInfo />
      </View>
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
              acknowledged={
                ACKNOWLEDGEMENTS_ENABLED && acknowledgedIds.has(entry.id)
              }
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
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [presenceMomentVisible, setPresenceMomentVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const [ackIds, net] = await Promise.all([
            ACKNOWLEDGEMENTS_ENABLED
              ? getTodaysAcknowledgedIds()
              : Promise.resolve([] as string[]),
            NetInfo.fetch(),
          ]);
          if (!cancelled) {
            setAcknowledgedIds(new Set(ackIds));
          }

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
      ...(ACKNOWLEDGEMENTS_ENABLED
        ? {
            acknowledge: async (reflection: ReflectionRow) => {
              const result = await acknowledgeReflection(reflection.id);

              if (result.status === "already_acknowledged") {
                setAcknowledgedIds((prev) => new Set(prev).add(reflection.id));
                return;
              }

              if (result.status === "daily_limit_reached") {
                setPresenceMomentVisible(true);
                return;
              }

              setAcknowledgedIds((prev) => new Set(prev).add(reflection.id));

              if (result.countToday >= ACKNOWLEDGEMENTS_DAILY_LIMIT) {
                setPresenceMomentVisible(true);
              }
            },
          }
        : {}),
    }),
    [],
  );

  return (
    <CardInteractionProvider handlers={handlers}>
      <CommunityCards
        reflections={reflections}
        loadState={loadState}
        acknowledgedIds={acknowledgedIds}
      />
      <CommunityPresenceMoment
        visible={presenceMomentVisible}
        onClose={() => setPresenceMomentVisible(false)}
      />
    </CardInteractionProvider>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  cards: {
    gap: layout.screenColumnGap,
  },
});
