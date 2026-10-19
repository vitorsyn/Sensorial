import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Configura como as notificações aparecem enquanto o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotificacoes() {
  const permissaoSolicitada = useRef(false);

  useEffect(() => {
    solicitarPermissao();
  }, []);

  async function solicitarPermissao() {
    if (permissaoSolicitada.current) return;
    permissaoSolicitada.current = true;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("alertas-sensorial", {
        name: "Alertas Sensorial",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#a78bfa",
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }

  async function enviarAlerta(titulo: string, corpo: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
        ...(Platform.OS === "android" && {
          channelId: "alertas-sensorial",
        }),
      },
      trigger: null, // dispara imediatamente
    });
  }

  return { enviarAlerta };
}
