import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "../../constants";

export const CARD_SHELL_PADDING = spacing.lg;
export const CARD_SHELL_BORDER = 1;

/** Inner content width for a CardShell with the given outer width (border-box). */
export function cardShellContentWidth(outerWidth: number): number {
  return Math.max(0, outerWidth - CARD_SHELL_PADDING * 2 - CARD_SHELL_BORDER * 2);
}

/** Inner content height for a CardShell with the given outer height (border-box). */
export function cardShellContentHeight(outerHeight: number): number {
  return Math.max(0, outerHeight - CARD_SHELL_PADDING * 2 - CARD_SHELL_BORDER * 2);
}

type CardShellProps = {
  children: ReactNode;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function CardShell({ children, selected = false, style }: CardShellProps) {
  return (
    <View style={[styles.card, selected && styles.cardSelected, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: CARD_SHELL_PADDING,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: CARD_SHELL_BORDER,
    borderColor: colors.borderSubtle,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.background,
  },
});
