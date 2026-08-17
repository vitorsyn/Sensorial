import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const [alertaTemp, setAlertaTemp] = useState(false);
  const [alertaUmid, setAlertaUmid] = useState(false);
  const [intervalo, setIntervalo] = useState<5 | 10 | 30>(5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>Configurações</Text>
      <Text style={styles.subtitulo}>Personalize o comportamento do app</Text>

      {/* Seção: Alertas */}
      <Text style={styles.secaoTitulo}>ALERTAS</Text>
      <View style={styles.secao}>
        <View style={styles.linha}>
          <View>
            <Text style={styles.linhaTexto}>Alerta de temperatura</Text>
            <Text style={styles.linhaSubTexto}>
              Notificar quando passar de 30°C
            </Text>
          </View>
          <Switch
            value={alertaTemp}
            onValueChange={setAlertaTemp}
            trackColor={{ false: "#2d2d3e", true: "#7c3aed" }}
            thumbColor={alertaTemp ? "#a78bfa" : "#475569"}
          />
        </View>

        <View style={styles.separador} />

        <View style={styles.linha}>
          <View>
            <Text style={styles.linhaTexto}>Alerta de umidade</Text>
            <Text style={styles.linhaSubTexto}>
              Notificar quando passar de 80%
            </Text>
          </View>
          <Switch
            value={alertaUmid}
            onValueChange={setAlertaUmid}
            trackColor={{ false: "#2d2d3e", true: "#0369a1" }}
            thumbColor={alertaUmid ? "#2dd4bf" : "#475569"}
          />
        </View>
      </View>

      {/* Seção: Intervalo de leitura */}
      <Text style={styles.secaoTitulo}>INTERVALO DE LEITURA</Text>
      <View style={styles.secao}>
        <Text style={styles.linhaSubTexto}>
          Com que frequência o sensor envia dados
        </Text>
        <View style={styles.intervaloRow}>
          {([5, 10, 30] as const).map((seg) => (
            <TouchableOpacity
              key={seg}
              style={[
                styles.intervaloBotao,
                intervalo === seg && styles.intervaloBotaoAtivo,
              ]}
              onPress={() => setIntervalo(seg)}
            >
              <Text
                style={[
                  styles.intervaloTexto,
                  intervalo === seg && styles.intervaloTextoAtivo,
                ]}
              >
                {seg}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Seção: Sobre */}
      <Text style={styles.secaoTitulo}>SOBRE</Text>
      <View style={styles.secao}>
        <View style={styles.linha}>
          <Text style={styles.linhaTexto}>Versão</Text>
          <Text style={styles.linhaSubTexto}>1.0.0</Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.linha}>
          <Text style={styles.linhaTexto}>Dispositivo</Text>
          <Text style={styles.linhaSubTexto}>sensorial-esp32</Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.linha}>
          <Text style={styles.linhaTexto}>Broker</Text>
          <Text style={styles.linhaSubTexto}>HiveMQ Cloud</Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.linha}>
          <Text style={styles.linhaTexto}>Tópico MQTT</Text>
          <Text style={styles.linhaSubTexto}>sensorial/dados</Text>
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
  secaoTitulo: {
    fontSize: 11,
    color: "#475569",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 8,
  },
  secao: {
    backgroundColor: "#1e1e2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  linhaTexto: {
    color: "#ffffff",
    fontSize: 15,
  },
  linhaSubTexto: {
    color: "#475569",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  separador: {
    height: 1,
    backgroundColor: "#2d2d3e",
    marginVertical: 10,
  },
  intervaloRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  intervaloBotao: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2d2d3e",
    alignItems: "center",
  },
  intervaloBotaoAtivo: {
    backgroundColor: "#7c3aed",
  },
  intervaloTexto: {
    color: "#94a3b8",
    fontWeight: "500",
  },
  intervaloTextoAtivo: {
    color: "#ffffff",
  },
});
