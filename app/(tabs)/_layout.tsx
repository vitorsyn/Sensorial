import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#0f0f1a",
          borderTopColor: "#1e1e2e",
        },
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#475569",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Monitor",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="thermometer" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="clock.arrow.circlepath" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Configurações",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
