import type { ViewStyle } from "react-native";
import { colors } from "./colors";
import { layout } from "./spacing";

/**
 * Shared shell styles for main tab scenes (Community, Reflect, Profile, focus flows).
 * Tune spacing via `layout.*`; scene background via `colors.background`.
 */
export const screen = {
  /** ScrollView wrapper: fills width, scene background. */
  scroll: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  } satisfies ViewStyle,

  /** ScrollView `contentContainerStyle` — default bottom = tab scene scroll inset. */
  scrollContent: {
    paddingTop: layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenScrollBottomPadding,
    backgroundColor: colors.background,
  } satisfies ViewStyle,

  /** Full-height column — add horizontal/top/bottom padding in the scene when needed. */
  fill: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: colors.background,
  } satisfies ViewStyle,

  /** Today tab: receive ↔ reflect host. */
  tabSceneRoot: {
    flex: 1,
    backgroundColor: colors.background,
  } satisfies ViewStyle,
} as const;
