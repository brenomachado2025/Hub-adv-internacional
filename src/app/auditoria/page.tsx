"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  module: string;
  query: string;
  resultSummary: string;
  createdAt: string;
};

const ACTION_LABEL: Record<string, string> = {
  SEARCH: "Busca",
  VIEW: "Consulta",
  EXPORT: "Exportação",
  SYNC: "Sincronização",
};

const MODULE_LABEL: Record<string, string> = {
  sancoes: "Sanções",
  honorarios: "Honorários",
  faturas: "Faturas",
  reunioes: "Reuniões",
  crm: "CRM",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [moduleFilter, setModuleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (mod: string) => {
    setLoading(true);
    const res = await fetch(`/api/audit${mod ? `?module=${mod}` : ""}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load(moduleFilter);
  }, [moduleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Consultas (Auditoria)</h2>
          <p className="text-neutral-500 text-sm mt-1">
            Registro de todas as buscas e ações realizadas no hub, para fins de auditoria.
          </p>
        </div>
        <a
          href="/api/audit/export"
          className="text-sm px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700"
        >
          Exportar CSV
        </a>
      </div>

      <div className="flex gap-2">
        {["", "sancoes", "honorarios", "faturas", "reunioes", "crm"].map((m) => (
          <button
            key={m || "all"}
            onClick={() => setModuleFilter(m)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              moduleFilter === m
                ? "bg-blue-600 text-white border-blue-600"
                : "border-neutral-300 dark:border-neutral-700"
            }`}
          >
            {m ? MODULE_LABEL[m] : "Todos"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 px-3">Data</th>
              <th className="py-2 px-3">Ator</th>
              <th className="py-2 px-3">Ação</th>
              <th className="py-2 px-3">Módulo</th>
              <th className="py-2 px-3">Consulta</th>
              <th className="py-2 px-3">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-neutral-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-neutral-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 px-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                <td className="py-2 px-3">{l.actor}</td>
                <td className="py-2 px-3">{ACTION_LABEL[l.action] ?? l.action}</td>
                <td className="py-2 px-3">{MODULE_LABEL[l.module] ?? l.module}</td>
                <td className="py-2 px-3">{l.query || "-"}</td>
                <td className="py-2 px-3 text-neutral-500">{l.resultSummary || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
