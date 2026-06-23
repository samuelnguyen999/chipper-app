import { StyleSheet, Text, View } from "react-native";
import LogoGallery, { FontPresetCycleButton } from "../../components/profile";
import { layout, screen, spacing, textStyles } from "../../constants";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function ProfileScreen() {
  useRedirectWhenTabsLocked();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={[textStyles.screenTitle, styles.title]}>Your Profile</Text>
        <FontPresetCycleButton />
      </View>
      <LogoGallery />
    </View>
  );
}

const styles = StyleSheet.create({
  root: screen.fill,
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
});
