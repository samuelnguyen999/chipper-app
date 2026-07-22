import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { syncOfflineReflections } from "../lib/offlineReflections";

/**
 * Fire-and-forget offline queue sync:
 * - once when mounted (after auth is ready)
 * - again when connectivity returns offline → online
 *
 * No UI, no blocking, no retry timers.
 */
export function useOfflineReflectionSync() {
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    void syncOfflineReflections();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      if (wasOfflineRef.current && !offline) {
        void syncOfflineReflections();
      }
      wasOfflineRef.current = offline;
    });

    return unsubscribe;
  }, []);
}
