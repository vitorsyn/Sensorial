import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import mqtt from "mqtt";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../supabaseConfig";

type Dispositivo = {
  id: number;
  nome: string;
  token_mqtt: string;
};

export default function HomeScreen() {
  const [temperatura, setTemperatura] = useState<number | null>(null);
  const [umidade, setUmidade] = useState<number | null>(null);
  const [conectado, setConectado] = useState<boolean>(false);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [dispositivoAtivo, setDispositivoAtivo] = useState<Dispositivo | null>(
    null,
  );
  const [carregandoDispositivos, setCarregandoDispositivos] = useState(true);

  // Busca dispositivos do usuário logado
  useEffect(() => {
    buscarDispositivos();
  }, []);

  async function buscarDispositivos() {
    setCarregandoDispositivos(true);
    const { data, error } = await supabase
      .from("dispositivos")
      .select("id, nome, token_mqtt")
      .eq("ativo", true)
      .order("criado_em", { ascending: true });

    if (data && data.length > 0) {
      setDispositivos(data);
      setDispositivoAtivo(data[0]); // seleciona o primeiro por padrão
    }
    setCarregandoDispositivos(false);
  }

  // Conecta ao MQTT quando o dispositivo ativo muda
  useEffect(() => {
    if (!dispositivoAtivo) return;

    const BROKER_URL =
      "wss://c2acc9f739334988b6f79ef00c22f2bf.s1.eu.hivemq.cloud:8884/mqtt";
    const MQTT_USER = "sensorial";
    const MQTT_PASS = "K1k2k3k4";
    const TOPIC = `sensorial/${dispositivoAtivo.token_mqtt}/dados`;

    // Resetar leituras ao trocar de dispositivo
    setTemperatura(null);
    setUmidade(null);
    setConectado(false);

    const client = mqtt.connect(BROKER_URL, {
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: "sensorial-app-" + Math.random().toString(16).slice(2),
    });

    client.on("connect", () => {
      setConectado(true);
      client.subscribe(TOPIC);
    });

    client.on("message", async (_topic: string, message: Buffer) => {
      const dados = JSON.parse(message.toString());
      setTemperatura(dados.temperatura);
      setUmidade(dados.umidade);

      // Busca o sensor associado ao dispositivo ativo
      const { data: sensores } = await supabase
        .from("sensores")
        .select("id")
        .eq("dispositivo_id", dispositivoAtivo.id)
        .eq("ativo", true)
        .limit(1);

      const sensorId = sensores?.[0]?.id;
      if (!sensorId) return;

      // Salva leitura no Supabase
      try {
        const { error } = await supabase.from("leituras").insert([
          {
            sensor_id: sensorId,
            temperatura: dados.temperatura,
            umidade: dados.umidade,
          },
        ]);
        if (error) console.error("Erro ao salvar:", error.message);
      } catch (err) {
        console.error("Erro:", err);
      }
    });

    client.on("error", (err: Error) => {
      console.error("Erro MQTT:", err);
      setConectado(false);
    });

    return () => {
      client.end();
    };
  }, [dispositivoAtivo]);

  // Sem dispositivos cadastrados
  if (!carregandoDispositivos && dispositivos.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.titulo}>Sensorial</Text>
        <View style={styles.semDispositivo}>
          <Text style={styles.semDispositivoIcone}>📡</Text>
          <Text style={styles.semDispositivoTexto}>
            Nenhum dispositivo vinculado
          </Text>
          <Text style={styles.semDispositivoSub}>
            Adicione seu primeiro sensor para começar o monitoramento
          </Text>
          <TouchableOpacity
            style={styles.botaoAdicionar}
            onPress={() => router.push("/(auth)/adicionar-dispositivo")}
          >
            <Text style={styles.botaoAdicionarTexto}>
              + Adicionar dispositivo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Sensorial</Text>

        {/* Seletor de dispositivo (se tiver mais de um) */}
        {dispositivos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.seletorScroll}
          >
            {dispositivos.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.seletorBotao,
                  dispositivoAtivo?.id === d.id && styles.seletorBotaoAtivo,
                ]}
                onPress={() => setDispositivoAtivo(d)}
              >
                <Text
                  style={[
                    styles.seletorTexto,
                    dispositivoAtivo?.id === d.id && styles.seletorTextoAtivo,
                  ]}
                >
                  {d.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Indicador de conexão */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: conectado ? "#4ade80" : "#f87171" },
            ]}
          />
          <Text style={styles.statusTexto}>
            {conectado
              ? `${dispositivoAtivo?.nome} conectado`
              : "Conectando..."}
          </Text>
        </View>

        {/* Cards de leitura */}
        {carregandoDispositivos ? (
          <ActivityIndicator
            size="large"
            color="#a78bfa"
            style={{ marginTop: 60 }}
          />
        ) : temperatura === null ? (
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },
  titulo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: 2,
    alignSelf: "flex-start",
  },
  seletorScroll: {
    alignSelf: "stretch",
    marginBottom: 16,
  },
  seletorBotao: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e1e2e",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2d2d3e",
  },
  seletorBotaoAtivo: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  seletorTexto: {
    color: "#94a3b8",
    fontSize: 13,
  },
  seletorTextoAtivo: {
    color: "#fff",
    fontWeight: "bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 48,
    alignSelf: "flex-start",
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
  cardIcone: { fontSize: 40 },
  cardValor: { fontSize: 42, fontWeight: "bold", color: "#ffffff" },
  cardLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  semDispositivo: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  semDispositivoIcone: { fontSize: 56, marginBottom: 8 },
  semDispositivoTexto: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  semDispositivoSub: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  botaoAdicionar: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 16,
  },
  botaoAdicionarTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
