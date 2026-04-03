import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const ACTIVE_COLOR = "#1D9BF0";
const INACTIVE_COLOR = "#71717a";

const tabs: {
  name: string;
  title: string;
  iconFocused: IoniconsName;
  iconDefault: IoniconsName;
}[] = [
  {
    name: "index",
    title: "Feed",
    iconFocused: "home",
    iconDefault: "home-outline",
  },
  {
    name: "jobs",
    title: "İşler",
    iconFocused: "briefcase",
    iconDefault: "briefcase-outline",
  },
  {
    name: "messages",
    title: "Mesajlar",
    iconFocused: "chatbubbles",
    iconDefault: "chatbubbles-outline",
  },
  {
    name: "profile",
    title: "Profil",
    iconFocused: "person",
    iconDefault: "person-outline",
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#27272a",
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.iconDefault}
                size={size}
                color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
