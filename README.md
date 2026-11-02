# Sensorial 🌡️

Monitoramento de temperatura e umidade em tempo real via IoT, com alertas no smartphone.

> Projeto de TCC — Técnico em Desenvolvimento de Sistemas · SENAI · 2026  
> Equipe: João Vitor Silva · Dailan · Gabriela · Luis Felipe

---

## Visão geral

O **Sensorial** conecta sensores físicos (ESP32 + DHT22) à nuvem via protocolo MQTT e exibe os dados em um aplicativo mobile multiplataforma. Quando a temperatura ou umidade ultrapassa os limites configurados, o usuário recebe uma notificação push automática.

```
ESP32 + DHT22
     │  MQTT over TLS (porta 8883)
     ▼
HiveMQ Cloud
     │  WebSocket Secure (porta 8884)
     ▼
React Native App ──► Supabase (histórico + alertas)
```

---

## Funcionalidades

- Leitura de temperatura e umidade a cada 5 segundos
- Transmissão segura via MQTTS (TLS)
- Histórico de leituras persistido no Supabase (PostgreSQL)
- Alertas configuráveis com cooldown de 5 minutos por tipo
- Notificações push nativas (Android)
- Cadastro e autenticação de usuários via Supabase Auth
- Suporte a múltiplos dispositivos por conta

---

## Estrutura do repositório

```
sensorial/
├── app/                    # Telas do app (Expo Router)
│   ├── (auth)/             # Login, cadastro, recuperação de senha
│   └── (tabs)/             # Dashboard, explorar, configurações
├── firmware/               # Código do ESP32
│   ├── main.ino            # Sketch principal
│   └── config_example.h   # Template de credenciais (copiar → config.h)
├── supabase/               # Funções Edge e configuração do banco
├── supabaseConfig.ts       # Cliente Supabase para o app
└── assets/                 # Ícones e imagens
```

---

## Pré-requisitos

### Firmware (ESP32)
- Arduino IDE 2.x
- Bibliotecas: `DHT sensor library`, `PubSubClient`, `ArduinoJson`, `WiFiClientSecure`
- Placa: ESP32 Dev Module

### App (React Native)
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI para builds (`npm install -g eas-cli`)

---

## Como rodar

### 1. Firmware

```bash
# 1. Clone o repositório
git clone https://github.com/vitorsyn/sensorial.git

# 2. Copie o template de credenciais
cp firmware/config_example.h firmware/config.h

# 3. Edite firmware/config.h com suas credenciais reais:
#    - Wi-Fi (SSID e senha)
#    - HiveMQ (host, usuário, senha, token)
#    - Supabase (URL e anon key)
#    - ID do sensor

# 4. Abra firmware/main.ino no Arduino IDE e carregue no ESP32
```

> ⚠️ O arquivo `config.h` está no `.gitignore` e **nunca deve ser commitado**.  
> Use `config_example.h` como referência pública da estrutura.

### 2. App

```bash
# 1. Instale dependências
npm install

# 2. Inicie em modo desenvolvimento
npx expo start

# 3. Para gerar APK (Android)
eas build --platform android --profile preview
```

---

## Variáveis de ambiente / credenciais

| Onde | Arquivo | O que configurar |
|------|---------|-----------------|
| ESP32 | `firmware/config.h` | Wi-Fi, HiveMQ, Supabase |
| App | `supabaseConfig.ts` | URL e anon key do Supabase |

As credenciais reais **não são versionadas**. Consulte `config_example.h` para a estrutura esperada.

---

## Banco de dados (Supabase)

5 tabelas com Row Level Security habilitado:

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Perfis de usuário vinculados ao Auth |
| `dispositivos` | ESP32 registrados por conta |
| `sensores` | Sensores físicos por dispositivo |
| `leituras` | Histórico de temperatura e umidade |
| `alertas` | Eventos de alerta com timestamp |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Firmware | C++ (Arduino), ESP32, DHT22 |
| Broker MQTT | HiveMQ Cloud |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| App mobile | React Native + Expo SDK 57 + TypeScript |
| Roteamento | Expo Router (file-based) |
| Notificações | expo-notifications |
| MQTT no app | MQTT.js via WebSocket Secure |

---

## Licença

Projeto acadêmico — SENAI 2026. Uso educacional.
