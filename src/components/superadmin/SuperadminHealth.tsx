"use client";

import { useEffect, useState } from "react";
import { SuperadminShell } from "./SuperadminShell";

type Health = {
  whatsappSessions: {
    status: string;
    phoneNumber: string;
    lastConnectedAt: string | null;
    updatedAt: string;
    lastError: string;
    ownerEmail: string;
    ownerName: string;
  }[];
  sanctionsSyncRuns: { source: string; status: string; entriesCount: number; changesCount: number; startedAt: string; finishedAt: string | null }[];
  pendingDeadlines: number;
  overdueInstallments: number;
  apiKeys: { anthropic: boolean; datajud: boolean };
};

const STATUS_COLOR: Record<string, string> = {
  CONNECTED: "text-emerald-400",
  CONNECTING: "text-amber-400",
  DISCONNECTED: "text-red-400",
};

export function SuperadminHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [testingDataJud, setTestingDataJud] = useState(false);
  const [dataJudResult, setDataJudResult] = useState("");

  useEffect(() => {
    fetch("/api/superadmin/health")
      .then((res) => res.json())
      .then(setHealth);
  }, []);

  const testDataJud = async () => {
    setTestingDataJud(true);
    setDataJudResult("");
    const res = await fetch("/api/superadmin/health/test-datajud", { method: "POST" });
    const data = await res.json();
    setDataJudResult(data.ok ? `OK — respondeu, encontrado: ${data.found}` : `Falhou: ${data.error}`);
    setTestingDataJud(false);
  };

  if (!health) {
    return (
      <SuperadminShell>
        <p className="text-sm text-zinc-400">Carregando...</p>
      </SuperadminShell>
    );
  }

  return (
    <SuperadminShell>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white">Saúde do sistema</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-800 p-4">
            <div className="text-2xl font-bold text-white">{health.whatsappSessions.filter((s) => s.status === "CONNECTED").length}</div>
            <div className="text-xs text-zinc-400 mt-1">WhatsApp conectados</div>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <div className="text-2xl font-bold text-amber-400">{health.pendingDeadlines}</div>
            <div className="text-xs text-zinc-400 mt-1">Prazos processuais pendentes</div>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <div className="text-2xl font-bold text-red-400">{health.overdueInstallments}</div>
            <div className="text-xs text-zinc-400 mt-1">Parcelas em atraso</div>
          </div>
        </div>

        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Conexões WhatsApp</h3>
          <div className="rounded-lg border border-zinc-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="py-2 px-3">Conta</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Número</th>
                  <th className="py-2 px-3">Última atualização</th>
                  <th className="py-2 px-3">Último erro</th>
                </tr>
              </thead>
              <tbody>
                {health.whatsappSessions.map((s, i) => (
                  <tr key={i} className="border-b border-zinc-900">
                    <td className="py-2 px-3">{s.ownerName || s.ownerEmail}</td>
                    <td className={`py-2 px-3 ${STATUS_COLOR[s.status] ?? ""}`}>{s.status}</td>
                    <td className="py-2 px-3 text-zinc-400">{s.phoneNumber || "-"}</td>
                    <td className="py-2 px-3 text-zinc-500">{new Date(s.updatedAt).toLocaleString("pt-BR")}</td>
                    <td className="py-2 px-3 text-zinc-500 max-w-[200px] truncate">{s.lastError || "-"}</td>
                  </tr>
                ))}
                {health.whatsappSessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-600">
                      Nenhuma conexão registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Sincronização de sanções (ONU/OFAC/UE)</h3>
          <div className="rounded-lg border border-zinc-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="py-2 px-3">Fonte</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Entradas</th>
                  <th className="py-2 px-3">Mudanças</th>
                  <th className="py-2 px-3">Quando</th>
                </tr>
              </thead>
              <tbody>
                {health.sanctionsSyncRuns.map((r, i) => (
                  <tr key={i} className="border-b border-zinc-900">
                    <td className="py-2 px-3">{r.source}</td>
                    <td className={`py-2 px-3 ${r.status === "SUCCESS" ? "text-emerald-400" : "text-red-400"}`}>{r.status}</td>
                    <td className="py-2 px-3">{r.entriesCount}</td>
                    <td className="py-2 px-3">{r.changesCount}</td>
                    <td className="py-2 px-3 text-zinc-500">{new Date(r.startedAt).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
                {health.sanctionsSyncRuns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-600">
                      Nenhuma sincronização registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Chaves de API externas</h3>
          <div className="rounded-lg border border-zinc-800 p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Anthropic (assistente de chat)</span>
              <span className={health.apiKeys.anthropic ? "text-emerald-400" : "text-red-400"}>
                {health.apiKeys.anthropic ? "Configurada" : "Não configurada"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>DataJud (consulta de processos)</span>
              <div className="flex items-center gap-3">
                <span className={health.apiKeys.datajud ? "text-emerald-400" : "text-red-400"}>
                  {health.apiKeys.datajud ? "Configurada" : "Não configurada"}
                </span>
                <button
                  onClick={testDataJud}
                  disabled={testingDataJud}
                  className="text-xs text-amber-400 hover:underline disabled:opacity-50"
                >
                  {testingDataJud ? "Testando..." : "Testar agora"}
                </button>
              </div>
            </div>
            {dataJudResult && <p className="text-xs text-zinc-500">{dataJudResult}</p>}
          </div>
        </section>
      </div>
    </SuperadminShell>
  );
}
