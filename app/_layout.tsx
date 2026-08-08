import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FontPresetProvider } from "../components/profile/FontPresetContext";
import BreathUnlockHost from "../components/today/transitions/BreathUnlockHost";
import { getAllFontLoadMap } from "../constants/fonts";
import { useAnonymousAuth } from "../hooks/useAnonymousAuth";
import { useOfflineReflectionSync } from "../hooks/useOfflineReflectionSync";
import { TabAccessProvider } from "../state/TabAccessContext";

SplashScreen.preventAutoHideAsync();

function OfflineReflectionSync() {
  useOfflineReflectionSync();
  return null;
}

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
          <OfflineReflectionSync />
          <StatusBar style="light" />
          <View style={styles.shell}>
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
                name="journal"
                options={{
                  headerShown: true,
                  headerTitle: "Journal",
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{
                  headerTitle: "Not Found",
                }}
              />
            </Stack>
            <BreathUnlockHost />
          </View>
        </FontPresetProvider>
      </TabAccessProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
