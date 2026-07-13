import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FontPresetProvider } from "../components/profile/FontPresetContext";
import { getAllFontLoadMap } from "../constants/fonts";
import { useAnonymousAuth } from "../hooks/useAnonymousAuth";
import { TabAccessProvider } from "../state/TabAccessContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loading: authLoading } = useAnonymousAuth();
  const [loaded, error] = useFonts(getAllFontLoadMap());
  const fontsReady = loaded || error;

  useEffect(() => {
    if (fontsReady && !authLoading) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, authLoading]);

  if (authLoading || !fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TabAccessProvider>
        <FontPresetProvider>
          <StatusBar style="light" />
          <Stack>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(locked)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="+not-found"
              options={{
                headerTitle: "Not Found",
              }}
            />
          </Stack>
        </FontPresetProvider>
      </TabAccessProvider>
    </GestureHandlerRootView>
  );
}
