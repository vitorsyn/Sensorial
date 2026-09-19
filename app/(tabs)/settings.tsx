import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../supabaseConfig";

type Dispositivo = {
  id: number;
  nome: string;
  localizacao: string;
  token_mqtt: string;
  ativo: boolean;
};

export default function SettingsScreen() {
  const [alertaTemp, setAlertaTemp] = useState(false);
  const [alertaUmid, setAlertaUmid] = useState(false);
  const [intervalo, setIntervalo] = useState<5 | 10 | 30>(5);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [usuario, setUsuario] = useState<{
    nome: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    buscarDados();
  }, []);

  async function buscarDados() {
    // Buscar perfil do usuário
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("usuarios")
        .select("nome, email")
        .eq("id", user.id)
        .single();
      if (data) setUsuario(data);
    }

    // Buscar dispositivos vinculados
    const { data: devs } = await supabase
      .from("dispositivos")
      .select("id, nome, localizacao, token_mqtt, ativo")
      .order("criado_em", { ascending: true });
    if (devs) setDispositivos(devs);
  }

  async function handleLogout() {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>Configurações</Text>
      <Text style={styles.subtitulo}>Personalize o comportamento do app</Text>

      {/* Perfil */}
      {usuario && (
        <>
          <Text style={styles.secaoTitulo}>PERFIL</Text>
          <View style={styles.secao}>
            <View style={styles.linha}>
              <Text style={styles.linhaTexto}>Nome</Text>
              <Text style={styles.linhaValor}>{usuario.nome}</Text>
            </View>
            <View style={styles.separador} />
            <View style={styles.linha}>
              <Text style={styles.linhaTexto}>E-mail</Text>
              <Text style={styles.linhaValor}>{usuario.email}</Text>
            </View>
          </View>
        </>
      )}

      {/* Dispositivos */}
      <Text style={styles.secaoTitulo}>MEUS DISPOSITIVOS</Text>
      <View style={styles.secao}>
        {dispositivos.length === 0 ? (
          <Text style={styles.vazio}>Nenhum dispositivo vinculado ainda.</Text>
        ) : (
          dispositivos.map((d, i) => (
            <View key={d.id}>
              {i > 0 && <View style={styles.separador} />}
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linhaTexto}>{d.nome}</Text>
                  <Text style={styles.linhaSubTexto}>
                    {d.localizacao || "Sem localização"} ·{" "}
                    {d.token_mqtt.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: d.ativo ? "#4ade80" : "#f87171" },
                  ]}
                />
              </View>
            </View>
          ))
        )}
        <View style={dispositivos.length > 0 ? styles.separador : undefined} />
        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={() => router.push("/(auth)/adicionar-dispositivo")}
        >
          <Text style={styles.botaoAdicionarTexto}>
            + Adicionar dispositivo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alertas */}
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

      {/* Intervalo */}
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

      {/* Sobre */}
      <Text style={styles.secaoTitulo}>SOBRE</Text>
      <View style={styles.secao}>
        <View style={styles.linha}>
          <Text style={styles.linhaTexto}>Versão</Text>
          <Text style={styles.linhaValor}>1.0.0</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.linha}>
          <Text style={styles.linhaTexto}>Broker</Text>
          <Text style={styles.linhaValor}>HiveMQ Cloud</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.botaoLogout} onPress={handleLogout}>
        <Text style={styles.botaoLogoutTexto}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  subtitulo: { color: "#94a3b8", fontSize: 14, marginBottom: 24 },
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
  linhaTexto: { color: "#fff", fontSize: 15 },
  linhaValor: { color: "#475569", fontSize: 14 },
  linhaSubTexto: {
    color: "#475569",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  separador: { height: 1, backgroundColor: "#2d2d3e", marginVertical: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  vazio: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 8,
  },
  botaoAdicionar: { paddingVertical: 10, alignItems: "center", marginTop: 4 },
  botaoAdicionarTexto: { color: "#4CAF50", fontSize: 15, fontWeight: "500" },
  intervaloRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  intervaloBotao: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2d2d3e",
    alignItems: "center",
  },
  intervaloBotaoAtivo: { backgroundColor: "#7c3aed" },
  intervaloTexto: { color: "#94a3b8", fontWeight: "500" },
  intervaloTextoAtivo: { color: "#fff" },
  botaoLogout: {
    backgroundColor: "#1e1e2e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f87171",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  botaoLogoutTexto: { color: "#f87171", fontWeight: "bold", fontSize: 16 },
});
