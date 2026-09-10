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
  LOGIN: { label: "Login no painel", color: "text-red-300" },
  SUSPEND: { label: "Suspendeu conta", color: "text-red-500" },
  UNSUSPEND: { label: "Reativou conta", color: "text-emerald-400" },
  DELETE_ACCOUNT: { label: "Excluiu conta", color: "text-red-600" },
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
          <div className="rounded-lg border border-red-950 divide-y divide-red-950/60">
            {logs.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhum registro ainda.</p>}
            {logs.map((l) => {
              const a = ACTION_LABEL[l.action] ?? { label: l.action, color: "text-zinc-300" };
              return (
                <div key={l.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <span className={`font-medium ${a.color}`}>{a.label}</span>
                    {l.targetEmail && <span className="text-zinc-400 ml-2">{l.targetEmail}</span>}
                    {l.details && <span className="text-zinc-600 ml-2 text-xs">({l.details})</span>}
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
