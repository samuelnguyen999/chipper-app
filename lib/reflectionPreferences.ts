import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReflectionVisibilityPreference = "private" | "public";

const STORAGE_KEY = "chipper.reflectionVisibilityPreference";
const DEFAULT_VISIBILITY: ReflectionVisibilityPreference = "public";

function isVisibilityPreference(value: string): value is ReflectionVisibilityPreference {
  return value === "private" || value === "public";
}

/** Last visibility chosen on this device. Defaults to public. */
export async function getReflectionVisibilityPreference(): Promise<ReflectionVisibilityPreference> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isVisibilityPreference(stored)) {
      return stored;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_VISIBILITY;
}

/** Persist the latest visibility selection for this device. */
export async function setReflectionVisibilityPreference(
  value: ReflectionVisibilityPreference,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, value);
}
