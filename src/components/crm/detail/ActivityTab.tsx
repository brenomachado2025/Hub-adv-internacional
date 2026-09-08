"use client";

import { useEffect, useState } from "react";

type Activity = { id: string; type: string; description: string; actor: string; createdAt: string };

const TYPE_LABEL: Record<string, string> = {
  CREATED: "Cadastro",
  STATUS_CHANGE: "Status",
  NOTE: "Anotação",
  TASK: "Tarefa",
  MEETING: "Reunião",
  DOCUMENT: "Documento",
  WHATSAPP: "WhatsApp",
  DUPLICATE: "Duplicação",
};

export function ActivityTab({ clientId }: { clientId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetch(`/api/crm/clients/${clientId}/activity`)
      .then((res) => res.json())
      .then((data) => setActivities(data.activities ?? []));
  }, [clientId]);

  if (activities.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-900">
      {activities.map((a) => (
        <div key={a.id} className="p-3 flex items-start gap-3">
          <span className="text-[10px] shrink-0 mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {TYPE_LABEL[a.type] ?? a.type}
          </span>
          <div className="flex-1">
            <p className="text-sm">{a.description}</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {a.actor || "sistema"} · {new Date(a.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
