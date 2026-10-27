import { useCallback, useRef } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import LogoGallery, {
  FontPresetCycleButton,
  Journal,
  useFontPresetSubscription,
} from "../../components/profile";
import { layout, screen, spacing, textStyles } from "../../constants";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

const SUPPORT_MAILTO =
  "mailto:officialchippers@gmail.com?subject=" + encodeURIComponent("Chippers Support");

export default function ProfileScreen() {
  useRedirectWhenTabsLocked();
  useFontPresetSubscription();
  const scrollDismissRef = useRef<(() => void) | null>(null);
  const contactSupport = useCallback(() => {
    Linking.openURL(SUPPORT_MAILTO).catch(() => {});
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={() => scrollDismissRef.current?.()}
    >
      <View style={styles.header}>
        <Text style={[textStyles.screenTitle, styles.title]}>Profile</Text>
        <FontPresetCycleButton />
      </View>
      <Journal preview scrollDismissRef={scrollDismissRef} />
      <LogoGallery embedded />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Contact Support"
        onPress={contactSupport}
        style={styles.supportLink}
      >
        <Text style={[textStyles.caption, styles.supportLabel]}>Contact Support</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  /** End pad = same as Community’s last-card gap (`screenColumnGap`). */
  container: screen.scrollContentTab,
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: layout.sectionGap,
  },
  title: {
    flex: 1,
  },
  supportLink: {
    alignSelf: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  supportLabel: {
    marginBottom: 0,
    textDecorationLine: "underline",
  },
});
