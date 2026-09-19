// Supabase Edge Function — mqtt-listener
// Usa fetch via HTTP para buscar leituras recentes do HiveMQ Cloud REST API

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MQTT_BROKER   = Deno.env.get("MQTT_BROKER")!;
const MQTT_USER     = Deno.env.get("MQTT_USER")!;
const MQTT_PASSWORD = Deno.env.get("MQTT_PASSWORD")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Salva uma leitura no banco
async function salvarLeitura(token: string, temperatura: number, umidade: number) {
  // Busca o dispositivo pelo token
  const { data: dispositivo } = await supabase
    .from("dispositivos")
    .select("id")
    .eq("token_mqtt", token)
    .single();

  if (!dispositivo) {
    console.error(`Dispositivo não encontrado: ${token}`);
    return;
  }

  // Busca o sensor ativo do dispositivo
  const { data: sensor } = await supabase
    .from("sensores")
    .select("id")
    .eq("dispositivo_id", dispositivo.id)
    .eq("ativo", true)
    .limit(1)
    .single();

  if (!sensor) {
    console.error(`Sensor não encontrado para dispositivo: ${dispositivo.id}`);
    return;
  }

  // Verifica se já existe uma leitura nos últimos 10 segundos para evitar duplicatas
  const dez_seg_atras = new Date(Date.now() - 10000).toISOString();
  const { data: recente } = await supabase
    .from("leituras")
    .select("id")
    .eq("sensor_id", sensor.id)
    .gte("criado_em", dez_seg_atras)
    .limit(1);

  if (recente && recente.length > 0) {
    console.log(`Leitura recente já existe para ${token}, ignorando.`);
    return;
  }

  // Salva a leitura
  const { error } = await supabase
    .from("leituras")
    .insert([{ sensor_id: sensor.id, temperatura, umidade }]);

  if (error) {
    console.error("Erro ao salvar:", error.message);
  } else {
    console.log(`✅ Salvo — ${token} | ${temperatura}°C | ${umidade}%`);
  }
}

Deno.serve(async (_req) => {
  try {
    // Busca mensagens recentes do HiveMQ Cloud via REST API
    const credentials = btoa(`${MQTT_USER}:${MQTT_PASSWORD}`);
    
    // Lista todos os dispositivos ativos
    const { data: dispositivos } = await supabase
      .from("dispositivos")
      .select("id, token_mqtt")
      .eq("ativo", true);

    if (!dispositivos || dispositivos.length === 0) {
      return new Response(JSON.stringify({ ok: true, msg: "Nenhum dispositivo ativo" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Para cada dispositivo, busca a última leitura retida no broker
    let salvos = 0;
    for (const disp of dispositivos) {
      const topic = encodeURIComponent(`sensorial/${disp.token_mqtt}/dados`);
      const url = `https://${MQTT_BROKER}/api/v1/client/retained-messages/${topic}`;
      
      const res = await fetch(url, {
        headers: { "Authorization": `Basic ${credentials}` },
      });

      if (!res.ok) continue;

      const msg = await res.json();
      if (!msg?.payload) continue;

      // Decodifica payload base64
      const json = atob(msg.payload);
      const dados = JSON.parse(json);

      await salvarLeitura(disp.token_mqtt, dados.temperatura, dados.umidade);
      salvos++;
    }

    return new Response(JSON.stringify({ ok: true, salvos }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Erro:", err);
    return new Response(JSON.stringify({ erro: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});