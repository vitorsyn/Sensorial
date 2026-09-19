import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "../../supabaseConfig";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Leitura = {
  id: number;
  temperatura: number;
  umidade: number;
  criado_em: string;
};

type Sensor = {
  id: number;
  tipo: string;
  dispositivo_id: number;
};

type Dispositivo = {
  id: number;
  nome: string;
};

type Periodo = "24h" | "7d" | "30d";

export default function HistoricoScreen() {
  const [periodo, setPeriodo] = useState<Periodo>("24h");
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [dispAtivo, setDispAtivo] = useState<Dispositivo | null>(null);
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Busca dispositivos do usuário ao abrir
  useEffect(() => {
    buscarDispositivos();
  }, []);

  // Busca sensor e leituras quando muda dispositivo ou período
  useEffect(() => {
    if (dispAtivo) buscarSensorELeituras();
  }, [dispAtivo, periodo]);

  async function buscarDispositivos() {
    const { data } = await supabase
      .from("dispositivos")
      .select("id, nome")
      .eq("ativo", true)
      .order("criado_em", { ascending: true });

    if (data && data.length > 0) {
      setDispositivos(data);
      setDispAtivo(data[0]);
    } else {
      setCarregando(false);
    }
  }

  async function buscarSensorELeituras() {
    setCarregando(true);

    // Busca o sensor ativo do dispositivo
    const { data: sensorData } = await supabase
      .from("sensores")
      .select("id, tipo, dispositivo_id")
      .eq("dispositivo_id", dispAtivo!.id)
      .eq("ativo", true)
      .limit(1)
      .single();

    if (!sensorData) {
      setCarregando(false);
      return;
    }
    setSensor(sensorData);

    // Calcula data de início pelo período
    const agora = new Date();
    const inicio = new Date(agora);
    if (periodo === "24h") inicio.setHours(agora.getHours() - 24);
    else if (periodo === "7d") inicio.setDate(agora.getDate() - 7);
    else inicio.setDate(agora.getDate() - 30);

    // Busca leituras do sensor no período
    const { data: leiturasData } = await supabase
      .from("leituras")
      .select("id, temperatura, umidade, criado_em")
      .eq("sensor_id", sensorData.id)
      .gte("criado_em", inicio.toISOString())
      .order("criado_em", { ascending: true })
      .limit(60);

    setLeituras(leiturasData || []);
    setCarregando(false);
  }

  // Monta labels para o gráfico
  const labels = leituras.map((l) => {
    const d = new Date(l.criado_em);
    if (periodo === "24h")
      return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const step = Math.max(1, Math.floor(leituras.length / 6));
  const labelsAmostrados = labels.filter(
    (_, i) => i % step === 0 || i === labels.length - 1,
  );

  const temperaturas = leituras.map((l) => l.temperatura);
  const umidades = leituras.map((l) => l.umidade);

  const tempMedia = leituras.length
    ? (temperaturas.reduce((a, b) => a + b, 0) / leituras.length).toFixed(1)
    : "--";
  const umidMedia = leituras.length
    ? (umidades.reduce((a, b) => a + b, 0) / leituras.length).toFixed(1)
    : "--";
  const tempMaxima = leituras.length
    ? Math.max(...temperaturas).toFixed(1)
    : "--";
  const umidMaxima = leituras.length ? Math.max(...umidades).toFixed(1) : "--";
  const tempMinima = leituras.length
    ? Math.min(...temperaturas).toFixed(1)
    : "--";
  const umidMinima = leituras.length ? Math.min(...umidades).toFixed(1) : "--";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>Histórico de Dados</Text>
      <Text style={styles.subtitulo}>
        Comportamento dos sensores ao longo do tempo
      </Text>

      {/* Seletor de dispositivo */}
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
                dispAtivo?.id === d.id && styles.seletorBotaoAtivo,
              ]}
              onPress={() => setDispAtivo(d)}
            >
              <Text
                style={[
                  styles.seletorTexto,
                  dispAtivo?.id === d.id && styles.seletorTextoAtivo,
                ]}
              >
                {d.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filtros de período */}
      <View style={styles.filtros}>
        {(["24h", "7d", "30d"] as Periodo[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.filtroBotao,
              periodo === p && styles.filtroBotaoAtivo,
            ]}
            onPress={() => setPeriodo(p)}
          >
            <Text
              style={[
                styles.filtroTexto,
                periodo === p && styles.filtroTextoAtivo,
              ]}
            >
              {p === "24h"
                ? "Últimas 24h"
                : p === "7d"
                  ? "Últimos 7 dias"
                  : "Últimos 30 dias"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gráfico */}
      <View style={styles.graficoContainer}>
        <Text style={styles.graficoTitulo}>
          Temperatura e Umidade {sensor ? `— ${sensor.tipo}` : ""}
        </Text>

        {carregando ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#a78bfa" />
            <Text style={styles.loadingTexto}>Buscando dados...</Text>
          </View>
        ) : leituras.length === 0 ? (
          <View style={styles.loading}>
            <Text style={styles.loadingTexto}>
              Nenhuma leitura neste período
            </Text>
          </View>
        ) : (
          <LineChart
            data={{
              labels: labelsAmostrados,
              datasets: [
                { data: temperaturas, color: () => "#a78bfa", strokeWidth: 2 },
                { data: umidades, color: () => "#2dd4bf", strokeWidth: 2 },
              ],
              legend: ["Temperatura (°C)", "Umidade (%)"],
            }}
            width={SCREEN_WIDTH - 48}
            height={220}
            chartConfig={{
              backgroundColor: "#1e1e2e",
              backgroundGradientFrom: "#1e1e2e",
              backgroundGradientTo: "#1e1e2e",
              decimalPlaces: 1,
              color: () => "#475569",
              labelColor: () => "#94a3b8",
              propsForDots: { r: "3" },
              propsForBackgroundLines: { stroke: "#2d2d3e" },
            }}
            bezier
            style={styles.grafico}
            withInnerLines={true}
            withOuterLines={false}
          />
        )}
      </View>

      {/* Cards de estatísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Temp. Média</Text>
          <Text style={styles.statValor}>
            {tempMedia}
            {tempMedia !== "--" ? "°C" : ""}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umidade Média</Text>
          <Text style={styles.statValor}>
            {umidMedia}
            {umidMedia !== "--" ? "%" : ""}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Temp. Máxima</Text>
          <Text style={[styles.statValor, { color: "#f87171" }]}>
            {tempMaxima}
            {tempMaxima !== "--" ? "°C" : ""}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Temp. Mínima</Text>
          <Text style={[styles.statValor, { color: "#60a5fa" }]}>
            {tempMinima}
            {tempMinima !== "--" ? "°C" : ""}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umidade Máx.</Text>
          <Text style={[styles.statValor, { color: "#2dd4bf" }]}>
            {umidMaxima}
            {umidMaxima !== "--" ? "%" : ""}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umidade Mín.</Text>
          <Text style={[styles.statValor, { color: "#a78bfa" }]}>
            {umidMinima}
            {umidMinima !== "--" ? "%" : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.totalLeituras}>
        {leituras.length} leitura{leituras.length !== 1 ? "s" : ""} no período
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  subtitulo: { fontSize: 14, color: "#94a3b8", marginBottom: 24 },
  seletorScroll: { alignSelf: "stretch", marginBottom: 16 },
  seletorBotao: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e1e2e",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2d2d3e",
  },
  seletorBotaoAtivo: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  seletorTexto: { color: "#94a3b8", fontSize: 13 },
  seletorTextoAtivo: { color: "#fff", fontWeight: "bold" },
  filtros: { flexDirection: "row", gap: 8, marginBottom: 24 },
  filtroBotao: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e1e2e",
  },
  filtroBotaoAtivo: { backgroundColor: "#2dd4bf" },
  filtroTexto: { color: "#94a3b8", fontSize: 13 },
  filtroTextoAtivo: { color: "#0f0f1a", fontWeight: "bold" },
  graficoContainer: {
    backgroundColor: "#1e1e2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  graficoTitulo: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
  },
  grafico: { borderRadius: 8, marginLeft: -16 },
  loading: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingTexto: { color: "#94a3b8", fontSize: 14 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#1e1e2e",
    borderRadius: 12,
    padding: 16,
    width: (SCREEN_WIDTH - 60) / 2,
  },
  statLabel: { color: "#94a3b8", fontSize: 13, marginBottom: 8 },
  statValor: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  totalLeituras: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
