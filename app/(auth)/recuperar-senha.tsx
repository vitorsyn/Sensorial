import { Link, router } from "expo-router";
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
    TouchableOpacity
} from "react-native";
import { supabase } from "../../supabaseConfig";

export default function RecuperarSenhaScreen() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleRecuperar() {
    if (!email) {
      Alert.alert("Atenção", "Digite seu e-mail.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setCarregando(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      router.replace("/(auth)/confirmacao-email");
    }
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
        <Text style={styles.titulo}>Sensorial</Text>
        <Text style={styles.subtitulo}>
          Digite seu e-mail para recuperar sua senha
        </Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="exemplo@sensorial.io"
          placeholderTextColor="#475569"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={handleRecuperar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Enviar link de recuperação</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.rodape}>
          Lembra de sua conta?{" "}
          <Link href="/(auth)/login" style={styles.linkAzul}>
            Entrar
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 28 },
  titulo: { fontSize: 36, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  subtitulo: { color: "#94a3b8", fontSize: 14, marginBottom: 32 },
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
  botao: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  rodape: {
    color: "#475569",
    textAlign: "center",
    marginTop: 32,
    fontSize: 13,
  },
  linkAzul: { color: "#60A5FA" },
});
