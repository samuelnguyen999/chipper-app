import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  font,
  getTitleLineHeightScale,
  layout,
  radii,
  scaleFontSize,
  spacing,
  textSize,
  textStyles,
} from "../../constants";

export const COMMUNITY_PURPOSE_COPY = `
Read with curiosity.
Hold space for another person.
Leave encouraged to take your next step.

When a reflection connects with you, offer a quiet acknowledgment. Your support stays private. The writer will never know.

Together, we build shared understanding, connection, and growth.
`;

/** Match Community header block: title line + screenTitle marginBottom. */
function communityHeaderBlockHeight(): number {
  const fontSize = scaleFontSize("title");
  const lineHeight = Math.round(fontSize * getTitleLineHeightScale());
  return lineHeight + spacing.md;
}

/**
 * Community header purpose control — same info icon + muted copy language as Reflect ChoiceCard.
 */
export default function CommunityPurposeInfo() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  /** Align sheet top with first card (under scene safe area + scroll pad + header). */
  const sheetTop =
    insets.top + layout.screenPadding + communityHeaderBlockHeight();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Community purpose"
        accessibilityHint="Shows why Community exists"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.infoHit, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.textMuted}
          style={styles.infoIcon}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={[styles.backdrop, { paddingTop: sheetTop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close purpose"
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.leadRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.textMuted}
                style={styles.infoIcon}
              />
              <Text style={[font("regular"), styles.infoHint, textSize("sm")]}>Purpose</Text>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              <Text
                style={[font("regular"), styles.purpose, textSize("sm"), { lineHeight: 22 }]}
              >
                {COMMUNITY_PURPOSE_COPY}
              </Text>
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setOpen(false)}
              style={({ pressed }) => [styles.closeRow, pressed && styles.pressed]}
            >
              <Text style={[textStyles.caption, styles.closeHint]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoHit: {
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  infoIcon: {
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  infoHint: {
    color: colors.textMuted,
  },
  leadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.50)",
    justifyContent: "flex-start",
    paddingHorizontal: layout.screenPadding,
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    maxHeight: "70%",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  purpose: {
    color: colors.textMuted,
  },
  closeRow: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  closeHint: {
    color: colors.textMuted,
  },
});
