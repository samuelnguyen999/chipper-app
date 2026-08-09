import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, spacing } from "../../constants";

type ScrollRailProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Fires when the user begins dragging the scroll view. */
  onScrollBeginDrag?: () => void;
};

type ScrollRailContextValue = {
  /**
   * Scroll so a window-space rect stays fully inside the rail viewport.
   * Used when a bottom card expands actions that would otherwise clip.
   */
  ensureWindowRectVisible: (windowY: number, height: number) => void;
  /** Clear temporary bottom spacer used while revealing expanded actions. */
  releaseBottomReserve: () => void;
};

const ScrollRailContext = createContext<ScrollRailContextValue | null>(null);

/** Null when not under a ScrollRail (e.g. journal preview). */
export function useScrollRail(): ScrollRailContextValue | null {
  return useContext(ScrollRailContext);
}

const RAIL_WIDTH = 3;
const THUMB_MIN = 28;
/** Hold visible briefly after scroll ends, then fade — iOS-like. */
const HIDE_DELAY_MS = 700;
const FADE_IN_MS = 120;
const FADE_OUT_MS = 700;
const FADE_EASING = Easing.out(Easing.quad);

/**
 * ScrollView with a side rail that appears while scrolling and fades out when idle.
 * Cards can ask the rail to scroll when expanded actions would clip at the bottom.
 */
export default function ScrollRail({
  children,
  style,
  contentContainerStyle,
  onScrollBeginDrag,
}: ScrollRailProps) {
  const rootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const offsetYRef = useRef(0);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [bottomReserve, setBottomReserve] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railOpacity = useSharedValue(0);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showRailIndicator = useCallback(() => {
    clearHideTimer();
    railOpacity.value = withTiming(1, { duration: FADE_IN_MS, easing: FADE_EASING });
  }, [clearHideTimer, railOpacity]);

  const scheduleHideRail = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      railOpacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: FADE_EASING });
    }, HIDE_DELAY_MS);
  }, [clearHideTimer, railOpacity]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      offsetYRef.current = y;
      setOffsetY(y);
      showRailIndicator();
    },
    [showRailIndicator],
  );

  const onScrollBegin = useCallback(() => {
    showRailIndicator();
    onScrollBeginDrag?.();
  }, [showRailIndicator, onScrollBeginDrag]);

  const onScrollEnd = useCallback(() => {
    scheduleHideRail();
  }, [scheduleHideRail]);

  const scrollBy = useCallback((dy: number) => {
    if (dy <= 0) return;
    const nextY = offsetYRef.current + dy;
    offsetYRef.current = nextY;
    scrollRef.current?.scrollTo({ y: nextY, animated: true });
  }, []);

  const ensureWindowRectVisible = useCallback(
    (windowY: number, height: number) => {
      rootRef.current?.measureInWindow((_x, rootY, _w, rootH) => {
        if (rootH < 1 || height < 1) return;
        const overflow = windowY + height - (rootY + rootH);
        if (overflow <= 1) return;
        const pad = Math.ceil(overflow + 6);
        // Guarantee scroll room even if card height has not hit content size yet.
        setBottomReserve((prev) => Math.max(prev, pad));
        // Wait for spacer layout before scrolling (else clamp at old max offset).
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollBy(pad));
        });
      });
    },
    [scrollBy],
  );

  const releaseBottomReserve = useCallback(() => {
    setBottomReserve(0);
  }, []);

  const ctx = useMemo(
    () => ({
      ensureWindowRectVisible,
      releaseBottomReserve,
    }),
    [ensureWindowRectVisible, releaseBottomReserve],
  );

  const overflow = contentH - viewportH;
  const canScroll = overflow > 2 && viewportH > 0;
  const railInnerH = Math.max(0, viewportH - spacing.sm * 2);
  const thumbH = canScroll
    ? Math.max(THUMB_MIN, (viewportH / contentH) * railInnerH)
    : 0;
  const travel = Math.max(0, railInnerH - thumbH);
  const thumbTop = overflow > 0 ? (offsetY / overflow) * travel : 0;

  const railFadeStyle = useAnimatedStyle(() => ({
    opacity: railOpacity.value,
  }));

  return (
    <ScrollRailContext.Provider value={ctx}>
      <View
        ref={rootRef}
        style={[styles.root, style]}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBegin}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollBegin={onScrollBegin}
          onMomentumScrollEnd={onScrollEnd}
          onContentSizeChange={(_w, h) => setContentH(h)}
        >
          {children}
          {bottomReserve > 0 ? <View style={{ height: bottomReserve }} /> : null}
        </ScrollView>
        {canScroll ? (
          <Animated.View style={[styles.rail, railFadeStyle]} pointerEvents="none">
            <View style={[styles.thumb, { height: thumbH, transform: [{ translateY: thumbTop }] }]} />
          </Animated.View>
        ) : null}
      </View>
    </ScrollRailContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    flex: 1,
  },
  rail: {
    position: "absolute",
    top: spacing.sm,
    bottom: spacing.sm,
    right: 2,
    width: RAIL_WIDTH,
    borderRadius: RAIL_WIDTH / 2,
    backgroundColor: "rgba(105, 53, 15, 0.18)",
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    borderRadius: RAIL_WIDTH / 2,
    backgroundColor: colors.tabHeader,
  },
});
