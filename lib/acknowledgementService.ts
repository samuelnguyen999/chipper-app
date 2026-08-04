import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@chipper/acknowledgements/v1";
export const ACKNOWLEDGEMENTS_DAILY_LIMIT = 3;

export type AcknowledgeResult =
  | { status: "success"; countToday: number }
  | { status: "already_acknowledged" }
  | { status: "daily_limit_reached" };

type DayBucket = {
  date: string;
  reflectionIds: string[];
};

function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function readBucket(now = new Date()): Promise<DayBucket> {
  const today = getLocalDateKey(now);
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { date: today, reflectionIds: [] };
    }
    const parsed = JSON.parse(raw) as Partial<DayBucket>;
    if (parsed.date !== today || !Array.isArray(parsed.reflectionIds)) {
      return { date: today, reflectionIds: [] };
    }
    return {
      date: today,
      reflectionIds: parsed.reflectionIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return { date: today, reflectionIds: [] };
  }
}

async function writeBucket(bucket: DayBucket): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bucket));
}

/**
 * Local acknowledgement store. UI should call this — not AsyncStorage.
 * Swap implementation later (Supabase) without changing callers.
 */
export async function acknowledgeReflection(
  reflectionId: string,
  now = new Date(),
): Promise<AcknowledgeResult> {
  const bucket = await readBucket(now);

  if (bucket.reflectionIds.includes(reflectionId)) {
    return { status: "already_acknowledged" };
  }

  if (bucket.reflectionIds.length >= ACKNOWLEDGEMENTS_DAILY_LIMIT) {
    return { status: "daily_limit_reached" };
  }

  const next: DayBucket = {
    date: bucket.date,
    reflectionIds: [...bucket.reflectionIds, reflectionId],
  };
  await writeBucket(next);
  return { status: "success", countToday: next.reflectionIds.length };
}

/** Today's acknowledged reflection ids (empty set if a new calendar day). */
export async function getTodaysAcknowledgedIds(now = new Date()): Promise<string[]> {
  const bucket = await readBucket(now);
  return bucket.reflectionIds;
}

export async function hasAcknowledgedToday(
  reflectionId: string,
  now = new Date(),
): Promise<boolean> {
  const ids = await getTodaysAcknowledgedIds(now);
  return ids.includes(reflectionId);
}
