import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  endBreathUnlock,
  getBreathUnlockVisible,
  subscribeBreathUnlock,
} from "../../../state/breathUnlock";
import BreathUnlockOverlay from "./BreathUnlockOverlay";

/**
 * Root-mounted host: overlay survives replace to Community so the last
 * exhale can uncover the tab bar instead of navigating after the fact.
 */
export default function BreathUnlockHost() {
  const router = useRouter();
  const [visible, setVisible] = useState(getBreathUnlockVisible);

  useEffect(() => subscribeBreathUnlock(() => setVisible(getBreathUnlockVisible())), []);

  return (
    <BreathUnlockOverlay
      visible={visible}
      onCovered={() => {
        router.replace("/(tabs)/community");
      }}
      onFinished={() => {
        endBreathUnlock();
      }}
    />
  );
}
