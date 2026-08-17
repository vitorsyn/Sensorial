import { StatusBar } from "expo-status-bar";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import mqtt from "mqtt";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { db } from "../../firebaseConfig";

// ─── Configurações HiveMQ ───────────────────────────────────
const BROKER_URL = "c2acc9f739334988b6f79ef00c22f2bf.s1.eu.hivemq.cloud";
const MQTT_USER = "sensorial";
const MQTT_PASS = "K1k2k3k4";
const MQTT_TOPIC = "sensorial/dados";

// ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [temperatura, setTemperatura] = useState<number | null>(null);
  const [umidade, setUmidade] = useState<number | null>(null);
  const [conectado, setConectado] = useState<boolean>(false);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL, {
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: "sensorial-app-" + Math.random().toString(16).slice(2),
    });

    client.on("connect", () => {
      setConectado(true);
      client.subscribe(MQTT_TOPIC);
    });

    client.on("message", async (_topic: string, message: Buffer) => {
      const dados = JSON.parse(message.toString());
      setTemperatura(dados.temperatura);
      setUmidade(dados.umidade);

      // Salva a leitura no Firestore
      try {
        await addDoc(collection(db, "leituras"), {
          temperatura: dados.temperatura,
          umidade: dados.umidade,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Erro ao salvar no Firestore:", error);
      }
    });

    client.on("error", (err: Error) => {
      console.error("Erro MQTT:", err);
      setConectado(false);
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.titulo}>Sensorial</Text>

      {/* Indicador de conexão */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: conectado ? "#4ade80" : "#f87171" },
          ]}
        />
        <Text style={styles.statusTexto}>
          {conectado ? "Broker conectado" : "Conectando..."}
        </Text>
      </View>

      {/* Cards de leitura */}
      {temperatura === null ? (
        <View style={styles.aguardando}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.aguardandoTexto}>
            Aguardando dados do sensor...
          </Text>
        </View>
      ) : (
        <View style={styles.cardsRow}>
          <View style={[styles.card, { backgroundColor: "#7c3aed" }]}>
            <Text style={styles.cardIcone}>🌡️</Text>
            <Text style={styles.cardValor}>{temperatura}°</Text>
            <Text style={styles.cardLabel}>Temperatura</Text>
          </View>

          <View style={[styles.card, { backgroundColor: "#0369a1" }]}>
            <Text style={styles.cardIcone}>💧</Text>
            <Text style={styles.cardValor}>{umidade}%</Text>
            <Text style={styles.cardLabel}>Umidade</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  titulo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 48,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTexto: {
    color: "#94a3b8",
    fontSize: 14,
  },
  aguardando: {
    alignItems: "center",
    gap: 16,
  },
  aguardandoTexto: {
    color: "#94a3b8",
    fontSize: 16,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
  },
  card: {
    width: 150,
    height: 180,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 8,
  },
  cardIcone: {
    fontSize: 40,
  },
  cardValor: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#ffffff",
  },
  cardLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
