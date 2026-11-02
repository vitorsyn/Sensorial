#include "DHTesp.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

const int DHT_PIN = 15;
DHTesp dhtSensor;

// ─── Wi-Fi ─────────────────────────────────────────────────
const char* ssid     = "Wokwi-GUEST";
const char* password = "";

// ─── HiveMQ ────────────────────────────────────────────────
const char* hostname      = "c2acc9f739334988b6f79ef00c22f2bf.s1.eu.hivemq.cloud";
const int   PORTNUM       = 8883;
const char* espClientName = "sensorial-esp32";
const char* mqttUser      = "sensorial";
const char* mqttPassword  = "K1k2k3k4";
const char* mqttToken     = "a3f9b2c1";
const char* mqttTopic     = "sensorial/a3f9b2c1/dados";

// ─── Supabase ──────────────────────────────────────────────
const char* supabaseUrl     = "https://qozunzeqgabopccpsyna.supabase.co/rest/v1/leituras";
const char* supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvenVuemVxZ2Fib3BjY3BzeW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMTA5MjMsImV4cCI6MjEwMjU4NjkyM30.hqN2LzrOzj9yvTo_NN--DcjCjdLCvduemepwvgXLa04";
const int   sensorId        = 1;

WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long ultimaLeitura = 0;
const unsigned long INTERVALO = 5000;

// ─── Wi-Fi ─────────────────────────────────────────────────
void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi conectado! IP: " + WiFi.localIP().toString());
}

// ─── MQTT ──────────────────────────────────────────────────
void connectMQTT() {
  while (!client.connected()) {
    Serial.println("Conectando ao MQTT...");
    if (client.connect(espClientName, mqttUser, mqttPassword)) {
      Serial.println("Conectado ao broker!");
    } else {
      Serial.print("Falha, estado: ");
      Serial.println(client.state());
      delay(3000);
    }
  }
}

// ─── Supabase ──────────────────────────────────────────────
void salvarNoSupabase(float temperatura, float umidade) {
  WiFiClientSecure https;
  https.setInsecure();
  HTTPClient http;

  http.begin(https, supabaseUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseAnonKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseAnonKey));
  http.addHeader("Prefer", "return=minimal");

  StaticJsonDocument<128> doc;
  doc["sensor_id"]   = sensorId;
  doc["temperatura"] = temperatura;
  doc["umidade"]     = umidade;

  char body[128];
  serializeJson(doc, body);

  int httpCode = http.POST(body);

  if (httpCode == 201) {
    Serial.println("Supabase: leitura salva!");
  } else {
    Serial.println("Supabase erro: " + String(httpCode));
    Serial.println(http.getString());
  }

  http.end();
}

// ─── Setup ─────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);
  setup_wifi();
  espClient.setInsecure();
  client.setServer(hostname, PORTNUM);
  client.setBufferSize(256);
  connectMQTT();
}

// ─── Loop ──────────────────────────────────────────────────
void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  unsigned long agora = millis();
  if (agora - ultimaLeitura >= INTERVALO) {
    ultimaLeitura = agora;

    TempAndHumidity data = dhtSensor.getTempAndHumidity();

    if (isnan(data.temperature) || isnan(data.humidity)) {
      Serial.println("Erro ao ler DHT22!");
      return;
    }

    float temp = String(data.temperature, 1).toFloat();
    float umid = String(data.humidity, 1).toFloat();

    // 1. Publica no MQTT (app em tempo real)
    StaticJsonDocument<128> doc;
    doc["temperatura"] = temp;
    doc["umidade"]     = umid;
    doc["dispositivo"] = mqttToken;

    char payload[128];
    serializeJson(doc, payload);

    if (client.publish(mqttTopic, payload, true)) {
      Serial.println("MQTT publicado: " + String(payload));
    } else {
      Serial.println("MQTT falhou!");
    }

    // 2. Salva direto no Supabase (histórico persistente)
    salvarNoSupabase(temp, umid);
  }
}
