import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { useFontPresetSubscription } from "../components/profile";
import { colors, screen, spacing, textStyles } from "../constants";
import { getBlockedUserIds, unblockUser } from "../lib/blockedUsers";
import { useRedirectWhenTabsLocked } from "../state/useRedirectWhenTabsLocked";

const UNBLOCK_FAILURE = "Couldn't unblock. Something went wrong. Please try again.";

type LoadState = "pending" | "ready" | "error";

export default function BlockedUsersScreen() {
  useRedirectWhenTabsLocked();
  useFontPresetSubscription();
  const [ids, setIds] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("pending");
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        const result = await getBlockedUserIds();
        if (cancelled) return;
        if (!result.ok) {
          setLoadState("error");
          return;
        }
        setIds(result.ids);
        setLoadState("ready");
      }

      void load();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const unblock = useCallback(async (userId: string) => {
    const result = await unblockUser(userId);
    if (result.status !== "unblocked") {
      setNotice(UNBLOCK_FAILURE);
      return;
    }
    setNotice(null);
    setIds((current) => current.filter((id) => id !== userId));
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Blocked Users",
          headerBackTitle: "Profile",
          headerStyle: { backgroundColor: colors.tabHeader },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { color: colors.onPrimary },
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {loadState === "pending" ? (
          <Text style={textStyles.body}>Loading blocked users.</Text>
        ) : loadState === "error" ? (
          <Text style={textStyles.body}>Couldn't load blocked users.</Text>
        ) : ids.length === 0 ? (
          <Text style={textStyles.body}>You haven't blocked anyone.</Text>
        ) : (
          <View style={styles.list}>
            {ids.map((id) => (
              <View key={id} style={styles.row}>
                <View style={styles.identity}>
                  <Text style={textStyles.body}>Blocked user</Text>
                  <Text style={[textStyles.caption, styles.id]}>{id.slice(0, 8)}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock user ${id}`}
                  onPress={() => void unblock(id)}
                  style={({ pressed }) => [styles.unblock, pressed && styles.unblockPressed]}
                >
                  <Text style={[textStyles.caption, styles.unblockLabel]}>Unblock</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {notice ? (
          <Text
            style={[textStyles.body, styles.notice]}
            accessibilityLiveRegion="polite"
          >
            {notice}
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
  },
  id: {
    marginBottom: 0,
  },
  unblock: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  unblockPressed: {
    opacity: 0.7,
  },
  unblockLabel: {
    marginBottom: 0,
    color: colors.tabHeader,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
