import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="recuperar-senha" />
      <Stack.Screen name="confirmacao-email" />
      <Stack.Screen name="adicionar-dispositivo" />
    </Stack>
  );
}
