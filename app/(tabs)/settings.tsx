import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAlertas } from "../../hooks/use-alertas";
import { supabase } from "../../supabaseConfig";

type Dispositivo = {
  id: number;
  nome: string;
  localizacao: string;
  token_mqtt: string;
  ativo: boolean;
};

export default function SettingsScreen() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [sensorId, setSensorId] = useState<number | null>(null);
  const [dispAtivo, setDispAtivo] = useState<Dispositivo | null>(null);
  const [usuario, setUsuario] = useState<{ nome: string; email: string } | null>(null);

  // Campos de edição dos limites
  const [limiteTemp, setLimiteTemp] = useState("30");
  const [limiteUmid, setLimiteUmid] = useState("80");
  const [salvandoTemp, setSalvandoTemp] = useState(false);
  const [salvandoUmid, setSalvandoUmid] = useState(false);

  const { alertaTemp, alertaUmid, toggleAlerta, atualizarLimite, recarregar } =
    useAlertas(sensorId);

  useEffect(() => {
    buscarDados();
  }, []);

  // Sincroniza campos de texto com valores do banco
  useEffect(() => {
    if (alertaTemp) setLimiteTemp(String(alertaTemp.valor_limite));
  }, [alertaTemp]);

  useEffect(() => {
    if (alertaUmid) setLimiteUmid(String(alertaUmid.valor_limite));
  }, [alertaUmid]);

  async function buscarDados() {
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

    const { data: devs } = await supabase
      .from("dispositivos")
      .select("id, nome, localizacao, token_mqtt, ativo")
      .order("criado_em", { ascending: true });
    if (devs && devs.length > 0) {
      setDispositivos(devs);
      const primeiro = devs[0];
      setDispAtivo(primeiro);
      buscarSensor(primeiro.id);
    }
  }

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

  async function handleSalvarLimiteTemp() {
    const valor = parseFloat(limiteTemp.replace(",", "."));
    if (isNaN(valor)) return;
    setSalvandoTemp(true);
    await atualizarLimite("temperatura", valor);
    setSalvandoTemp(false);
  }

  async function handleSalvarLimiteUmid() {
    const valor = parseFloat(limiteUmid.replace(",", "."));
    if (isNaN(valor)) return;
    setSalvandoUmid(true);
    await atualizarLimite("umidade", valor);
    setSalvandoUmid(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
            <Text style={styles.botaoAdicionarTexto}>+ Adicionar dispositivo</Text>
          </TouchableOpacity>
        </View>

        {/* Alertas */}
        <Text style={styles.secaoTitulo}>ALERTAS</Text>
        {!sensorId ? (
          <View style={styles.secao}>
            <Text style={styles.vazio}>
              Vincule um dispositivo para configurar alertas.
            </Text>
          </View>
        ) : (
          <View style={styles.secao}>
            {/* Alerta de temperatura */}
            <View style={styles.alertaBloco}>
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linhaTexto}>Alerta de temperatura</Text>
                  <Text style={styles.linhaSubTexto}>
                    Notificar quando ultrapassar o limite
                  </Text>
                </View>
                <Switch
                  value={alertaTemp?.ativo ?? false}
                  onValueChange={() => toggleAlerta("temperatura", 30)}
                  trackColor={{ false: "#2d2d3e", true: "#7c3aed" }}
                  thumbColor={alertaTemp?.ativo ? "#a78bfa" : "#475569"}
                />
              </View>
              {alertaTemp?.ativo && (
                <View style={styles.limiteRow}>
                  <Text style={styles.limiteLabel}>Limite (°C)</Text>
                  <View style={styles.limiteInputRow}>
                    <TextInput
                      style={styles.limiteInput}
                      value={limiteTemp}
                      onChangeText={setLimiteTemp}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#475569"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={[
                        styles.salvarBtn,
                        salvandoTemp && styles.salvarBtnDisabled,
                      ]}
                      onPress={handleSalvarLimiteTemp}
                      disabled={salvandoTemp}
                    >
                      <Text style={styles.salvarBtnTexto}>
                        {salvandoTemp ? "Salvando..." : "Salvar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.separador} />

            {/* Alerta de umidade */}
            <View style={styles.alertaBloco}>
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linhaTexto}>Alerta de umidade</Text>
                  <Text style={styles.linhaSubTexto}>
                    Notificar quando ultrapassar o limite
                  </Text>
                </View>
                <Switch
                  value={alertaUmid?.ativo ?? false}
                  onValueChange={() => toggleAlerta("umidade", 80)}
                  trackColor={{ false: "#2d2d3e", true: "#0369a1" }}
                  thumbColor={alertaUmid?.ativo ? "#2dd4bf" : "#475569"}
                />
              </View>
              {alertaUmid?.ativo && (
                <View style={styles.limiteRow}>
                  <Text style={styles.limiteLabel}>Limite (%)</Text>
                  <View style={styles.limiteInputRow}>
                    <TextInput
                      style={styles.limiteInput}
                      value={limiteUmid}
                      onChangeText={setLimiteUmid}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#475569"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={[
                        styles.salvarBtn,
                        { backgroundColor: "#0369a1" },
                        salvandoUmid && styles.salvarBtnDisabled,
                      ]}
                      onPress={handleSalvarLimiteUmid}
                      disabled={salvandoUmid}
                    >
                      <Text style={styles.salvarBtnTexto}>
                        {salvandoUmid ? "Salvando..." : "Salvar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

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
    </KeyboardAvoidingView>
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
    marginBottom: 4,
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
  alertaBloco: {
    gap: 4,
  },
  limiteRow: {
    marginTop: 10,
    gap: 8,
  },
  limiteLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  limiteInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  limiteInput: {
    flex: 1,
    backgroundColor: "#2d2d3e",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#3d3d4e",
  },
  salvarBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  salvarBtnDisabled: {
    opacity: 0.5,
  },
  salvarBtnTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
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
