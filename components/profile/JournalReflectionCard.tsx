import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SaveEditResult } from "../../hooks/useReflectionCardMutations";
import ReflectionCard from "../cards/ReflectionCard";
import type { ReflectionCardData } from "../cards/types";
import { colors, layout, spacing } from "../../constants";
import type { ReflectionRow } from "../../lib/reflections";
import { lensTypeFromCardType } from "../today/reflect/config";
import CardExpandedActions, {
  resolveActionRow,
} from "../interactions/CardExpandedActions";
import { useCardInteraction } from "../interactions/CardInteractionProvider";

type JournalReflectionCardProps = {
  reflection: ReflectionRow;
  showVisibility?: boolean;
  onHold?: (reflection: ReflectionRow) => void;
  editing?: boolean;
  editDraft?: string;
  onEditDraftChange?: (text: string) => void;
  onSaveEdit?: () => void | Promise<SaveEditResult | void>;
  editRejected?: boolean;
  exiting?: boolean;
  onExitComplete?: () => void;
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
  editing = false,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  editRejected = false,
  exiting = false,
  onExitComplete,
}: JournalReflectionCardProps) {
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
    // ReflectionCard uses marginBottom for list gap; entry box includes it, so
    // offset bottom by that gap to keep the icon inset against the card edge.
    bottom: spacing.md + layout.screenColumnGap,
    opacity: 0.55,
  },
  lockIconNudge: {
    transform: [{ translateX: -1 }],
  },
});
