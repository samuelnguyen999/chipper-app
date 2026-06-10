import LogoGallery from "../../components/profile";
import { useRedirectWhenTabsLocked } from "../../state/useRedirectWhenTabsLocked";

export default function ProfileScreen() {
  useRedirectWhenTabsLocked();
  return <LogoGallery />;
}
