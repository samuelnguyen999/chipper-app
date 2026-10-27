import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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
import { colors, layout, screen, spacing, textStyles } from "../../constants";
import { useAnonymousAuth } from "../../hooks/useAnonymousAuth";
import {
  useReflectionCardMutations,
  type SaveEditResult,
} from "../../hooks/useReflectionCardMutations";
import {
  ACKNOWLEDGEMENTS_DAILY_LIMIT,
  acknowledgeReflection,
  getTodaysAcknowledgedIds,
} from "../../lib/acknowledgementService";
import { blockUser, getBlockedUserIds, idsHiddenFromFeed } from "../../lib/blockedUsers";
import {
  reportReflection,
  type ReportReflectionResult,
} from "../../lib/contentReports";
import { isAcknowledgementsEnabled } from "../../lib/featureFlags";
import {
  getTodaysCommunity,
  updateReflectionVisibility,
  type ReflectionRow,
} from "../../lib/reflections";
import { isNetworkError } from "../../lib/offlineReflections";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

const ACKNOWLEDGEMENTS_ENABLED = isAcknowledgementsEnabled();

const REPORT_NOTICES: Record<ReportReflectionResult["status"], string> = {
  sent: "Report sent. Thanks for letting us know.",
  duplicate: "The report will be reviewed shortly.",
  failed: "Couldn't report. Something went wrong. Please try again.",
};

const REPORT_ALERTS: Record<
  ReportReflectionResult["status"],
  { title: string; message: string }
> = {
  sent: { title: "Report sent", message: "Thanks for letting us know." },
  duplicate: {
    title: "Already reported",
    message: "You've already reported this reflection.",
  },
  failed: {
    title: "Couldn't report",
    message: "Something went wrong. Please try again.",
  },
};

const BLOCK_FAILURE_NOTICE = "Couldn't block. Something went wrong. Please try again.";

const REPORT_NOTICE_MS = 5000;
const REPORT_NOTICE_ENTER = {
  duration: 320,
  easing: Easing.out(Easing.cubic),
};
const REPORT_NOTICE_EXIT = {
  duration: 800,
  easing: Easing.in(Easing.cubic),
};

type ReportNoticeState = {
  reflectionId: string;
  message: string;
  exiting: boolean;
};

function reportNoticeFor(result: ReportReflectionResult): string {
  return REPORT_NOTICES[result.status];
}

function withoutBlockedAuthors(
  rows: ReflectionRow[],
  blockedIds: Set<string>,
): ReflectionRow[] {
  return rows.filter((row) => !blockedIds.has(row.user_id.toLowerCase()));
}

