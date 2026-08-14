import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Keyboard } from "react-native";
import {
  deleteReflection,
  updateReflectionResponse,
  updateReflectionVisibility,
  type ReflectionRow,
} from "../lib/reflections";

export type ReflectionExitKind = "delete" | "private";

export type ReflectionExitPending = {
  kind: ReflectionExitKind;
  reflection: ReflectionRow;
};

type UseReflectionCardMutationsArgs = {
  setReflections: Dispatch<SetStateAction<ReflectionRow[]>>;
};

/**
 * Shared edit / save / exit-wipe session for Journal + Community lists.
 * Screens keep visibility/acknowledge policy and compose ResolveCardActionHandlers.
 */
export function useReflectionCardMutations({
  setReflections,
}: UseReflectionCardMutationsArgs) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [exitingId, setExitingId] = useState<string | null>(null);
  const savingEditRef = useRef(false);
  const pendingExitRef = useRef<ReflectionExitPending | null>(null);

  const beginEdit = useCallback((reflection: ReflectionRow) => {
    setEditingId(reflection.id);
    setEditDraft(reflection.response);
  }, []);

  /** UI first: collapse card; API + list patch run in finishExit. */
  const startExit = useCallback((pending: ReflectionExitPending) => {
    pendingExitRef.current = pending;
    setExitingId(pending.reflection.id);
  }, []);

  const finishExit = useCallback(
    async (reflectionId: string) => {
      const pending = pendingExitRef.current;
      pendingExitRef.current = null;
      if (!pending || pending.reflection.id !== reflectionId) {
        setExitingId(null);
        return;
      }

      const { reflection, kind } = pending;

      // Drop from list while still collapsed — clearing exiting first pops the card back.
      setReflections((prev) => prev.filter((row) => row.id !== reflection.id));
      setEditingId((current) => {
        if (current === reflection.id) {
          setEditDraft("");
          return null;
        }
        return current;
      });
      setExitingId(null);

      try {
        if (kind === "delete") {
          await deleteReflection(reflection.id);
        } else {
          await updateReflectionVisibility(reflection.id, false);
        }
      } catch (error) {
        console.error(
          kind === "delete" ? "Delete reflection failed:" : "Make private failed:",
          error,
        );
      }
    },
    [setReflections],
  );

  const saveEdit = useCallback(async () => {
    if (!editingId || savingEditRef.current) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;

    savingEditRef.current = true;
    try {
      const updated = await updateReflectionResponse(editingId, trimmed);
      setReflections((prev) =>
        prev.map((row) =>
          row.id === updated.id ? { ...row, response: updated.response } : row,
        ),
      );
      setEditingId(null);
      setEditDraft("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Edit reflection failed:", error);
    } finally {
      savingEditRef.current = false;
    }
  }, [editDraft, editingId, setReflections]);

  return {
    editingId,
    editDraft,
    setEditDraft,
    exitingId,
    beginEdit,
    saveEdit,
    startExit,
    finishExit,
  };
}
