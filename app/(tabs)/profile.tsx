import { StyleSheet, View } from "react-native";
import LogoGallery, { FontPresetCycleButton } from "../../components/profile";
import { layout, screen, spacing } from "../../constants";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function ProfileScreen() {
  useRedirectWhenTabsLocked();

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <FontPresetCycleButton />
      </View>
      <LogoGallery />
    </View>
  );
}

const styles = StyleSheet.create({
  root: screen.fill,
  toolbar: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.screenPadding,
    paddingBottom: spacing.sm,
  },
});
