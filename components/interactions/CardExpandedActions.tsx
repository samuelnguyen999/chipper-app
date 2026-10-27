import { Fragment, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, font, spacing, textSize } from "../../constants";
import type { CardAction } from "./CardAction";

type CardExpandedActionsProps = {
  actions: CardAction[];
  /** Card wipe is removing this band. Skip the unmount fade so it cannot flash back. */
  instantExit?: boolean;
};

/** Same durations as ChoiceCard purpose toggle — fade only so layout stays centered. */
const PURPOSE_ENTER_MS = 800;
const PURPOSE_EXIT_MS = 640;
/** Opacity crossfade between the primary row and the ellipsis row. */
const ROW_FADE_MS = 500;
export const ACTION_DIVIDER_WIDTH = 1.5;

/** Shared row layout — dividers / border notches use `splitCount`. */
export function resolveActionRow(actions: CardAction[]): {
  row: CardAction[];
  more: CardAction[];
  centered: boolean;
  /** n actions in a split row → n−1 dividers (0 when centered / single). */
  splitCount: number;
} {
  const primary = actions.filter((action) => action.placement !== "more");
  const more = actions.filter((action) => action.placement === "more");
  const byId = new Map(primary.map((action) => [action.id, action]));
  const acknowledge = byId.get("acknowledge");
  const visibility = byId.get("toggle-visibility");
  const edit = byId.get("edit");
  const deleteAction = byId.get("delete");

  let row: CardAction[];
  let centered = false;

  if (acknowledge && primary.length === 1) {
    row = [acknowledge];
    centered = true;
  } else if (visibility && edit) {
    row = [edit, visibility];
  } else if (edit && deleteAction) {
    row = [edit, deleteAction];
  } else {
    row = primary;
    centered = primary.length === 1;
  }

  const splitCount = centered ? 0 : Math.max(0, row.length - 1);
  return { row, more, centered, splitCount };
}

function ActionButtons({
  actions,
  splits,
}: {
  actions: CardAction[];
  splits: number;
}) {
  return actions.map((action, index) => (
    <Fragment key={action.id}>
      {index > 0 && splits > 0 ? <View style={styles.divider} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityHint={action.disabled ? "Not available yet" : undefined}
        accessibilityState={action.disabled ? { disabled: true } : undefined}
        disabled={action.disabled}
        onPress={action.disabled ? undefined : action.onPress}
        onLongPress={() => {}}
        style={({ pressed }) => [
          styles.action,
          actions.length === 1 ? styles.actionCentered : styles.actionFlex,
          action.disabled && styles.actionDisabled,
          pressed && !action.disabled && styles.pressed,
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
  ));
}

/**
 * Action row inside an expanded card. Presentation only — layout by action id,
 * no ownership/date rules.
 */
export default function CardExpandedActions({
  actions,
  instantExit = false,
}: CardExpandedActionsProps) {
  const bandExit = instantExit ? undefined : FadeOut.duration(PURPOSE_EXIT_MS);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreProgress = useSharedValue(0);

  useEffect(() => {
    moreProgress.value = withTiming(moreOpen ? 1 : 0, {
      duration: ROW_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [moreOpen, moreProgress]);

  const primaryOpacity = useAnimatedStyle(() => ({
    opacity: 1 - moreProgress.value,
  }));
  const secondaryOpacity = useAnimatedStyle(() => ({
    opacity: moreProgress.value,
  }));

  if (actions.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(PURPOSE_ENTER_MS)}
        exiting={bandExit}
        style={styles.root}
      >
        <Text style={[font("regular"), textSize("sm"), styles.empty]}>
          No actions available
        </Text>
      </Animated.View>
    );
  }

  const { row, more, centered, splitCount } = resolveActionRow(actions);
  const moreCentered = more.length === 1;
  const moreSplits = Math.max(0, more.length - 1);

  return (
    <Animated.View
      entering={FadeIn.duration(PURPOSE_ENTER_MS)}
      exiting={bandExit}
      style={styles.root}
    >
      <View style={[styles.row, more.length > 0 && styles.rowWithMore]}>
        {more.length > 0 ? (
          <>
            <Animated.View
              pointerEvents={moreOpen ? "none" : "auto"}
              accessibilityElementsHidden={moreOpen}
              importantForAccessibility={moreOpen ? "no-hide-descendants" : "auto"}
              style={[styles.crossfade, centered && styles.crossfadeCentered, primaryOpacity]}
            >
              <ActionButtons actions={row} splits={splitCount} />
            </Animated.View>
            <Animated.View
              pointerEvents={moreOpen ? "auto" : "none"}
              accessibilityElementsHidden={!moreOpen}
              importantForAccessibility={moreOpen ? "auto" : "no-hide-descendants"}
              style={[
                styles.crossfade,
                moreCentered && styles.crossfadeCentered,
                secondaryOpacity,
              ]}
            >
              <ActionButtons actions={more} splits={moreSplits} />
            </Animated.View>
          </>
        ) : (
          <View style={[styles.crossfade, centered && styles.crossfadeCentered]}>
            <ActionButtons actions={row} splits={splitCount} />
          </View>
        )}
      </View>
      {more.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={moreOpen ? "Close more options" : "More options"}
          accessibilityState={{ expanded: moreOpen }}
          hitSlop={8}
          onPress={() => setMoreOpen((open) => !open)}
          onLongPress={() => {}}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.onPrimary} />
        </Pressable>
      ) : null}
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
  rowWithMore: {
    paddingHorizontal: 44,
  },
  crossfade: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  crossfadeCentered: {
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  moreButton: {
    position: "absolute",
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.onPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: {
    opacity: 0.45,
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
