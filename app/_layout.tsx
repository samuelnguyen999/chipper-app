import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ReflectionResponsesProvider } from "../state/ReflectionResponsesContext";
import { TabAccessProvider } from "../state/TabAccessContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReflectionResponsesProvider>
        <TabAccessProvider>
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
        </TabAccessProvider>
      </ReflectionResponsesProvider>
    </GestureHandlerRootView>
  );
}
