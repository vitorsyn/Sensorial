import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseConfig";

export type Alerta = {
  id?: number;
  sensor_id: number;
  usuario_id: string;
  tipo: "temperatura" | "umidade";
  valor_limite: number;
  ativo: boolean;
};

export function useAlertas(sensorId: number | null) {
  const [alertaTemp, setAlertaTemp] = useState<Alerta | null>(null);
  const [alertaUmid, setAlertaUmid] = useState<Alerta | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Refs para acesso no callback MQTT (evita stale closure)
  const alertaTempRef = useRef<Alerta | null>(null);
  const alertaUmidRef = useRef<Alerta | null>(null);
  alertaTempRef.current = alertaTemp;
  alertaUmidRef.current = alertaUmid;

  useEffect(() => {
    if (!sensorId) return;
    buscarAlertas(sensorId);
  }, [sensorId]);

  async function buscarAlertas(sid: number) {
    setCarregando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("alertas")
      .select("*")
      .eq("sensor_id", sid)
      .eq("usuario_id", user.id);

    if (data) {
      const temp = data.find((a) => a.tipo === "temperatura") ?? null;
      const umid = data.find((a) => a.tipo === "umidade") ?? null;
      setAlertaTemp(temp);
      setAlertaUmid(umid);
    }
    setCarregando(false);
  }

  async function toggleAlerta(
    tipo: "temperatura" | "umidade",
    valorPadrao: number,
  ) {
    if (!sensorId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const atual = tipo === "temperatura" ? alertaTemp : alertaUmid;
    const setter = tipo === "temperatura" ? setAlertaTemp : setAlertaUmid;

    if (!atual) {
      // Criar novo alerta
      const { data, error } = await supabase
        .from("alertas")
        .insert([
          {
            sensor_id: sensorId,
            usuario_id: user.id,
            tipo,
            valor_limite: valorPadrao,
            ativo: true,
          },
        ])
        .select()
        .single();
      if (!error && data) setter(data);
    } else {
      // Alternar ativo/inativo
      const { data, error } = await supabase
        .from("alertas")
        .update({ ativo: !atual.ativo })
        .eq("id", atual.id)
        .select()
        .single();
      if (!error && data) setter(data);
    }
  }

  async function atualizarLimite(
    tipo: "temperatura" | "umidade",
    novoLimite: number,
  ) {
    const atual = tipo === "temperatura" ? alertaTemp : alertaUmid;
    const setter = tipo === "temperatura" ? setAlertaTemp : setAlertaUmid;
    if (!atual?.id) return;

    const { data, error } = await supabase
      .from("alertas")
      .update({ valor_limite: novoLimite })
      .eq("id", atual.id)
      .select()
      .single();
    if (!error && data) setter(data);
  }

  return {
    alertaTemp,
    alertaUmid,
    alertaTempRef,
    alertaUmidRef,
    carregando,
    toggleAlerta,
    atualizarLimite,
    recarregar: (sid: number) => buscarAlertas(sid),
  };
}
