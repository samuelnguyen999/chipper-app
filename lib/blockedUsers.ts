import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@chipper/blocked-users/v1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BlockedUserIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false };

export type BlockUserResult = { status: "blocked" } | { status: "failed" };

export type UnblockUserResult = { status: "unblocked" } | { status: "failed" };

/** Session-only. Storage stays the persisted list; these cover in-flight block and unblock. */
const sessionBlockedIds = new Set<string>();
const sessionUnblockedIds = new Set<string>();

function rememberBlocked(id: string) {
  sessionUnblockedIds.delete(id);
  sessionBlockedIds.add(id);
}

function rememberUnblocked(id: string) {
  sessionBlockedIds.delete(id);
  sessionUnblockedIds.add(id);
}

/** Stored ids, plus blocks and minus unblocks completed after that read. */
export function idsHiddenFromFeed(storedIds: readonly string[]): Set<string> {
  const hidden = new Set<string>();
  for (const id of storedIds) {
    if (!sessionUnblockedIds.has(id)) hidden.add(id);
  }
  for (const id of sessionBlockedIds) hidden.add(id);
  return hidden;
}

function canonicalUserId(value: string): string | null {
  const id = value.trim().toLowerCase();
  return UUID_PATTERN.test(id) ? id : null;
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = canonicalUserId(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
  }
  return [...seen];
}

/** Local block list. A read error is `ok: false`, not an empty list. */
export async function getBlockedUserIds(): Promise<BlockedUserIdsResult> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return { ok: true, ids: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { ok: false };
    return { ok: true, ids: normalizeIds(parsed) };
  } catch {
    return { ok: false };
  }
}

/**
 * Persist a blocked user id. Does not store the current user's own id.
 * Already-stored ids are left as-is and still count as blocked.
 */
export async function blockUser(
  targetUserId: string,
  currentUserId: string | null,
): Promise<BlockUserResult> {
  const target = canonicalUserId(targetUserId);
  const current = currentUserId ? canonicalUserId(currentUserId) : null;
  if (!target || (current != null && target === current)) {
    return { status: "failed" };
  }

  const existing = await getBlockedUserIds();
  if (!existing.ok) return { status: "failed" };
  if (existing.ids.includes(target)) {
    rememberBlocked(target);
    return { status: "blocked" };
  }

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...existing.ids, target]),
    );
  } catch {
    return { status: "failed" };
  }

  rememberBlocked(target);
  return { status: "blocked" };
}

/**
 * Remove a blocked user id. Already-absent ids are `unblocked` when the read succeeds.
 * Memory updates only after that read or write succeeds.
 */
export async function unblockUser(userId: string): Promise<UnblockUserResult> {
  const target = canonicalUserId(userId);
  if (!target) return { status: "failed" };

  const existing = await getBlockedUserIds();
  if (!existing.ok) return { status: "failed" };
  if (!existing.ids.includes(target)) {
    rememberUnblocked(target);
    return { status: "unblocked" };
  }

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(existing.ids.filter((id) => id !== target)),
    );
  } catch {
    return { status: "failed" };
  }

  rememberUnblocked(target);
  return { status: "unblocked" };
}
