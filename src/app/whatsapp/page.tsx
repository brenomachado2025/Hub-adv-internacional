"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_STATUSES } from "@/lib/data/crm";

type StatusResponse = {
  session: {
    status: string;
    qrCode: string;
    phoneNumber: string;
    lastConnectedAt: string | null;
    lastError: string;
  };
  sentToday: number;
  receivedToday: number;
  recentErrors: { id: string; message: string; createdAt: string }[];
};

type NotificationConfig = { status: string; message: string; enabled: boolean };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  CONNECTED: { label: "Conectado", color: "bg-emerald-500" },
  CONNECTING: { label: "Conectando...", color: "bg-amber-500" },
  DISCONNECTED: { label: "Desconectado", color: "bg-red-500" },
};

export default function WhatsappPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/whatsapp/status");
    setData(await res.json());
  }, []);

  const loadConfigs = useCallback(async () => {
    const res = await fetch("/api/whatsapp/status-notifications");
    const json = await res.json();
    setConfigs(json.configs ?? []);
  }, []);

  useEffect(() => {
    load();
    loadConfigs();
    const interval = setInterval(load, 4000);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">WhatsApp</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Conexão não-oficial (tipo WhatsApp Web) para atendimento e captação automática de clientes.
        </p>
      </div>

      <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-800 dark:text-amber-300">
        ⚠️ Esta é uma conexão <strong>não-oficial</strong> (não é a API oficial do WhatsApp Business). Recomendada
        apenas para testes e uso interno — há risco real de instabilidade ou bloqueio do número pelo WhatsApp.
        O robô de conexão roda no seu computador; ele só funciona enquanto o processo{" "}
        <code className="px-1 rounded bg-amber-100 dark:bg-amber-900">npm run whatsapp-worker</code> estiver em
        execução.
      </div>

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
                className="mt-2 px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-xs hover:bg-red-50 dark:hover:bg-red-950"
              >
                Desconectar
              </button>
            </div>
          )}

          {data?.session.status === "CONNECTING" && data.session.qrCode && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.session.qrCode} alt="QR Code do WhatsApp" className="mx-auto w-48 h-48" />
              <p className="text-xs text-neutral-500 mt-2">
                Abra o WhatsApp no celular → Aparelhos conectados → Conectar um aparelho, e escaneie este código.
              </p>
            </div>
          )}

          {data?.session.status === "DISCONNECTED" && (
            <div className="text-sm text-neutral-500 space-y-2">
              <p>Nenhuma conexão ativa.</p>
              <p>
                Para conectar, rode no seu computador:{" "}
                <code className="px-1 rounded bg-neutral-100 dark:bg-neutral-800">npm run whatsapp-worker</code>
              </p>
              {data.session.lastError && (
                <p className="text-red-600 text-xs">Último erro: {data.session.lastError}</p>
              )}
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

          <h4 className="text-xs text-neutral-500 mt-4 mb-2">Log de erros recentes</h4>
          {data?.recentErrors.length === 0 || !data ? (
            <p className="text-xs text-neutral-400">Nenhum erro registrado.</p>
          ) : (
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {data.recentErrors.map((e) => (
                <li key={e.id} className="text-xs text-red-600">
                  {new Date(e.createdAt).toLocaleString("pt-BR")} — {e.message.slice(0, 120)}
                </li>
              ))}
            </ul>
          )}
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
