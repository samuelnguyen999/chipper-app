import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TodayExperience from "../../components/today/TodayExperience";
import { colors } from "../../constants";
import { useTabAccess } from "../../state/TabAccessContext";

export default function LockedTodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isHydrated, mainTabsUnlocked } = useTabAccess();

  useEffect(() => {
    if (isHydrated && mainTabsUnlocked) {
      router.replace("/(tabs)/community")    }
  }, [isHydrated, mainTabsUnlocked, router]);

  const handleUnlocked = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TodayExperience onUnlocked={handleUnlocked} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
