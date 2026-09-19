import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ label, color }: { label: string; color: string }) {
  const icons: Record<string, string> = {
    monitor: "🌡️",
    historico: "📊",
    configuracoes: "⚙️",
  };
  return <Text style={{ fontSize: 20, color }}>{icons[label]}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          tabBarIcon: ({ color }) => <TabIcon label="monitor" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color }) => (
            <TabIcon label="historico" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configurações",
          tabBarIcon: ({ color }) => (
            <TabIcon label="configuracoes" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
