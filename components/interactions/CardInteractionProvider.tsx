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
import CardActionSheet from "./CardActionSheet";
import {
  resolveCardActions,
  type ResolveCardActionHandlers,
} from "./resolveCardActions";

type CardInteractionContextValue = {
  openCardActions: (reflection: ReflectionRow, userId: string | null) => void;
  closeCardActions: () => void;
};

const CardInteractionContext = createContext<CardInteractionContextValue | null>(null);

type CardInteractionProviderProps = {
  children: ReactNode;
  /**
   * Optional handlers embedded into resolved `CardAction.onPress` values.
   * Provider does not interpret action meaning — it only resolves and runs them.
   */
  handlers?: ResolveCardActionHandlers;
};

/**
 * Interaction state only: active reflection, resolved actions, sheet open/close.
 * Action behavior lives on each `CardAction.onPress`.
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
              setActiveReflection(null);
              setActions([]);
            } catch (error) {
              console.error("Card action failed:", error);
            }
          })();
        },
      }));

      setActiveReflection(reflection);
      setActions(resolved);
    },
    [handlers],
  );

  const value = useMemo(
    () => ({ openCardActions, closeCardActions }),
    [openCardActions, closeCardActions],
  );

  return (
    <CardInteractionContext.Provider value={value}>
      {children}
      <CardActionSheet
        visible={activeReflection != null}
        actions={actions}
        onClose={closeCardActions}
      />
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
