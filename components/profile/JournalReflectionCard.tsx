import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReflectionCard from "../cards/ReflectionCard";
import type { ReflectionCardData } from "../cards/types";
import { colors, spacing } from "../../constants";
import type { ReflectionRow } from "../../lib/reflections";
import { lensTypeFromCardType } from "../today/reflect/config";

type JournalReflectionCardProps = {
  reflection: ReflectionRow;
  showVisibility?: boolean;
  onHold?: () => void;
};

function formatCardType(cardType: string): string {
  if (!cardType) return cardType;
  return cardType.charAt(0).toUpperCase() + cardType.slice(1).toLowerCase();
}

function toCardData(reflection: ReflectionRow): ReflectionCardData {
  const type = lensTypeFromCardType(reflection.card_type);
  return {
    id: reflection.id,
    type,
    mode: formatCardType(reflection.card_type),
    prompt: reflection.question,
    response: reflection.response,
  };
}

/** Journal adapter: ReflectionRow → ReflectionCardData → ReflectionCard (+ optional visibility overlay). */
export default function JournalReflectionCard({
  reflection,
  showVisibility = false,
  onHold,
}: JournalReflectionCardProps) {
  return (
    <View style={styles.entry}>
      <ReflectionCard card={toCardData(reflection)} onHold={onHold} />
      {showVisibility ? (
        <View
          style={styles.visibilityOverlay}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons
            name={reflection.is_public ? "globe-outline" : "lock-closed-outline"}
            size={reflection.is_public ? 16 : 15}
            color={colors.textMuted}
            style={!reflection.is_public ? styles.lockIconNudge : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    position: "relative",
  },
  visibilityOverlay: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    opacity: 0.55,
  },
  lockIconNudge: {
    transform: [{ translateX: -1 }],
  },
});
