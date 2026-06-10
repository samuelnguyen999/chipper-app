import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getLocalCalendarDate,
  loadOnboardingGateStorage,
  persistOnboardingCompleteToday,
  resolveDevGateFlags,
  shouldShowMainTabs,
  type OnboardingGateStorage,
} from "./onboardingGate";

/**
 * Tab chrome gate: main tabs after daily onboarding (Reflect submit) is complete for **today**
 * (local calendar date in AsyncStorage). See `onboardingGate.ts` for rules and dev override.
 */
type TabAccessContextValue = {
  isHydrated: boolean;
  mainTabsUnlocked: boolean;
  unlockMainTabs: () => void;
};

const TabAccessContext = createContext<TabAccessContextValue | null>(null);

export function TabAccessProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [storage, setStorage] = useState<OnboardingGateStorage>({ lastOnboardingDate: null });
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const devFlags = resolveDevGateFlags();

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const loaded = await loadOnboardingGateStorage();
      if (isMounted) {
        setStorage(loaded);
        setIsHydrated(true);
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const mainTabsUnlocked = useMemo(() => {
    if (sessionUnlocked) return isHydrated;
    const gateStorage =
      devFlags.forceOnboarding ? { lastOnboardingDate: null } : storage;
    return shouldShowMainTabs({
      hydrated: isHydrated,
      storage: gateStorage,
      devOverride: devFlags.forceMainTabs && !devFlags.forceOnboarding,
    });
  }, [devFlags.forceMainTabs, devFlags.forceOnboarding, isHydrated, sessionUnlocked, storage]);

  const unlockMainTabs = useCallback(() => {
    const today = getLocalCalendarDate();
    setSessionUnlocked(true);
    setStorage({ lastOnboardingDate: today });
    void persistOnboardingCompleteToday();
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
