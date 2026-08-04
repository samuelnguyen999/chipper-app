import { StyleSheet, View } from "react-native";
import ReflectionCard from "../cards/ReflectionCard";
import type { ReflectionCardData } from "../cards/types";
import type { ReflectionRow } from "../../lib/reflections";
import { spacing } from "../../constants";
import { lensTypeFromCardType } from "../today/reflect/config";
import CardExpandedActions from "../interactions/CardExpandedActions";
import { useCardInteraction } from "../interactions/CardInteractionProvider";
import AcknowledgeChip from "./AcknowledgeChip";

type CommunityReflectionCardProps = {
  reflection: ReflectionRow;
  onHold?: (reflection: ReflectionRow) => void;
  /** Local quiet acknowledgement mark for this viewer only. */
  acknowledged?: boolean;
};

function toCardData(reflection: ReflectionRow): ReflectionCardData {
  const type = lensTypeFromCardType(reflection.card_type);
  return {
    id: reflection.id,
    type,
    mode: type.toUpperCase(),
    prompt: reflection.question,
    response: reflection.response,
  };
}

/** Community adapter: ReflectionRow → ReflectionCardData → ReflectionCard. */
export default function CommunityReflectionCard({
  reflection,
  onHold,
  acknowledged = false,
}: CommunityReflectionCardProps) {
  const { activeReflectionId, actions } = useCardInteraction();
  const isActive = activeReflectionId === reflection.id;

  return (
    <View style={styles.entry}>
      <ReflectionCard
        card={toCardData(reflection)}
        onHold={onHold ? () => onHold(reflection) : undefined}
        footer={isActive ? <CardExpandedActions actions={actions} /> : undefined}
      />
      {acknowledged ? (
        <View
          style={styles.ackChip}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <AcknowledgeChip size={40} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },
  ackChip: {
    position: "absolute",
    bottom: -spacing.lg,
    right: -spacing.lg,
    opacity: 1,
    transform: [{ rotate: "20deg" }],
  },
});
