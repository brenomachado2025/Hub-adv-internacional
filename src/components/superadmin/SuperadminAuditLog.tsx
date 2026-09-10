"use client";

import { useEffect, useState } from "react";
import { SuperadminShell } from "./SuperadminShell";

type LogEntry = {
  id: string;
  action: string;
  targetEmail: string;
  targetUserId: string;
  details: string;
  createdAt: string;
};

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  LOGIN: { label: "Login no painel", color: "text-blue-400" },
  SUSPEND: { label: "Suspendeu conta", color: "text-amber-400" },
  UNSUSPEND: { label: "Reativou conta", color: "text-emerald-400" },
  DELETE_ACCOUNT: { label: "Excluiu conta", color: "text-red-400" },
};

export function SuperadminAuditLog() {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/superadmin/audit-log")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []));
  }, []);

  return (
    <SuperadminShell>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Log de auditoria do painel</h2>
        <p className="text-sm text-zinc-400">Todas as ações administrativas feitas no /superadmin.</p>

        {!logs ? (
          <p className="text-sm text-zinc-400">Carregando...</p>
        ) : (
          <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-900">
            {logs.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhum registro ainda.</p>}
            {logs.map((l) => {
              const a = ACTION_LABEL[l.action] ?? { label: l.action, color: "text-zinc-300" };
              return (
                <div key={l.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <span className={`font-medium ${a.color}`}>{a.label}</span>
                    {l.targetEmail && <span className="text-zinc-400 ml-2">{l.targetEmail}</span>}
                  </div>
                  <span className="text-xs text-zinc-500">{new Date(l.createdAt).toLocaleString("pt-BR")}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SuperadminShell>
  );
}
