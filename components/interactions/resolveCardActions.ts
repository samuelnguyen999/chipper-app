import type { ReflectionRow } from "../../lib/reflections";
import { isAcknowledgementsEnabled } from "../../lib/featureFlags";
import type { CardAction } from "./CardAction";

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function placeholder(id: string, reflectionId: string): () => void {
  return () => {
    console.log("Card action placeholder:", id, reflectionId);
  };
}

export type ResolveCardActionHandlers = {
  /** Wired for today's own cards — omit to keep a log placeholder. */
  toggleVisibility?: (
    reflection: ReflectionRow,
    nextPublic: boolean,
  ) => void | Promise<void>;
  /** Quiet acknowledgement for another user's card. */
  acknowledge?: (reflection: ReflectionRow) => void | Promise<void>;
};

/**
 * Sole owner of which hold-actions exist (ownership + date).
 * Product rules only — no UI, no storage/service imports.
 * Future: acknowledge | edit | visibility | delete — keep rules here.
 */
export function resolveCardActions(
  reflection: ReflectionRow,
  currentUserId: string | null,
  currentDate: Date = new Date(),
  handlers: ResolveCardActionHandlers = {},
): CardAction[] {
  if (!currentUserId) {
    return [];
  }

  const isOwner = reflection.user_id === currentUserId;

  if (!isOwner) {
    // Ghosted unless `expo.extra.acknowledgementsEnabled` is true in app.json.
    if (!isAcknowledgementsEnabled()) {
      return [];
    }
    return [
      {
        id: "acknowledge",
        label: "Quietly acknowledge",
        onPress: handlers.acknowledge
          ? () => handlers.acknowledge!(reflection)
          : placeholder("acknowledge", reflection.id),
      },
    ];
  }

  const isToday = reflection.reflection_date === toLocalDateKey(currentDate);
  const editAction: CardAction = {
    id: "edit",
    label: "Edit",
    onPress: placeholder("edit", reflection.id),
  };

  if (isToday) {
    const nextPublic = !reflection.is_public;
    return [
      {
        id: "toggle-visibility",
        label: reflection.is_public ? "Make Private" : "Make Public",
        onPress: handlers.toggleVisibility
          ? () => handlers.toggleVisibility!(reflection, nextPublic)
          : placeholder("toggle-visibility", reflection.id),
      },
      editAction,
    ];
  }

  return [
    editAction,
    {
      id: "delete",
      label: "Delete",
      onPress: placeholder("delete", reflection.id),
    },
  ];
}
