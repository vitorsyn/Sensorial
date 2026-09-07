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

type Periodo = "24h" | "7d" | "30d";

export default function HistoricoScreen() {
  const [periodo, setPeriodo] = useState<Periodo>("24h");
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarLeituras();
  }, [periodo]);

  async function buscarLeituras() {
    setCarregando(true);
    try {
      // Calcular data de início com base no período
      const agora = new Date();
      const inicio = new Date(agora);
      if (periodo === "24h") inicio.setHours(agora.getHours() - 24);
      else if (periodo === "7d") inicio.setDate(agora.getDate() - 7);
      else inicio.setDate(agora.getDate() - 30);

      const { data, error } = await supabase
        .from("leituras")
        .select("*")
        .gte("criado_em", inicio.toISOString())
        .order("criado_em", { ascending: true })
        .limit(50); // Máximo 50 pontos para o gráfico

      if (error) {
        console.error("Erro ao buscar leituras:", error.message);
      } else {
        setLeituras(data || []);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setCarregando(false);
    }
  }

  // Montar labels e datasets para o gráfico
  const labels = leituras.map((l) => {
    const d = new Date(l.criado_em);
    if (periodo === "24h")
      return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  // Amostrar para no máximo 6 labels no eixo X
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>Histórico de Dados</Text>
      <Text style={styles.subtitulo}>
        Visualize o comportamento dos sensores ao longo do tempo
      </Text>

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
        <Text style={styles.graficoTitulo}>Temperatura e Umidade</Text>

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
          <Text style={styles.statLabel}>Temperatura Média</Text>
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
          <Text style={[styles.statValor, { color: "#a78bfa" }]}>
            {tempMaxima}
            {tempMaxima !== "--" ? "°C" : ""}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umidade Máxima</Text>
          <Text style={[styles.statValor, { color: "#2dd4bf" }]}>
            {umidMaxima}
            {umidMaxima !== "--" ? "%" : ""}
          </Text>
        </View>
      </View>

      {/* Total de leituras */}
      <Text style={styles.totalLeituras}>
        {leituras.length} leitura{leituras.length !== 1 ? "s" : ""} no período
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
  },
  filtros: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  filtroBotao: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e1e2e",
  },
  filtroBotaoAtivo: {
    backgroundColor: "#2dd4bf",
  },
  filtroTexto: {
    color: "#94a3b8",
    fontSize: 13,
  },
  filtroTextoAtivo: {
    color: "#0f0f1a",
    fontWeight: "bold",
  },
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
  grafico: {
    borderRadius: 8,
    marginLeft: -16,
  },
  loading: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingTexto: {
    color: "#94a3b8",
    fontSize: 14,
  },
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
  statLabel: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 8,
  },
  statValor: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
  },
  totalLeituras: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
