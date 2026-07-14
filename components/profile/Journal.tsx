import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { colors, layout, spacing, textStyles } from "../../constants";
import { getMyReflections, type ReflectionRow } from "../../lib/reflections";
import JournalReflectionCard from "./JournalReflectionCard";

function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Could not load journal.";
}

type JournalProps = {
  /** Preview mode for Profile overview — today's reflection + open control. */
  preview?: boolean;
};

export default function Journal({ preview = false }: JournalProps) {
  const router = useRouter();
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
          const rows = await getMyReflections();
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

  const todayKey = getLocalDateKey();
  const todaysReflection =
    reflections.find((entry) => entry.reflection_date === todayKey) ?? null;
  const visible = preview
    ? todaysReflection
      ? [todaysReflection]
      : []
    : reflections;
  const isEmpty = preview ? todaysReflection == null : reflections.length === 0;

  const body = (() => {
    if (loading) {
      return <Text style={textStyles.body}>Loading journal...</Text>;
    }
    if (error) {
      return <Text style={textStyles.body}>{error}</Text>;
    }
    if (isEmpty) {
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
