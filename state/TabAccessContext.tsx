import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Single source of truth for “full app” tab chrome:
 * - `false` until the first successful reflection submit (`Reflect` → `unlockMainTabs`).
 * - Drives tab bar visibility and pager `swipeEnabled` / `animationEnabled` in `app/(tabs)/_layout.tsx`.
 */
type TabAccessContextValue = {
  isHydrated: boolean;
  mainTabsUnlocked: boolean;
  unlockMainTabs: () => void;
};

const TabAccessContext = createContext<TabAccessContextValue | null>(null);
const MAIN_TABS_UNLOCKED_KEY = "mainTabsUnlocked";

async function safeGetUnlockFlag() {
  try {
    return await AsyncStorage.getItem(MAIN_TABS_UNLOCKED_KEY);
  } catch {
    return null;
  }
}

async function safeSetUnlockFlag() {
  try {
    await AsyncStorage.setItem(MAIN_TABS_UNLOCKED_KEY, "true");
  } catch {
    // Storage may be unavailable in some runtimes; keep unlock in memory.
  }
}

export function TabAccessProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [mainTabsUnlocked, setMainTabsUnlocked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await safeGetUnlockFlag();
        if (isMounted && stored === "true") {
          setMainTabsUnlocked(true);
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const unlockMainTabs = useCallback(() => {
    setMainTabsUnlocked(true);
    void safeSetUnlockFlag();
  }, []);

  const value = useMemo(
    () => ({ isHydrated, mainTabsUnlocked, unlockMainTabs }),
    [isHydrated, mainTabsUnlocked, unlockMainTabs],
  );

  return (
    <TabAccessContext.Provider value={value}>{children}</TabAccessContext.Provider>
  );
}

export function useTabAccess() {
  const context = useContext(TabAccessContext);
  if (!context) {
    throw new Error("useTabAccess must be used inside TabAccessProvider");
  }
  return context;
}
