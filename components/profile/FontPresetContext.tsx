import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import {
  FONT_SIZE_PRESET_LABELS,
  getActiveFontSizePreset,
  nextFontSizePreset,
  setActiveFontSizePreset,
  type FontSizePreset,
} from "../../constants/fontSizes";
import {
  FONT_PRESET_LABELS,
  getActiveFontPreset,
  nextFontPreset,
  setActiveFontPreset,
  type FontPreset,
} from "../../constants/fonts";
import {
  getFontPresetPreference,
  getFontSizePresetPreference,
  setFontPresetPreference,
  setFontSizePresetPreference,
} from "../../lib/fontPreferences";

type FontPresetContextValue = {
  preset: FontPreset;
  fontLabel: string;
  sizePreset: FontSizePreset;
  sizeLabel: string;
  cycleFontPreset: () => void;
  cycleFontSize: () => void;
  /** @deprecated Use `cycleFontPreset` */
  cyclePreset: () => void;
  /** @deprecated Use `fontLabel` */
  label: string;
};

const FontPresetContext = createContext<FontPresetContextValue | null>(null);

export function FontPresetProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<FontPreset>(() => getActiveFontPreset());
  const [sizePreset, setSizePreset] = useState<FontSizePreset>(() => getActiveFontSizePreset());

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getFontPresetPreference(), getFontSizePresetPreference()]).then(
      ([storedFont, storedSize]) => {
        if (cancelled) return;
        setActiveFontPreset(storedFont);
        setPreset(storedFont);
        setActiveFontSizePreset(storedSize);
        setSizePreset(storedSize);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const cycleFontPreset = useCallback(() => {
    setPreset((current) => {
      const next = nextFontPreset(current);
      setActiveFontPreset(next);
      void setFontPresetPreference(next);
      return next;
    });
  }, []);

  const cycleFontSize = useCallback(() => {
    setSizePreset((current) => {
      const next = nextFontSizePreset(current);
      setActiveFontSizePreset(next);
      void setFontSizePresetPreference(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      preset,
      fontLabel: FONT_PRESET_LABELS[preset],
      sizePreset,
      sizeLabel: FONT_SIZE_PRESET_LABELS[sizePreset],
      cycleFontPreset,
      cycleFontSize,
      cyclePreset: cycleFontPreset,
      label: FONT_PRESET_LABELS[preset],
    }),
    [preset, sizePreset, cycleFontPreset, cycleFontSize],
  );

  return (
    <FontPresetContext.Provider value={value}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </FontPresetContext.Provider>
  );
}

export function useFontPreset(): FontPresetContextValue {
  const context = useContext(FontPresetContext);
  if (!context) {
    throw new Error("useFontPreset must be used inside FontPresetProvider");
  }
  return context;
}

/** Call at screen roots that render `textStyles` so they re-render (not remount) on cycle. */
export function useFontPresetSubscription(): void {
  useFontPreset();
}
