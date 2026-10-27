import { StyleSheet, View } from "react-native";
import type { SaveEditResult } from "../../hooks/useReflectionCardMutations";
import ReflectionCard from "../cards/ReflectionCard";
import type { ReflectionCardData } from "../cards/types";
import type { ReflectionRow } from "../../lib/reflections";
import { layout } from "../../constants";
import { lensTypeFromCardType } from "../today/reflect/config";
import CardExpandedActions, {
  resolveActionRow,
} from "../interactions/CardExpandedActions";
import { useCardInteraction } from "../interactions/CardInteractionProvider";
import AcknowledgeChip, { ACKNOWLEDGE_CHIP_SIZE } from "./AcknowledgeChip";

type CommunityReflectionCardProps = {
  reflection: ReflectionRow;
  onHold?: (reflection: ReflectionRow) => void;
  /** Local quiet acknowledgement mark for this viewer only. */
  acknowledged?: boolean;
  editing?: boolean;
  editDraft?: string;
  onEditDraftChange?: (text: string) => void;
  onSaveEdit?: () => void | Promise<SaveEditResult | void>;
  editRejected?: boolean;
  exiting?: boolean;
  onExitComplete?: () => void;
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
  editing = false,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  editRejected = false,
  exiting = false,
  onExitComplete,
}: CommunityReflectionCardProps) {
  const { activeReflectionId, actions } = useCardInteraction();
  const isActive = activeReflectionId === reflection.id && !exiting;
  const borderSplits = isActive ? resolveActionRow(actions).splitCount : 0;

  return (
    <View style={styles.entry}>
      <ReflectionCard
        card={toCardData(reflection)}
        onHold={onHold ? () => onHold(reflection) : undefined}
        footer={isActive ? <CardExpandedActions actions={actions} /> : undefined}
        borderSplits={borderSplits}
        editing={editing}
        editDraft={editDraft}
        onEditDraftChange={onEditDraftChange}
        onSaveEdit={onSaveEdit}
        editRejected={editRejected}
        exiting={exiting}
        onExitComplete={onExitComplete}
      />
      {acknowledged ? (
        <View
          style={styles.ackChip}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <AcknowledgeChip />
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
    // ~30% overhang (same ratio as the old -lg / 40px chip). Entry includes list marginBottom.
    bottom: -Math.round(ACKNOWLEDGE_CHIP_SIZE * 0.35) + layout.screenColumnGap,
    right: -Math.round(ACKNOWLEDGE_CHIP_SIZE * 0.35),
    opacity: 1,
    transform: [{ rotate: "20deg" }],
  },
});

