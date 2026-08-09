import { Ionicons } from "@expo/vector-icons";
import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, spacing } from "../../constants";

const MaterialTabs = createMaterialTopTabNavigator();
const Tabs = withLayoutContext(MaterialTabs.Navigator, undefined, true);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const screenOptions = useMemo(
    () => ({
      swipeEnabled: true,
      animationEnabled: true,
      tabBarShowIcon: true,
      tabBarIndicatorStyle: { height: 0 },
      tabBarActiveTintColor: colors.background,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.tabHeader,
        borderTopColor: colors.borderSubtle,
        borderTopWidth: layout.tabBarDockBorderTop,
        // Item cells already pad below labels; only the dock’s own pad here (not insets.bottom).
        paddingBottom: layout.tabBarDockPaddingBottom,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        textTransform: "none" as const,
        marginTop: spacing.xs,
      },
      tabBarItemStyle: {
        paddingTop: layout.tabBarDockPaddingTop,
      },
      sceneStyle: {
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: 0,
      },
    }),
    [insets.top],
  );

  return (
    <Tabs
      tabBarPosition="bottom"
      screenOptions={screenOptions}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="sunny-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="globe-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}