import { Stack } from "expo-router";
import { Journal, useFontPresetSubscription } from "../components/profile";
import { colors } from "../constants";
import { useRedirectWhenTabsLocked } from "../state/useRedirectWhenTabsLocked";

export default function JournalScreen() {
  useRedirectWhenTabsLocked();
  useFontPresetSubscription();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Journal",
          headerBackTitle: "Profile",
          headerStyle: { backgroundColor: colors.tabHeader },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { color: colors.onPrimary },
        }}
      />
      <Journal />
    </>
  );
}
