/**
 * Spacing scale (4px base). Use for padding, margin, gap, and layout rhythm.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  /** Vertical padding for compact controls (e.g. buttons) */
  buttonY: 14,
} as const;

/**
 * Corner radii
 */
export const radii = {
  md: 12,
} as const;

/**
 * Fixed widths / hit targets
 */
export const sizing = {
  buttonMinWidth: 200,
} as const;

/**
 * Common layout presets (screen edges, section gaps)
 *
 * `tabBarDock*` matches the bottom tab bar: `TabBarItem` icon margin 2 + size 22 + margin 2,
 * a tab-label column (~12px type + margins), cell padding top 8 (`tabBarItemStyle`) and
 * bottom 10 (default `padding` when only top is overridden), plus `tabBarStyle.paddingBottom` 8.
 */
const tabBarDockIconColumn = 2 + 22 + 2;
const tabBarDockLabelColumn = spacing.xs + 16 + spacing.xs;
/** 10 — `TabBarItem` default cell `paddingBottom` (see react-native-tab-view). */
const tabBarDockCellPaddingBottom = 10;

export const layout = {
  /** Horizontal inset for wide content (receive main column, headings, tab scenes). */
  screenPadding: spacing.xl,
  /** Bottom inset for stack scroll scenes (Journal, Reflect) — not tab scenes. */
  screenScrollBottomPadding: spacing.xxl,
  /** Space below a screen header block before primary content. */
  screenHeaderAfterMargin: spacing.md,
  /** Vertical gap between stacked primary blocks (e.g. cards). */
  screenColumnGap: spacing.md,
  /** Receive landing-only top breathe under the scene safe area. */
  receiveLandingPaddingTop: spacing.md,

  sectionGap: spacing.xxxl,
  tabBarDockPaddingTop: spacing.sm,
  tabBarDockPaddingBottom: spacing.sm,
  tabBarDockItemPaddingBottom: tabBarDockCellPaddingBottom,
  tabBarDockBorderTop: 1,
  tabBarDockBodyHeight:
    spacing.sm +
    tabBarDockIconColumn +
    tabBarDockLabelColumn +
    tabBarDockCellPaddingBottom +
    spacing.sm,
} as const;
