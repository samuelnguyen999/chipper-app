import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radii, spacing, textSize, textStyles } from "../../constants";
import AcknowledgeChip from "./AcknowledgeChip";

export const COMMUNITY_PRESENCE_TITLE = "You've taken a moment to connect.";
export const COMMUNITY_PRESENCE_BODY = "Carry that presence with you.";

type CommunityPresenceMomentProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Gentle Community closure — same fade + surface card language as CommunityPurposeInfo.
 * Presentation only; parent decides when to show.
 */
export default function CommunityPresenceMoment({
  visible,
  onClose,
}: CommunityPresenceMomentProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.leadRow}>
            <AcknowledgeChip size={22} />
            <Text style={[font("regular"), styles.leadHint, textSize("sm")]}>Presence</Text>
          </View>
          <Text style={[font("regular"), styles.title, textSize("sm"), { lineHeight: 22 }]}>
            {COMMUNITY_PRESENCE_TITLE}
          </Text>
          <Text style={[font("regular"), styles.body, textSize("sm"), { lineHeight: 22 }]}>
            {COMMUNITY_PRESENCE_BODY}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [styles.closeRow, pressed && styles.pressed]}
          >
            <Text style={[textStyles.caption, styles.closeHint]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  leadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  leadHint: {
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  body: {
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
