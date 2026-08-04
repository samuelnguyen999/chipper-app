/**
 * Resolved card action — presentation-agnostic.
 * Rules live in resolveCardActions; execution is onPress (handlers from screens).
 */
export type CardAction = {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void | Promise<void>;
};

/** Props for CardInlineActions (v1). Presentation only — no ownership/date rules. */
export type CardActionPresentationProps = {
  visible: boolean;
  actions: CardAction[];
  onClose: () => void;
};
