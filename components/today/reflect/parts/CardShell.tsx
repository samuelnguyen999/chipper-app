import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "../../../../constants";

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
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.background,
  },
});
