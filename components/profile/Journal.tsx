import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { colors, layout, spacing, textStyles } from "../../constants";
import { getMyReflections, type ReflectionRow } from "../../lib/reflections";
import {
  getOfflineReflections,
  isNetworkError,
  mergeReflectionsForJournal,
} from "../../lib/offlineReflections";
import JournalReflectionCard from "./JournalReflectionCard";

function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type LoadState = "pending" | "ready" | "error";

type JournalProps = {
  /** Preview mode for Profile overview — today's reflection + open control. */
  preview?: boolean;
};

export default function Journal({ preview = false }: JournalProps) {
  const router = useRouter();
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("pending");
  /** True when Supabase history could not be loaded (offline). Pending queue may still show. */
  const [historyUnavailable, setHistoryUnavailable] = useState(false);

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
  const visible = preview
    ? todaysReflection
      ? [todaysReflection]
      : []
    : reflections;
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

    return (
      <View style={styles.cards}>
        {connectMessage}
        {visible.map((entry) => (
          <JournalReflectionCard
            key={entry.id}
            reflection={entry}
            showVisibility={preview}
          />
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

const styles = StyleSheet.create({
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
  cards: {
    gap: layout.screenColumnGap,
  },
});
