import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTabAccess } from "./TabAccessContext";

/** Safety net for deep-links while locked: keep user in pre-unlock Today flow. */
export function useRedirectWhenTabsLocked() {
  const router = useRouter();
  const { mainTabsUnlocked } = useTabAccess();

  useFocusEffect(
    useCallback(() => {
      if (!mainTabsUnlocked) {
        router.replace("/(locked)");
      }
    }, [mainTabsUnlocked, router]),
  );
}
