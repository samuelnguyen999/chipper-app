import { View, Text, StyleSheet } from "react-native";
import { layout, screen, textStyles } from "../../constants";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function ProfileScreen() {
  useRedirectWhenTabsLocked();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.lead}>Streaks, saved posts, etc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screen.fill,
    paddingTop: layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenScrollBottomPadding,
  },
  title: {
    ...textStyles.screenTitle,
  },
  lead: {
    ...textStyles.body,
  },
});