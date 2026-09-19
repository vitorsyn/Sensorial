import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ConfirmacaoEmailScreen() {
  async function handleReenviar() {
    // Só disponível se o usuário veio do cadastro — reenvio não é suportado
    // diretamente sem o email, então apenas volta para recuperar-senha
    router.replace("/(auth)/recuperar-senha");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Sensorial</Text>
      <Text style={styles.subtitulo}>
        Digite seu e-mail para recuperar sua senha
      </Text>

      {/* Card de confirmação */}
      <View style={styles.card}>
        <Text style={styles.icone}>✉️</Text>
        <Text style={styles.cardTitulo}>Verifique seu e-mail</Text>
        <Text style={styles.cardTexto}>
          Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa
          de entrada.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.botaoPrimario}
        onPress={() => router.replace("/(auth)/login")}
      >
        <Text style={styles.botaoTexto}>Voltar para o login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botaoSecundario} onPress={handleReenviar}>
        <Text style={styles.botaoTextoSecundario}>
          Enviar link de recuperação
        </Text>
      </TouchableOpacity>

      <Text style={styles.rodape}>
        Lembra de sua conta?{" "}
        <Text
          style={styles.linkAzul}
          onPress={() => router.replace("/(auth)/login")}
        >
          Entrar
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    padding: 28,
    justifyContent: "center",
  },
  titulo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 6,
  },
  subtitulo: { color: "#94a3b8", fontSize: 14, marginBottom: 32 },
  card: {
    backgroundColor: "#1e1e2e",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
  },
  icone: { fontSize: 40, marginBottom: 16 },
  cardTitulo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardTexto: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  botaoPrimario: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  botaoSecundario: {
    backgroundColor: "#1e1e2e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2d2d3e",
    paddingVertical: 14,
    alignItems: "center",
  },
  botaoTexto: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  botaoTextoSecundario: { color: "#94a3b8", fontWeight: "bold", fontSize: 16 },
  rodape: {
    color: "#475569",
    textAlign: "center",
    marginTop: 32,
    fontSize: 13,
  },
  linkAzul: { color: "#60A5FA" },
});
