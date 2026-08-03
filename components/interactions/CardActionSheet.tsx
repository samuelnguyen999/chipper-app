import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing, textStyles } from "../../constants";
import type { CardAction } from "./CardAction";

type CardActionSheetProps = {
  visible: boolean;
  actions: CardAction[];
  onClose: () => void;
};

/**
 * Presentation only — renders `actions` and invokes their handlers.
 */
export default function CardActionSheet({
  visible,
  actions,
  onClose,
}: CardActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss card actions"
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          accessibilityViewIsModal
        >
          <Text style={[textStyles.body, styles.title]}>Card Actions</Text>
          {actions.length === 0 ? (
            <Text style={[textStyles.body, styles.empty]}>No actions available</Text>
          ) : (
            actions.map((action) => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Text style={[textStyles.body, styles.actionLabel]}>{action.label}</Text>
              </Pressable>
            ))
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
          >
            <Text style={[textStyles.body, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  action: {
    alignItems: "center",
    paddingVertical: spacing.buttonY,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: colors.text,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.buttonY,
  },
  cancelPressed: {
    opacity: 0.7,
  },
  cancelLabel: {
    color: colors.primary,
  },
});
