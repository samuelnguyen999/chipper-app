import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, font, spacing, textSize } from "../../constants";
import type { CardAction } from "./CardAction";

type CardExpandedActionsProps = {
  actions: CardAction[];
};

/** Same durations as ChoiceCard purpose toggle — fade only so layout stays centered. */
const PURPOSE_ENTER_MS = 800;
const PURPOSE_EXIT_MS = 640;
export const ACTION_DIVIDER_WIDTH = 1.5;

/** Shared row layout — dividers / border notches use `splitCount`. */
export function resolveActionRow(actions: CardAction[]): {
  row: CardAction[];
  centered: boolean;
  /** n actions in a split row → n−1 dividers (0 when centered / single). */
  splitCount: number;
} {
  const byId = new Map(actions.map((action) => [action.id, action]));
  const acknowledge = byId.get("acknowledge");
  const visibility = byId.get("toggle-visibility");
  const edit = byId.get("edit");
  const deleteAction = byId.get("delete");

  let row: CardAction[];
  let centered = false;

  if (acknowledge && actions.length === 1) {
    row = [acknowledge];
    centered = true;
  } else if (visibility && edit) {
    row = [edit, visibility];
  } else if (edit && deleteAction) {
    row = [edit, deleteAction];
  } else {
    row = actions;
    centered = actions.length === 1;
  }

  const splitCount = centered ? 0 : Math.max(0, row.length - 1);
  return { row, centered, splitCount };
}

/**
 * Action row inside an expanded card. Presentation only — layout by action id,
 * no ownership/date rules.
 */
export default function CardExpandedActions({ actions }: CardExpandedActionsProps) {
  if (actions.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(PURPOSE_ENTER_MS)}
        exiting={FadeOut.duration(PURPOSE_EXIT_MS)}
        style={styles.root}
      >
        <Text style={[font("regular"), textSize("sm"), styles.empty]}>
          No actions available
        </Text>
      </Animated.View>
    );
  }

  const { row, centered, splitCount } = resolveActionRow(actions);

  return (
    <Animated.View
      entering={FadeIn.duration(PURPOSE_ENTER_MS)}
      exiting={FadeOut.duration(PURPOSE_EXIT_MS)}
      style={styles.root}
    >
      <View style={[styles.row, centered && styles.rowCentered]}>
        {row.map((action, index) => (
          <Fragment key={action.id}>
            {index > 0 && splitCount > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.action,
                centered ? styles.actionCentered : styles.actionFlex,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[font("regular"), textSize("sm"), styles.actionLabel]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
            </Pressable>
          </Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  rowCentered: {
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    width: ACTION_DIVIDER_WIDTH,
    alignSelf: "stretch",
    backgroundColor: colors.onPrimary,
  },
  action: {
    justifyContent: "center",
  },
  actionFlex: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  actionCentered: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  actionLabel: {
    color: colors.onPrimary,
    textAlign: "center",
  },
  empty: {
    color: colors.onPrimaryMuted,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