function ReportNotice({
  message,
  exiting,
  onExited,
}: {
  message: string;
  exiting: boolean;
  onExited: () => void;
}) {
  const progress = useSharedValue(0);
  const measured = useSharedValue(0);
  const slidingOut = useSharedValue(false);
  const onExitedRef = useRef(onExited);
  const runId = useRef(0);
  onExitedRef.current = onExited;

  useEffect(() => {
    if (exiting) {
      const id = ++runId.current;
      slidingOut.value = true;
      progress.value = withTiming(0, REPORT_NOTICE_EXIT, (finished) => {
        if (!finished) return;
        runOnJS(finishExit)(id);
      });
      return;
    }

    runId.current += 1;
    slidingOut.value = false;
    if (measured.value === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, REPORT_NOTICE_ENTER);
  }, [exiting, message, measured, progress, slidingOut]);

  function finishExit(id: number) {
    if (id !== runId.current) return;
    onExitedRef.current();
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height <= 0 || measured.value === height) return;
    measured.value = height;
    if (!exiting && progress.value === 0) {
      progress.value = withTiming(1, REPORT_NOTICE_ENTER);
    }
  };

  const clipStyle = useAnimatedStyle(() => ({
    height: measured.value * progress.value,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY:
          (slidingOut.value ? progress.value - 1 : 1 - progress.value) *
          measured.value,
      },
    ],
  }));

  return (
    <View style={styles.reportNoticeClip}>
      <View
        style={styles.reportNoticeMeasure}
        onLayout={onLayout}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={[textStyles.caption, styles.reportNotice]}>{message}</Text>
      </View>
      <Animated.View style={[styles.reportNoticeWindow, clipStyle]}>
        <Animated.View style={slideStyle}>
          <Text
            style={[textStyles.caption, styles.reportNotice]}
            accessibilityLiveRegion="polite"
          >
            {message}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

type LoadState = "pending" | "ready" | "error" | "offline";

function CommunityCards({
  reflections,
  loadState,
  acknowledgedIds,
  editingId,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  editRejected,
  exitingId,
  onExitComplete,
  reportNotice,
  onReportNoticeExited,
}: {
  reflections: ReflectionRow[];
  loadState: LoadState;
  acknowledgedIds: Set<string>;
  editingId: string | null;
  editDraft: string;
  onEditDraftChange: (text: string) => void;
  onSaveEdit: () => void | Promise<SaveEditResult | void>;
  editRejected: boolean;
  exitingId: string | null;
  onExitComplete: (reflectionId: string) => void;
  reportNotice: ReportNoticeState | null;
  onReportNoticeExited: () => void;
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
            <View key={entry.id}>
              <CommunityReflectionCard
                reflection={entry}
                acknowledged={
                  ACKNOWLEDGEMENTS_ENABLED && acknowledgedIds.has(entry.id)
                }
                onHold={(reflection) => openCardActions(reflection, userId)}
                editing={editingId === entry.id}
                editDraft={editingId === entry.id ? editDraft : undefined}
                onEditDraftChange={onEditDraftChange}
                onSaveEdit={onSaveEdit}
                editRejected={editingId === entry.id && editRejected}
                exiting={exitingId === entry.id}
                onExitComplete={() => onExitComplete(entry.id)}
              />
              {reportNotice?.reflectionId === entry.id ? (
                <ReportNotice
                  message={reportNotice.message}
                  exiting={reportNotice.exiting}
                  onExited={onReportNoticeExited}
                />
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollRail>
  );
}

export default function CommunityScreen() {
  useRedirectWhenTabsLocked();
  useFontPresetSubscription();
  const { userId } = useAnonymousAuth();
  const blockedIdsRef = useRef<Set<string>>(new Set());
  const exitingIdRef = useRef<string | null>(null);
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("pending");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [presenceMomentVisible, setPresenceMomentVisible] = useState(false);
  const [reportNotice, setReportNotice] = useState<ReportNoticeState | null>(null);
  const reportNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showReportNotice = useCallback((reflectionId: string, message: string) => {
    if (reportNoticeTimer.current != null) {
      clearTimeout(reportNoticeTimer.current);
    }
    setReportNotice({ reflectionId, message, exiting: false });
    reportNoticeTimer.current = setTimeout(() => {
      reportNoticeTimer.current = null;
      setReportNotice((current) =>
        current?.reflectionId === reflectionId
          ? { ...current, exiting: true }
          : current,
      );
    }, REPORT_NOTICE_MS);
  }, []);

  const finishReportNotice = useCallback(() => {
    setReportNotice((current) => (current?.exiting ? null : current));
  }, []);

  useEffect(() => {
    return () => {
      if (reportNoticeTimer.current != null) {
        clearTimeout(reportNoticeTimer.current);
      }
    };
  }, []);
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

  useEffect(() => {
    exitingIdRef.current = exitingId;
  }, [exitingId]);

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
          const blocked = await getBlockedUserIds();
          if (cancelled) return;
          if (!blocked.ok) {
            setLoadState((prev) => (prev === "ready" ? prev : "error"));
            return;
          }
          const readIds = blocked.ids;
          setReflections((prev) => {
            const ids = idsHiddenFromFeed(readIds);
            blockedIdsRef.current = ids;
            const next = withoutBlockedAuthors(rows, ids);
            const exiting = exitingIdRef.current;
            if (!exiting || next.some((row) => row.id === exiting)) return next;
            const index = prev.findIndex((row) => row.id === exiting);
            if (index < 0) return next;
            const kept = next.slice();
            kept.splice(Math.min(index, kept.length), 0, prev[index]);
            return kept;
          });
          setLoadState("ready");
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
          startExit({ kind: "private", reflection });
          return;
        }
        const updated = await updateReflectionVisibility(reflection.id, nextPublic);
        setReflections((prev) =>
          prev.map((row) => (row.id === updated.id ? updated : row)),
        );
      },
      edit: beginEdit,
      delete: (reflection) => {
        startExit({ kind: "delete", reflection });
      },
      report: async (reflection) => {
        const result = await reportReflection(reflection.id);
        if (Platform.OS === "web") {
          showReportNotice(reflection.id, reportNoticeFor(result));
          return;
        }
        const alert = REPORT_ALERTS[result.status];
        Alert.alert(alert.title, alert.message);
      },
      block: async (reflection) => {
        const result = await blockUser(reflection.user_id, userId);
        if (result.status !== "blocked") {
          if (Platform.OS === "web") {
            showReportNotice(reflection.id, BLOCK_FAILURE_NOTICE);
            return;
          }
          Alert.alert("Couldn't block", "Something went wrong. Please try again.");
          return;
        }
        blockedIdsRef.current = idsHiddenFromFeed([...blockedIdsRef.current]);
        exitingIdRef.current = reflection.id;
        startExit({ kind: "dismiss", reflection });
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
    [beginEdit, showReportNotice, startExit, userId],
  );

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
        editRejected={editRejected}
        exitingId={exitingId}
        onExitComplete={(reflectionId) => {
          if (exitingIdRef.current === reflectionId) exitingIdRef.current = null;
          void finishExit(reflectionId);
        }}
        reportNotice={reportNotice}
        onReportNoticeExited={finishReportNotice}
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
  reportNoticeClip: {
    marginTop: -layout.screenColumnGap,
    marginBottom: layout.screenColumnGap,
  },
  reportNoticeMeasure: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
  },
  reportNoticeWindow: {
    overflow: "hidden",
  },
  reportNotice: {
    color: colors.tabHeader,
    marginBottom: 0,
    paddingTop: spacing.xs,
  },
});
