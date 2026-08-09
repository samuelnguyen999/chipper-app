import { StyleSheet, Text, View, Keyboard } from "react-native";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { useFontPresetSubscription } from "../../components/profile";
import ScrollRail from "../../components/ui/ScrollRail";
import { screen, spacing, textStyles } from "../../constants";
import { useAnonymousAuth } from "../../hooks/useAnonymousAuth";
import {
  ACKNOWLEDGEMENTS_DAILY_LIMIT,
  acknowledgeReflection,
  getTodaysAcknowledgedIds,
} from "../../lib/acknowledgementService";
import { isAcknowledgementsEnabled } from "../../lib/featureFlags";
import {
  deleteReflection,
  getTodaysCommunity,
  updateReflectionResponse,
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
  editingId,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  exitingId,
  onExitComplete,
}: {
  reflections: ReflectionRow[];
  loadState: LoadState;
  acknowledgedIds: Set<string>;
  editingId: string | null;
  editDraft: string;
  onEditDraftChange: (text: string) => void;
  onSaveEdit: () => void | Promise<void>;
  exitingId: string | null;
  onExitComplete: (reflectionId: string) => void;
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
        {ACKNOWLEDGEMENTS_ENABLED ? <CommunityPurposeInfo /> : null}
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
        <View>
          {reflections.map((entry) => (
            <CommunityReflectionCard
              key={entry.id}
              reflection={entry}
              acknowledged={
                ACKNOWLEDGEMENTS_ENABLED && acknowledgedIds.has(entry.id)
              }
              onHold={(reflection) => openCardActions(reflection, userId)}
              editing={editingId === entry.id}
              editDraft={editingId === entry.id ? editDraft : undefined}
              onEditDraftChange={onEditDraftChange}
              onSaveEdit={onSaveEdit}
              exiting={exitingId === entry.id}
              onExitComplete={() => onExitComplete(entry.id)}
            />
          ))}
        </View>
      )}
    </ScrollRail>
  );
}

export default function CommunityScreen() {
  useRedirectWhenTabsLocked();
  useFontPresetSubscription();
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("pending");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [presenceMomentVisible, setPresenceMomentVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [exitingId, setExitingId] = useState<string | null>(null);
  const savingEditRef = useRef(false);
  /** Delete or make-private — list removal runs after the shared exit wipe. */
  const pendingExitRef = useRef<
    | { kind: "delete"; reflection: ReflectionRow }
    | { kind: "private"; reflection: ReflectionRow }
    | null
  >(null);

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
        if (!nextPublic) {
          // Leave the public list with the same wipe as delete.
          pendingExitRef.current = { kind: "private", reflection };
          setExitingId(reflection.id);
          return;
        }
        const updated = await updateReflectionVisibility(reflection.id, nextPublic);
        setReflections((prev) =>
          prev.map((row) => (row.id === updated.id ? updated : row)),
        );
      },
      edit: (reflection) => {
        setEditingId(reflection.id);
        setEditDraft(reflection.response);
      },
      delete: (reflection) => {
        pendingExitRef.current = { kind: "delete", reflection };
        setExitingId(reflection.id);
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

  const saveEdit = useCallback(async () => {
    if (!editingId || savingEditRef.current) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;

    savingEditRef.current = true;
    try {
      const updated = await updateReflectionResponse(editingId, trimmed);
      setReflections((prev) =>
        prev.map((row) => (row.id === updated.id ? { ...row, response: updated.response } : row)),
      );
      setEditingId(null);
      setEditDraft("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Edit reflection failed:", error);
    } finally {
      savingEditRef.current = false;
    }
  }, [editDraft, editingId]);

  const finishExit = useCallback(async (reflectionId: string) => {
    const pending = pendingExitRef.current;
    pendingExitRef.current = null;
    if (!pending || pending.reflection.id !== reflectionId) {
      setExitingId(null);
      return;
    }

    const { reflection, kind } = pending;

    // Drop from list while still collapsed — clearing exiting first pops the card back.
    setReflections((prev) => prev.filter((row) => row.id !== reflection.id));
    setEditingId((current) => {
      if (current === reflection.id) {
        setEditDraft("");
        return null;
      }
      return current;
    });
    setExitingId(null);

    try {
      if (kind === "delete") {
        await deleteReflection(reflection.id);
      } else {
        await updateReflectionVisibility(reflection.id, false);
      }
    } catch (error) {
      console.error(
        kind === "delete" ? "Delete reflection failed:" : "Make private failed:",
        error,
      );
    }
  }, []);

  return (
    <CardInteractionProvider handlers={handlers}>
      <CommunityCards
        reflections={reflections}
        loadState={loadState}
        acknowledgedIds={acknowledgedIds}
        editingId={editingId}
        editDraft={editDraft}
        onEditDraftChange={setEditDraft}
        onSaveEdit={saveEdit}
        exitingId={exitingId}
        onExitComplete={finishExit}
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
  /** Cards carry `screenColumnGap` as marginBottom — don’t double the end pad. */
  container: { ...screen.scrollContentTab, paddingBottom: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.xs,
    // screenTitle’s marginBottom would offset vertical centering of the info icon.
    marginBottom: spacing.md,
  },
  title: {
    flexShrink: 1,
    marginBottom: 0,
  },
});
