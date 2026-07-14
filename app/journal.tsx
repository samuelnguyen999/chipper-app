import { ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Journal } from "../components/profile";
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Journal />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
});
