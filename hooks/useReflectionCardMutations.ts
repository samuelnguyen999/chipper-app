import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Keyboard } from "react-native";
import { moderateReflection } from "../lib/moderationService";
import {
  deleteReflection,
  updateReflectionResponse,
  updateReflectionVisibility,
  type ReflectionRow,
} from "../lib/reflections";

export type SaveEditResult = "saved" | "rejected" | "failed" | "skipped";

export type ReflectionExitKind = "delete" | "private" | "dismiss";

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
  const [editDraft, setEditDraftState] = useState("");
  const [editRejected, setEditRejected] = useState(false);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const savingEditRef = useRef(false);
  const pendingExitRef = useRef<ReflectionExitPending | null>(null);

  const setEditDraft = useCallback((text: string) => {
    setEditDraftState(text);
    setEditRejected(false);
  }, []);

  const beginEdit = useCallback((reflection: ReflectionRow) => {
    setEditingId(reflection.id);
    setEditDraftState(reflection.response);
    setEditRejected(false);
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

      if (kind === "dismiss") return;

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
    [setEditDraft, setReflections],
  );

  const saveEdit = useCallback(async (): Promise<SaveEditResult> => {
    if (!editingId || savingEditRef.current) return "skipped";
    const trimmed = editDraft.trim();
    if (!trimmed) return "skipped";

    savingEditRef.current = true;
    try {
      const moderation = await moderateReflection(trimmed);
      if (!moderation.allowed) {
        setEditRejected(true);
        return "rejected";
      }

      const updated = await updateReflectionResponse(editingId, trimmed);
      setReflections((prev) =>
        prev.map((row) =>
          row.id === updated.id ? { ...row, response: updated.response } : row,
        ),
      );
      setEditingId(null);
      setEditDraftState("");
      setEditRejected(false);
      Keyboard.dismiss();
      return "saved";
    } catch (error) {
      console.error("Edit reflection failed:", error);
      return "failed";
    } finally {
      savingEditRef.current = false;
    }
  }, [editDraft, editingId, setReflections]);

  return {
    editingId,
    editDraft,
    setEditDraft,
    editRejected,
    exitingId,
    beginEdit,
    saveEdit,
    startExit,
    finishExit,
  };
}
