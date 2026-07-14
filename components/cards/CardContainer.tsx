import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type CardContainerProps = {
  children: ReactNode;
  /** Placeholder for future hold interaction — unused in Phase 1. */
  onHold?: () => void;
};

/**
 * Future owner of hold detection / pressed state / card actions.
 * Phase 1: passthrough wrapper only.
 */
export default function CardContainer({ children }: CardContainerProps) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
});
