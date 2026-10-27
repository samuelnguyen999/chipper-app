import { useCallback, useEffect, useMemo, useState, type MutableRefObject, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { colors, layout, screen, spacing, textStyles } from "../../constants";
import {
  getMyReflections,
  updateReflectionVisibility,
  type ReflectionRow,
} from "../../lib/reflections";
import {
  getOfflineReflections,
  isNetworkError,
  mergeReflectionsForJournal,
} from "../../lib/offlineReflections";
import {
  CardInteractionProvider,
  useCardInteraction,
  type ResolveCardActionHandlers,
} from "../interactions";
import ScrollRail from "../ui/ScrollRail";
import JournalReflectionCard from "./JournalReflectionCard";
import { useAnonymousAuth } from "../../hooks/useAnonymousAuth";
import {
  useReflectionCardMutations,
  type SaveEditResult,
} from "../../hooks/useReflectionCardMutations";

type JournalGroupKey = "thisWeek" | "lastWeek" | "lastMonth" | "lastYear";

const JOURNAL_GROUP_ORDER: JournalGroupKey[] = [
  "thisWeek",
  "lastWeek",
  "lastMonth",
  "lastYear",
];

const JOURNAL_GROUP_LABELS: Record<JournalGroupKey, string> = {
  thisWeek: "This week",
  lastWeek: "Last week",
  lastMonth: "Last month",
  lastYear: "Last year",
};

function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(dateKey: string): Date | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Weeks run Sunday → Saturday. Last week is the completed week ending
 * on the previous Saturday (from that week’s Sunday through that Saturday).
 */
function journalWeekBounds(now = new Date()): {
  thisWeekStart: Date;
  lastWeekStart: Date;
  lastWeekEnd: Date;
} {
  const today = startOfLocalDay(now);
  // Sunday = 0 … Saturday = 6
  const thisWeekStart = addLocalDays(today, -today.getDay());
  const lastWeekEnd = addLocalDays(thisWeekStart, -1); // previous Saturday
  const lastWeekStart = addLocalDays(lastWeekEnd, -6); // Sunday of that week
  return { thisWeekStart, lastWeekStart, lastWeekEnd };
}

function journalGroupForDate(dateKey: string, now = new Date()): JournalGroupKey {
  const date = parseLocalDateKey(dateKey);
  if (!date) return "lastYear";

  const { thisWeekStart, lastWeekStart, lastWeekEnd } = journalWeekBounds(now);
  const today = startOfLocalDay(now);

  if (date >= thisWeekStart && date <= today) return "thisWeek";
  if (date >= lastWeekStart && date <= lastWeekEnd) return "lastWeek";

  const daysAgo = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo <= 30) return "lastMonth";
  return "lastYear";
}

function groupReflectionsByRecency(
  items: ReflectionRow[],
): { key: JournalGroupKey; label: string; items: ReflectionRow[] }[] {
  const buckets: Record<JournalGroupKey, ReflectionRow[]> = {
    thisWeek: [],
    lastWeek: [],
    lastMonth: [],
    lastYear: [],
  };
  const now = new Date();
  for (const item of items) {
    buckets[journalGroupForDate(item.reflection_date, now)].push(item);
  }
  return JOURNAL_GROUP_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
    key,
    label: JOURNAL_GROUP_LABELS[key],
    items: buckets[key].sort(compareNewestReflectionFirst),
  }));
}

function compareNewestReflectionFirst(a: ReflectionRow, b: ReflectionRow): number {
  const byDate = b.reflection_date.localeCompare(a.reflection_date);
  if (byDate !== 0) return byDate;
  return b.created_at.localeCompare(a.created_at);
}

type LoadState = "pending" | "ready" | "error";

type JournalProps = {
  /** Preview mode for Profile overview — today's reflection + open control. */
  preview?: boolean;
  /**
   * Optional bridge for a parent ScrollView (Profile preview) to collapse
   * the active card on scroll without lifting provider state.
   */
  scrollDismissRef?: MutableRefObject<(() => void) | null>;
};

