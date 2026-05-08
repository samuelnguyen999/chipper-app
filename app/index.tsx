import { Redirect } from "expo-router";
import { useTabAccess } from "../state/TabAccessContext";

export default function Index() {
  const { isHydrated, mainTabsUnlocked } = useTabAccess();

  if (!isHydrated) {
    return null;
  }

  return <Redirect href={mainTabsUnlocked ? "/(tabs)" : "/(locked)"} />;
}
