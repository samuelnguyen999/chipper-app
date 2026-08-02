import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_FONT_PRESET,
  FONT_PRESET_ORDER,
  type FontPreset,
} from "../constants/fonts";
import {
  DEFAULT_FONT_SIZE_PRESET,
  FONT_SIZE_PRESET_ORDER,
  type FontSizePreset,
} from "../constants/fontSizes";

const FONT_PRESET_KEY = "chipper.fontPresetPreference";
const FONT_SIZE_KEY = "chipper.fontSizePresetPreference";

function isFontPreset(value: string): value is FontPreset {
  return (FONT_PRESET_ORDER as readonly string[]).includes(value);
}

function isFontSizePreset(value: string): value is FontSizePreset {
  return (FONT_SIZE_PRESET_ORDER as readonly string[]).includes(value);
}

/** Map removed / renamed stored keys onto current presets. */
function migrateFontSizePreset(value: string): FontSizePreset | null {
  if (isFontSizePreset(value)) return value;
  if (value === "compact") return "small";
  if (value === "extraLarge") return "large";
  return null;
}

/** Last font face preset chosen on this device. Defaults to app default. */
export async function getFontPresetPreference(): Promise<FontPreset> {
  try {
    const stored = await AsyncStorage.getItem(FONT_PRESET_KEY);
    if (stored && isFontPreset(stored)) {
      return stored;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_FONT_PRESET;
}

/** Persist the latest font face preset for this device. */
export async function setFontPresetPreference(value: FontPreset): Promise<void> {
  await AsyncStorage.setItem(FONT_PRESET_KEY, value);
}

/** Last text size preset chosen on this device. Defaults to app default. */
export async function getFontSizePresetPreference(): Promise<FontSizePreset> {
  try {
    const stored = await AsyncStorage.getItem(FONT_SIZE_KEY);
    if (stored) {
      const migrated = migrateFontSizePreset(stored);
      if (migrated) {
        if (migrated !== stored) {
          void AsyncStorage.setItem(FONT_SIZE_KEY, migrated);
        }
        return migrated;
      }
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_FONT_SIZE_PRESET;
}

/** Persist the latest text size preset for this device. */
export async function setFontSizePresetPreference(value: FontSizePreset): Promise<void> {
  await AsyncStorage.setItem(FONT_SIZE_KEY, value);
}
