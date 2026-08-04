import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ReflectionRow } from "../../lib/reflections";
import type { CardAction } from "./CardAction";
import {
  resolveCardActions,
  type ResolveCardActionHandlers,
} from "./resolveCardActions";

type CardInteractionContextValue = {
  openCardActions: (reflection: ReflectionRow, userId: string | null) => void;
  closeCardActions: () => void;
  /** Active row snapshot (for consumers that need more than id). */
  activeReflection: ReflectionRow | null;
  /** Match key — cards compare this to their reflection.id */
  activeReflectionId: string | null;
  actions: CardAction[];
};

const CardInteractionContext = createContext<CardInteractionContextValue | null>(null);

type CardInteractionProviderProps = {
  children: ReactNode;
  /**
   * Handlers embedded into resolved CardAction.onPress by resolveCardActions.
   * Provider does not interpret action ids or call services.
   */
  handlers?: ResolveCardActionHandlers;
};

/**
 * Active-card state + action lifecycle only.
 * Presentation mounts on the matching card; business logic stays in screen handlers / resolveCardActions.
 */
export function CardInteractionProvider({
  children,
  handlers,
}: CardInteractionProviderProps) {
  const [activeReflection, setActiveReflection] = useState<ReflectionRow | null>(null);
  const [actions, setActions] = useState<CardAction[]>([]);

  const closeCardActions = useCallback(() => {
    setActiveReflection(null);
    setActions([]);
  }, []);

  const openCardActions = useCallback(
    (reflection: ReflectionRow, userId: string | null) => {
      const resolved = resolveCardActions(
        reflection,
        userId,
        new Date(),
        handlers,
      ).map((action) => ({
        ...action,
        onPress: () => {
          void (async () => {
            try {
              await action.onPress();
              closeCardActions();
            } catch (error) {
              console.error("Card action failed:", error);
            }
          })();
        },
      }));

      // No actions (e.g. acknowledgements feature off on others' cards) → no expand.
      if (resolved.length === 0) {
        return;
      }

      setActiveReflection(reflection);
      setActions(resolved);
    },
    [handlers, closeCardActions],
  );

  const value = useMemo(
    () => ({
      openCardActions,
      closeCardActions,
      activeReflection,
      activeReflectionId: activeReflection?.id ?? null,
      actions,
    }),
    [openCardActions, closeCardActions, activeReflection, actions],
  );

  return (
    <CardInteractionContext.Provider value={value}>
      {children}
    </CardInteractionContext.Provider>
  );
}

export function useCardInteraction(): CardInteractionContextValue {
  const ctx = useContext(CardInteractionContext);
  if (!ctx) {
    throw new Error("useCardInteraction must be used within CardInteractionProvider");
  }
  return ctx;
}
