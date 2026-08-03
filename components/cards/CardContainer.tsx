import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

type CardContainerProps = {
  children: ReactNode;
  /** Semantic hold — screens/adapters supply meaning; detection stays here. */
  onHold?: () => void;
};

/**
 * Owner of hold detection for saved reflection cards.
 * Translates long press → `onHold`. Does not expose `onLongPress`.
 */
export default function CardContainer({ children, onHold }: CardContainerProps) {
  return (
    <Pressable style={styles.root} onLongPress={onHold}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
});
