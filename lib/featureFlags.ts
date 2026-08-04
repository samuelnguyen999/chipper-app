import Constants from "expo-constants";

type AppExtra = {
  acknowledgementsEnabled?: boolean;
};

/**
 * Feature toggles from `app.json` → `expo.extra`.
 * Acknowledgements stay in the codebase; flip this to surface them.
 */
export function isAcknowledgementsEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as AppExtra | undefined;
  return extra?.acknowledgementsEnabled === true;
}
