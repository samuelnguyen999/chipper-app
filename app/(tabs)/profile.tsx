import { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import LogoGallery, { FontPresetCycleButton, Journal } from "../../components/profile";
import { layout, screen, spacing, textStyles } from "../../constants";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function ProfileScreen() {
  useRedirectWhenTabsLocked();
  const scrollDismissRef = useRef<(() => void) | null>(null);

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: screen.scroll,
  container: screen.scrollContent,
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
});
