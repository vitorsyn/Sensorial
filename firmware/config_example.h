// ─────────────────────────────────────────────────────────────
//  config_example.h  —  MODELO de configuração
//  Copie este arquivo para config.h e preencha com seus dados.
//  O arquivo config.h está no .gitignore e NÃO é enviado ao GitHub.
// ─────────────────────────────────────────────────────────────

// ─── Wi-Fi ───────────────────────────────────────────────────
#define WIFI_SSID      "nome-da-sua-rede"
#define WIFI_PASSWORD  "senha-da-sua-rede"

// ─── HiveMQ Cloud ────────────────────────────────────────────
#define MQTT_HOST        "xxxx.s1.eu.hivemq.cloud"
#define MQTT_PORT        8883
#define MQTT_CLIENT_NAME "sensorial-esp32"
#define MQTT_USER        "seu-usuario-hivemq"
#define MQTT_PASSWORD    "sua-senha-hivemq"
#define MQTT_TOKEN       "token-do-dispositivo"
#define MQTT_TOPIC       "sensorial/token-do-dispositivo/dados"

// ─── Supabase ────────────────────────────────────────────────
#define SUPABASE_URL      "https://xxxx.supabase.co/rest/v1/leituras"
#define SUPABASE_ANON_KEY "eyJhbGci..."   // anon key do projeto Supabase
#define SENSOR_ID         1               // ID do sensor na tabela sensores