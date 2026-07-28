import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Journal } from "../components/profile";
import ScrollRail from "../components/ui/ScrollRail";
import { colors, screen } from "../constants";
import { useRedirectWhenTabsLocked } from "../state/useRedirectWhenTabsLocked";

export default function JournalScreen() {
  useRedirectWhenTabsLocked();

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
      <ScrollRail style={styles.scroll} contentContainerStyle={styles.container}>
        <Journal />
      </ScrollRail>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
});
