import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/** Local calendar day (device timezone), midnight boundary. */
export function getLocalCalendarDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  return DATE_KEY_RE.test(value);
}

export type OnboardingGateStorage = {
  lastOnboardingDate: string | null;
};

/** Reserved for a future server flag; unused today. */
export type OnboardingGateRemote = {
  allowMainTabs?: boolean;
};

export type ShouldShowMainTabsInput = {
  hydrated: boolean;
  storage: OnboardingGateStorage;
  remote?: OnboardingGateRemote;
  /** Skip daily gate (dev `devStartAt: "mainTabs"`). */
  devOverride?: boolean;
  /** Override “today” (tests). Defaults to {@link getLocalCalendarDate}. */
  today?: string;
};

/**
 * Whether the user may use main tabs (completed onboarding for the current local day).
 * Returns false until `hydrated` so routing does not flash the wrong tree.
 */
export function shouldShowMainTabs({
  hydrated,
  storage,
  remote,
  devOverride = false,
  today = getLocalCalendarDate(),
}: ShouldShowMainTabsInput): boolean {
  if (!hydrated) return false;
  if (devOverride) return true;
  if (remote?.allowMainTabs === false) return false;
  const { lastOnboardingDate } = storage;
  if (!lastOnboardingDate || !isValidDateKey(lastOnboardingDate)) return false;
  return lastOnboardingDate === today;
}

export type DevStartAt = "receive" | "reflect" | "mainTabs";

export type DevGateFlags = {
  /**
   * Dev / non-production entry point. `null` = normal daily onboarding gate.
   * - receive — locked route, Receive landing
   * - reflect — locked route, Reflect (skip Receive)
   * - mainTabs — skip to tabs
   */
  startAt: DevStartAt | null;
};

function parseDevStartAt(value: unknown): DevStartAt | null {
  if (value === "receive" || value === "reflect" || value === "mainTabs") {
    return value;
  }
  return null;
}

function canUseDevGateFlags(): boolean {
  const extra = Constants.expoConfig?.extra as { appEnv?: string } | undefined;
  if (extra?.appEnv === "production") return false;
  const nonProduction = extra?.appEnv != null && extra.appEnv !== "production";
  const devBuild = typeof __DEV__ !== "undefined" && __DEV__;
  return devBuild || nonProduction;
}

/** Dev / non-production only. Production always returns `startAt: null`. */
export function resolveDevGateFlags(): DevGateFlags {
  if (!canUseDevGateFlags()) {
    return { startAt: null };
  }
  const extra = Constants.expoConfig?.extra as
    | {
        devStartAt?: unknown;
        /** @deprecated Use `devStartAt` */
        forceMainTabs?: boolean;
        /** @deprecated Use `devStartAt: "receive"` */
        forceOnboarding?: boolean;
      }
    | undefined;

  const fromTier = parseDevStartAt(extra?.devStartAt);
  if (fromTier) return { startAt: fromTier };

  if (extra?.forceMainTabs === true) return { startAt: "mainTabs" };
  if (extra?.forceOnboarding === true) return { startAt: "receive" };

  return { startAt: null };
}

const STORAGE_KEYS = {
  lastOnboardingDate: "lastOnboardingDate",
  /** Pre–daily-gate forever unlock; migrated once to today’s date. */
  legacyMainTabsUnlocked: "mainTabsUnlocked",
} as const;

export async function loadOnboardingGateStorage(): Promise<OnboardingGateStorage> {
  try {
    let lastOnboardingDate = await AsyncStorage.getItem(STORAGE_KEYS.lastOnboardingDate);
    if (lastOnboardingDate && !isValidDateKey(lastOnboardingDate)) {
      lastOnboardingDate = null;
    }

    if (!lastOnboardingDate) {
      const legacy = await AsyncStorage.getItem(STORAGE_KEYS.legacyMainTabsUnlocked);
      if (legacy === "true") {
        lastOnboardingDate = getLocalCalendarDate();
        await AsyncStorage.setItem(STORAGE_KEYS.lastOnboardingDate, lastOnboardingDate);
        await AsyncStorage.removeItem(STORAGE_KEYS.legacyMainTabsUnlocked);
      }
    }

    return { lastOnboardingDate };
  } catch {
    return { lastOnboardingDate: null };
  }
}

export async function persistOnboardingCompleteToday(): Promise<OnboardingGateStorage> {
  const lastOnboardingDate = getLocalCalendarDate();
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.lastOnboardingDate, lastOnboardingDate);
    await AsyncStorage.removeItem(STORAGE_KEYS.legacyMainTabsUnlocked);
  } catch {
    // Session unlock still applies via in-memory storage in TabAccessProvider.
  }
  return { lastOnboardingDate };
}
