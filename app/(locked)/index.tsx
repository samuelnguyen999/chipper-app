import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TodayExperience from "../../components/today/TodayExperience";
import { colors } from "../../constants";
import {
  getBreathUnlockVisible,
  startBreathUnlock,
  subscribeBreathUnlock,
} from "../../state/breathUnlock";
import { useTabAccess } from "../../state/TabAccessContext";

export default function LockedTodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isHydrated, mainTabsUnlocked } = useTabAccess();
  const [breathVisible, setBreathVisible] = useState(getBreathUnlockVisible);

  useEffect(() => subscribeBreathUnlock(() => setBreathVisible(getBreathUnlockVisible())), []);

  // Already-unlocked hydrate only — skip while Breath owns under-cover navigation.
  useEffect(() => {
    if (isHydrated && mainTabsUnlocked && !breathVisible) {
      router.replace("/(tabs)/community");
    }
  }, [isHydrated, mainTabsUnlocked, breathVisible, router]);

  const handleUnlocked = useCallback(() => {
    startBreathUnlock();
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.experience, { paddingTop: insets.top }]}>
        <TodayExperience onUnlocked={handleUnlocked} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  experience: {
    flex: 1,
  },
});
