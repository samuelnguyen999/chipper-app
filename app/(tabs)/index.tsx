import { useFontPresetSubscription } from "../../components/profile";
import TodayRecap from "../../components/today/TodayRecap";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function TodayScreen() {
  useRedirectWhenTabsLocked();
  useFontPresetSubscription();
  return <TodayRecap />;
}