function BindScrollDismiss({
  scrollDismissRef,
}: {
  scrollDismissRef?: MutableRefObject<(() => void) | null>;
}) {
  const { closeCardActions } = useCardInteraction();

  useEffect(() => {
    if (!scrollDismissRef) return;
    scrollDismissRef.current = closeCardActions;
    return () => {
      scrollDismissRef.current = null;
    };
  }, [closeCardActions, scrollDismissRef]);

  return null;
}

function JournalScrollRail({ children }: { children: ReactNode }) {
  const { closeCardActions } = useCardInteraction();
  return (
    <ScrollRail
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      onScrollBeginDrag={closeCardActions}
    >
      {children}
    </ScrollRail>
  );
}

type JournalViewProps = {
  preview: boolean;
  reflections: ReflectionRow[];
  loadState: LoadState;
  historyUnavailable: boolean;
  editingId: string | null;
  editDraft: string;
  onEditDraftChange: (text: string) => void;
  onSaveEdit: () => void | Promise<SaveEditResult | void>;
  editRejected: boolean;
  exitingId: string | null;
  onExitComplete: (reflectionId: string) => void;
};

function JournalView({
  preview,
  reflections,
  loadState,
  historyUnavailable,
  editingId,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  editRejected,
  exitingId,
  onExitComplete,
}: JournalViewProps) {
  const router = useRouter();
  const { openCardActions } = useCardInteraction();
  const { userId } = useAnonymousAuth();

  const groups = useMemo(
    () => (preview ? [] : groupReflectionsByRecency(reflections)),
    [preview, reflections],
  );

  // Preview: hide only while first loading or hard error with nothing to show.
  if (preview && loadState === "pending") {
    return null;
  }
  if (preview && loadState === "error") {
    return null;
  }

  const todayKey = getLocalDateKey();
  const todaysReflection =
    reflections.find((entry) => entry.reflection_date === todayKey) ?? null;
  const isEmpty = preview ? todaysReflection == null : reflections.length === 0;

  /** Offline notice only on full Journal — Profile preview stays quiet. */
  const connectMessage =
    !preview && historyUnavailable ? (
      <Text style={textStyles.body}>
        No internet.{"\n\n"}Connect to view your full journal.
      </Text>
    ) : null;

  const body = (() => {
    if (loadState === "pending") {
      return null;
    }
    if (loadState === "error") {
      return null;
    }

    if (isEmpty) {
      if (connectMessage) {
        return connectMessage;
      }
      if (preview) {
        return (
          <View>
            <Text style={textStyles.body}>No reflection for today yet.</Text>
            <Text style={[textStyles.body, styles.emptyHint]}>
              Open to see past entries.
            </Text>
          </View>
        );
      }
      return (
        <View>
          <Text style={textStyles.body}>Your journal is waiting.</Text>
          <Text style={[textStyles.body, styles.emptyHint]}>
            Complete your first reflection to begin.
          </Text>
        </View>
      );
    }

    if (preview && todaysReflection) {
      return (
        <View>
          <JournalReflectionCard
            reflection={todaysReflection}
            showVisibility
            onHold={(reflection) => openCardActions(reflection, userId)}
            editing={editingId === todaysReflection.id}
            editDraft={editingId === todaysReflection.id ? editDraft : undefined}
            onEditDraftChange={onEditDraftChange}
            onSaveEdit={onSaveEdit}
            editRejected={editingId === todaysReflection.id && editRejected}
            exiting={exitingId === todaysReflection.id}
            onExitComplete={() => onExitComplete(todaysReflection.id)}
          />
        </View>
      );
    }

    return (
      <View style={styles.groups}>
        {connectMessage}
        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={textStyles.screenSubtitle}>{group.label}</Text>
            <View>
              {group.items.map((entry) => (
                <JournalReflectionCard
                  key={entry.id}
                  reflection={entry}
                  onHold={(reflection) => openCardActions(reflection, userId)}
                  editing={editingId === entry.id}
                  editDraft={editingId === entry.id ? editDraft : undefined}
                  onEditDraftChange={onEditDraftChange}
                  onSaveEdit={onSaveEdit}
                  editRejected={editingId === entry.id && editRejected}
                  exiting={exitingId === entry.id}
                  onExitComplete={() => onExitComplete(entry.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  })();

  if (preview) {
    return (
      <View style={styles.previewSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open journal"
          onPress={() => router.push("/journal")}
          style={({ pressed }) => [styles.previewHeader, pressed && styles.previewHeaderPressed]}
        >
          <Text style={textStyles.screenSubtitle}>Journal</Text>
          <Text style={[textStyles.caption, styles.openLabel]}>Open</Text>
        </Pressable>
        {body}
      </View>
    );
  }

  return <View style={styles.fullSection}>{body}</View>;
}

export default function Journal({ preview = false, scrollDismissRef }: JournalProps) {
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("pending");
  /** True when Supabase history could not be loaded (offline). Pending queue may still show. */
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const {
    editingId,
    editDraft,
    setEditDraft,
    editRejected,
    exitingId,
    beginEdit,
    saveEdit,
    startExit,
    finishExit,
  } = useReflectionCardMutations({ setReflections });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        let remote: ReflectionRow[] = [];
        let offlineOnly = false;
        let remoteHardFail = false;

        try {
          remote = await getMyReflections();
        } catch (error) {
          let offline = isNetworkError(error);
          if (!offline) {
            try {
              const net = await NetInfo.fetch();
              offline = net.isConnected === false;
            } catch {
              offline = false;
            }
          }
          if (offline) {
            offlineOnly = true;
          } else {
            remoteHardFail = true;
          }
        }

        let pending: ReflectionRow[] = [];
        try {
          pending = await getOfflineReflections();
        } catch {
          pending = [];
        }

        if (cancelled) return;

        // Offline: pending queue only (no historical cache). Online: remote + pending merge.
        const merged = offlineOnly
          ? mergeReflectionsForJournal([], pending)
          : mergeReflectionsForJournal(remote, pending);

        if (remoteHardFail && merged.length === 0) {
          setLoadState((prev) => (prev === "ready" ? prev : "error"));
          return;
        }

        setReflections(merged);
        setHistoryUnavailable(offlineOnly);
        setLoadState("ready");
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
        setReflections((prev) =>
          prev.map((row) =>
            row.id === updated.id ? { ...row, is_public: updated.is_public } : row,
          ),
        );
      },
      edit: beginEdit,
      delete: (reflection) => {
        startExit({ kind: "delete", reflection });
      },
    }),
    [beginEdit, startExit],
  );

  const view = (
    <JournalView
      preview={preview}
      reflections={reflections}
      loadState={loadState}
      historyUnavailable={historyUnavailable}
      editingId={editingId}
      editDraft={editDraft}
      onEditDraftChange={setEditDraft}
      onSaveEdit={saveEdit}
      editRejected={editRejected}
      exitingId={exitingId}
      onExitComplete={finishExit}
    />
  );

  return (
    <CardInteractionProvider handlers={handlers}>
      <BindScrollDismiss scrollDismissRef={scrollDismissRef} />
      {preview ? view : <JournalScrollRail>{view}</JournalScrollRail>}
    </CardInteractionProvider>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  scrollContent: screen.scrollContent,
  previewSection: {
    marginBottom: layout.sectionGap,
    gap: spacing.md,
  },
  fullSection: {
    gap: spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  previewHeaderPressed: {
    opacity: 0.7,
  },
  openLabel: {
    color: colors.primary,
  },
  emptyHint: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  groups: {
    gap: layout.sectionGap,
  },
  group: {
    gap: spacing.md,
  },
});
