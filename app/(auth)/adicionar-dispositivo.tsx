import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../supabaseConfig";

export default function AdicionarDispositivoScreen() {
  const [token, setToken] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleVincular() {
    if (!token.trim()) {
      Alert.alert("Atenção", "Digite o código do dispositivo.");
      return;
    }
    if (!nome.trim()) {
      Alert.alert("Atenção", "Digite um nome para identificar o dispositivo.");
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.rpc("vincular_dispositivo", {
      p_token: token.trim().toLowerCase(),
      p_nome: nome.trim(),
    });
    setCarregando(false);

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    if (data?.erro) {
      Alert.alert("Não foi possível vincular", data.erro);
      return;
    }

    Alert.alert(
      "Dispositivo vinculado! ✅",
      `"${nome}" foi adicionado à sua conta com sucesso.`,
      [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Botão voltar */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.voltarBtn}
        >
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Adicionar dispositivo</Text>
        <Text style={styles.subtitulo}>
          Digite o código impresso na etiqueta do seu Sensorial.
        </Text>

        {/* Ilustração do código */}
        <View style={styles.etiqueta}>
          <Text style={styles.etiquetaLabel}>Código do dispositivo</Text>
          <Text style={styles.etiquetaCodigo}>A3F9B2C1</Text>
          <Text style={styles.etiquetaDica}>
            Exemplo — encontre na base do seu dispositivo
          </Text>
        </View>

        {/* Campo: código */}
        <Text style={styles.label}>Código do dispositivo</Text>
        <TextInput
          style={[styles.input, styles.inputCodigo]}
          placeholder="Ex: A3F9B2C1"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
          autoCorrect={false}
          value={token}
          onChangeText={setToken}
          maxLength={12}
        />

        {/* Campo: nome */}
        <Text style={styles.label}>Nome do dispositivo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Sala de estar, Estufa 1, Servidor..."
          placeholderTextColor="#475569"
          value={nome}
          onChangeText={setNome}
          maxLength={40}
        />
        <Text style={styles.dica}>
          Escolha um nome que identifique onde o sensor está instalado.
        </Text>

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={handleVincular}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Vincular dispositivo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  voltarBtn: { marginBottom: 24 },
  voltarTexto: { color: "#94a3b8", fontSize: 15 },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  subtitulo: { color: "#94a3b8", fontSize: 14, marginBottom: 28 },
  etiqueta: {
    backgroundColor: "#1e1e2e",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#2d2d3e",
    borderStyle: "dashed",
  },
  etiquetaLabel: {
    color: "#475569",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  etiquetaCodigo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 4,
    marginBottom: 6,
  },
  etiquetaDica: { color: "#475569", fontSize: 12, textAlign: "center" },
  label: { color: "#94a3b8", fontSize: 13, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "#1e1e2e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2d2d3e",
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  inputCodigo: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 3,
    color: "#4CAF50",
  },
  dica: { color: "#475569", fontSize: 12, marginBottom: 8 },
  botao: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
