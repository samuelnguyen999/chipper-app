import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DuplicateReflectionError,
  isDuplicateReflectionError,
  saveReflection,
  type ReflectionRow,
  type SaveReflectionInput,
} from "./reflections";

const STORAGE_KEY = "chipper.offlineReflections";

function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeLocalId(reflectionDate: string): string {
  return `offline:${reflectionDate}`;
}

async function readQueue(): Promise<ReflectionRow[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ReflectionRow[];
  } catch {
    return [];
  }
}

async function writeQueue(rows: ReflectionRow[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

/** Pending offline reflections (ReflectionRow-shaped for Journal). */
export async function getOfflineReflections(): Promise<ReflectionRow[]> {
  return readQueue();
}

/**
 * Queue a reflection for later upload.
 * One pending item per reflection_date — a second claim for today throws
 * DuplicateReflectionError (dev re-submit) instead of inserting another row.
 */
export async function addOfflineReflection(
  input: SaveReflectionInput,
  userId = "",
): Promise<ReflectionRow> {
  const reflection_date = getLocalDateKey();
  const queue = await readQueue();
  if (queue.some((item) => item.reflection_date === reflection_date)) {
    throw new DuplicateReflectionError();
  }

  const created_at = new Date().toISOString();
  const row: ReflectionRow = {
    id: makeLocalId(reflection_date),
    user_id: userId,
    card_type: input.cardType,
    question: input.question,
    response: input.response,
    is_public: input.isPublic,
    reflection_date,
    created_at,
  };

  await writeQueue([...queue, row]);
  return row;
}

export async function removeOfflineReflection(id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

/**
 * Upload queued reflections via saveReflection. Successful items are removed.
 * Duplicate-day conflicts are treated as already synced (drop from queue).
 * Other failures stay queued. Silent — no UI / no throw for partial failure.
 */
export async function syncOfflineReflections(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    const cardType = item.card_type;
    if (cardType !== "ground" && cardType !== "understand" && cardType !== "align") {
      continue;
    }

    try {
      await saveReflection({
        cardType,
        question: item.question,
        response: item.response,
        isPublic: item.is_public,
      });
      await removeOfflineReflection(item.id);
    } catch (error) {
      if (isDuplicateReflectionError(error)) {
        await removeOfflineReflection(item.id);
        continue;
      }
      // Leave item queued; try again on next sync.
    }
  }
}

/** Merge remote + offline for Journal. Prefer remote when same reflection_date. */
export function mergeReflectionsForJournal(
  remote: ReflectionRow[],
  offline: ReflectionRow[],
): ReflectionRow[] {
  const remoteDates = new Set(remote.map((row) => row.reflection_date));
  const offlineOnly = offline.filter((row) => !remoteDates.has(row.reflection_date));
  return [...remote, ...offlineOnly].sort((a, b) => {
    const byCreated = b.created_at.localeCompare(a.created_at);
    if (byCreated !== 0) return byCreated;
    return b.reflection_date.localeCompare(a.reflection_date);
  });
}

/** True when the error (or device state) indicates a network/offline failure. */
export function isNetworkError(error: unknown): boolean {
  if (error == null) return false;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const lower = message.toLowerCase();
  return (
    lower.includes("network request failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("network error") ||
    lower.includes("networkerror") ||
    lower.includes("internet") ||
    lower.includes("offline") ||
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("connection")
  );
}
