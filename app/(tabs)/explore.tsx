import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Dados simulados ─────────────────────────────────────────
// Futuramente esses dados virão do histórico salvo
const dadosSimulados = {
  "24h": {
    labels: ["01:44", "05:44", "09:44", "13:44", "17:44", "21:44"],
    temperatura: [19, 21, 24, 26, 23, 20],
    umidade: [75, 80, 70, 68, 74, 78],
  },
  "7d": {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    temperatura: [20, 22, 25, 23, 21, 24, 22],
    umidade: [72, 75, 68, 70, 76, 73, 71],
  },
  "30d": {
    labels: ["S1", "S2", "S3", "S4"],
    temperatura: [21, 23, 22, 24],
    umidade: [73, 70, 75, 72],
  },
};

type Periodo = "24h" | "7d" | "30d";

export default function HistoricoScreen() {
  const [periodo, setPeriodo] = useState<Periodo>("24h");

  const dados = dadosSimulados[periodo];

  const tempMedia = (
    dados.temperatura.reduce((a, b) => a + b, 0) / dados.temperatura.length
  ).toFixed(1);
  const umidMedia = (
    dados.umidade.reduce((a, b) => a + b, 0) / dados.umidade.length
  ).toFixed(1);
  const tempMaxima = Math.max(...dados.temperatura).toFixed(1);
  const umidMaxima = Math.max(...dados.umidade).toFixed(1);

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
        <LineChart
          data={{
            labels: dados.labels,
            datasets: [
              {
                data: dados.temperatura,
                color: () => "#a78bfa",
                strokeWidth: 2,
              },
              { data: dados.umidade, color: () => "#2dd4bf", strokeWidth: 2 },
            ],
            legend: ["Temperatura (°C)", "Umidade (%)"],
          }}
          width={SCREEN_WIDTH - 48}
          height={220}
          chartConfig={{
            backgroundColor: "#1e1e2e",
            backgroundGradientFrom: "#1e1e2e",
            backgroundGradientTo: "#1e1e2e",
            decimalPlaces: 0,
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
      </View>

      {/* Cards de estatísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Temperatura Média</Text>
          <Text style={styles.statValor}>{tempMedia}°C</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umidade Média</Text>
          <Text style={styles.statValor}>{umidMedia}%</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Temp. Máxima</Text>
          <Text style={[styles.statValor, { color: "#a78bfa" }]}>
            {tempMaxima}°C
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umidade Máxima</Text>
          <Text style={[styles.statValor, { color: "#2dd4bf" }]}>
            {umidMaxima}%
          </Text>
        </View>
      </View>
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
});