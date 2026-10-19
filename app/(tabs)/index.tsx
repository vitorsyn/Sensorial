import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import mqtt from "mqtt";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAlertas } from "../../hooks/use-alertas";
import { useNotificacoes } from "../../hooks/use-notificacoes";
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
  const [dispositivoAtivo, setDispositivoAtivo] = useState<Dispositivo | null>(null);
  const [carregandoDispositivos, setCarregandoDispositivos] = useState(true);
  const [sensorId, setSensorId] = useState<number | null>(null);

  // Cooldown para não disparar a mesma notificação várias vezes seguidas
  const ultimoAlertaTemp = useRef<number>(0);
  const ultimoAlertaUmid = useRef<number>(0);
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

  const { enviarAlerta } = useNotificacoes();
  const { alertaTempRef, alertaUmidRef, recarregar } = useAlertas(sensorId);

  useEffect(() => {
    buscarDispositivos();
  }, []);

  async function buscarDispositivos() {
    setCarregandoDispositivos(true);
    const { data } = await supabase
      .from("dispositivos")
      .select("id, nome, token_mqtt")
      .eq("ativo", true)
      .order("criado_em", { ascending: true });

    if (data && data.length > 0) {
      setDispositivos(data);
      setDispositivoAtivo(data[0]);
    }
    setCarregandoDispositivos(false);
  }

  // Busca o sensor quando o dispositivo ativo muda
  useEffect(() => {
    if (!dispositivoAtivo) return;
    buscarSensor(dispositivoAtivo.id);
  }, [dispositivoAtivo]);

  async function buscarSensor(dispositivoId: number) {
    const { data } = await supabase
      .from("sensores")
      .select("id")
      .eq("dispositivo_id", dispositivoId)
      .eq("ativo", true)
      .limit(1)
      .single();

    if (data) {
      setSensorId(data.id);
      recarregar(data.id);
    }
  }

  // Conecta ao MQTT quando o dispositivo ativo muda
  useEffect(() => {
    if (!dispositivoAtivo) return;

    const BROKER_URL =
      "wss://c2acc9f739334988b6f79ef00c22f2bf.s1.eu.hivemq.cloud:8884/mqtt";
    const MQTT_USER = "sensorial";
    const MQTT_PASS = "K1k2k3k4";
    const TOPIC = `sensorial/${dispositivoAtivo.token_mqtt}/dados`;

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
      const temp: number = dados.temperatura;
      const umid: number = dados.umidade;

      setTemperatura(temp);
      setUmidade(umid);

      // --- Checagem de alertas ---
      const agora = Date.now();

      const aTemp = alertaTempRef.current;
      if (aTemp?.ativo && temp > aTemp.valor_limite) {
        if (agora - ultimoAlertaTemp.current > COOLDOWN_MS) {
          ultimoAlertaTemp.current = agora;
          await enviarAlerta(
            "🌡️ Temperatura Alta",
            `${dispositivoAtivo.nome}: ${temp}°C — limite de ${aTemp.valor_limite}°C ultrapassado`,
          );
        }
      }

      const aUmid = alertaUmidRef.current;
      if (aUmid?.ativo && umid > aUmid.valor_limite) {
        if (agora - ultimoAlertaUmid.current > COOLDOWN_MS) {
          ultimoAlertaUmid.current = agora;
          await enviarAlerta(
            "💧 Umidade Alta",
            `${dispositivoAtivo.nome}: ${umid}% — limite de ${aUmid.valor_limite}% ultrapassado`,
          );
        }
      }
      // --- Fim checagem ---

      // Salva leitura no Supabase
      if (sensorId) {
        try {
          const { error } = await supabase.from("leituras").insert([
            { sensor_id: sensorId, temperatura: temp, umidade: umid },
          ]);
          if (error) console.error("Erro ao salvar:", error.message);
        } catch (err) {
          console.error("Erro:", err);
        }
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
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    alertaTempRef.current?.ativo &&
                    temperatura > (alertaTempRef.current?.valor_limite ?? Infinity)
                      ? "#7f1d1d"
                      : "#7c3aed",
                },
              ]}
            >
              <Text style={styles.cardIcone}>🌡️</Text>
              <Text style={styles.cardValor}>{temperatura}°</Text>
              <Text style={styles.cardLabel}>Temperatura</Text>
              {alertaTempRef.current?.ativo && (
                <Text style={styles.cardLimite}>
                  limite {alertaTempRef.current.valor_limite}°C
                </Text>
              )}
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    alertaUmidRef.current?.ativo &&
                    umidade > (alertaUmidRef.current?.valor_limite ?? Infinity)
                      ? "#0c1a2e"
                      : "#0369a1",
                },
              ]}
            >
              <Text style={styles.cardIcone}>💧</Text>
              <Text style={styles.cardValor}>{umidade}%</Text>
              <Text style={styles.cardLabel}>Umidade</Text>
              {alertaUmidRef.current?.ativo && (
                <Text style={styles.cardLimite}>
                  limite {alertaUmidRef.current.valor_limite}%
                </Text>
              )}
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
    height: 190,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
  cardLimite: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
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
