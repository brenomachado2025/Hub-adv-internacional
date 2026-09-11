"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_STATUSES } from "@/lib/data/crm";

type StatusResponse = {
  session: {
    status: string;
    qrCode: string;
    phoneNumber: string;
    lastConnectedAt: string | null;
  };
  sentToday: number;
  receivedToday: number;
};

type NotificationConfig = { status: string; message: string; enabled: boolean };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  CONNECTED: { label: "Conectado", color: "bg-emerald-500" },
  CONNECTING: { label: "Conectando...", color: "bg-amber-500" },
  DISCONNECTED: { label: "Desconectado", color: "bg-neutral-400" },
};

export function StatusTab() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [requestingQr, setRequestingQr] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      // Falha pontual numa consulta de polling a cada 3s se autocorrige sozinha.
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status-notifications");
      if (!res.ok) return;
      const json = await res.json();
      setConfigs(json.configs ?? []);
    } catch {
      // idem
    }
  }, []);

  useEffect(() => {
    load();
    loadConfigs();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load, loadConfigs]);

  const disconnect = async () => {
    if (!confirm("Desconectar este número do WhatsApp? Será necessário escanear um novo QR Code depois.")) return;
    await fetch("/api/whatsapp/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DISCONNECT" }),
    });
    load();
  };

  const requestNewQr = async () => {
    setRequestingQr(true);
    await fetch("/api/whatsapp/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NEW_QR" }),
    });
    setTimeout(() => {
      load();
      setRequestingQr(false);
    }, 3000);
  };

  const saveConfig = async (config: NotificationConfig) => {
    setSavingStatus(config.status);
    await fetch("/api/whatsapp/status-notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSavingStatus(null);
  };

  const statusInfo = STATUS_LABEL[data?.session.status ?? "DISCONNECTED"];

  if (!data) {
    return <p className="text-sm text-neutral-500">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Status da conexão</h3>
            <span className="flex items-center gap-2 text-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${statusInfo?.color}`} />
              {statusInfo?.label}
            </span>
          </div>

          {data?.session.status === "CONNECTED" && (
            <div className="text-sm space-y-1">
              <p>
                Número conectado: <strong>{data.session.phoneNumber}</strong>
              </p>
              {data.session.lastConnectedAt && (
                <p className="text-neutral-500">
                  Desde {new Date(data.session.lastConnectedAt).toLocaleString("pt-BR")}
                </p>
              )}
              <button
                onClick={disconnect}
                className="mt-2 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Desconectar
              </button>
            </div>
          )}

          {data?.session.status !== "CONNECTED" && (
            <div className="text-center space-y-3">
              {data?.session.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.session.qrCode} alt="QR Code do WhatsApp" className="mx-auto w-48 h-48" />
              ) : (
                <div className="mx-auto w-48 h-48 rounded-md bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-xs text-neutral-400">
                  Preparando QR Code...
                </div>
              )}
              <p className="text-xs text-neutral-500">
                Abra o WhatsApp no celular → Aparelhos conectados → Conectar um aparelho, e escaneie este código.
              </p>
              <button
                onClick={requestNewQr}
                disabled={requestingQr}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs disabled:opacity-50"
              >
                {requestingQr ? "Gerando..." : "Gerar novo QR Code"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold mb-3">Hoje</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{data?.sentToday ?? 0}</div>
              <div className="text-xs text-neutral-500">Mensagens enviadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{data?.receivedToday ?? 0}</div>
              <div className="text-xs text-neutral-500">Mensagens recebidas</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <h3 className="font-semibold mb-1">Notificações automáticas por mudança de status</h3>
        <p className="text-xs text-neutral-500 mb-3">
          Ao mover um cliente para uma dessas etapas no Kanban do CRM, envie automaticamente uma mensagem — só para
          clientes que já iniciaram conversa pelo WhatsApp.
        </p>
        <div className="space-y-3">
          {CRM_STATUSES.map((s) => {
            const config = configs.find((c) => c.status === s.value) ?? {
              status: s.value,
              message: "",
              enabled: false,
            };
            return (
              <div key={s.value} className="flex items-start gap-3">
                <label className="flex items-center gap-2 w-48 shrink-0 text-sm pt-2">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => {
                      const updated = { ...config, enabled: e.target.checked };
                      setConfigs((prev) => [...prev.filter((c) => c.status !== s.value), updated]);
                      saveConfig(updated);
                    }}
                  />
                  {s.label}
                </label>
                <input
                  value={config.message}
                  onChange={(e) => {
                    const updated = { ...config, message: e.target.value };
                    setConfigs((prev) => [...prev.filter((c) => c.status !== s.value), updated]);
                  }}
                  onBlur={() => saveConfig(config)}
                  placeholder="Ex.: Seu caso já está sendo analisado pela nossa equipe."
                  className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
                {savingStatus === s.value && <span className="text-xs text-neutral-400 pt-2">salvando...</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
