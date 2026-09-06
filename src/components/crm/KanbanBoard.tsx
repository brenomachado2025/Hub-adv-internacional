"use client";

import { useState } from "react";
import { CRM_STATUSES, nextCrmStatus, previousCrmStatus, formatDocument } from "@/lib/data/crm";
import type { CrmClient } from "./types";

type Props = {
  clients: CrmClient[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (client: CrmClient) => void;
  onDelete: (id: string) => void;
};

export function KanbanBoard({ clients, onStatusChange, onEdit, onDelete }: Props) {
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CRM_STATUSES.map((col) => {
        const columnClients = clients.filter((c) => c.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(col.value);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === col.value ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/client-id");
              if (id) onStatusChange(id, col.value);
              setDragOverStatus(null);
            }}
            className={`rounded-lg border p-3 space-y-3 min-h-[200px] transition-colors ${
              dragOverStatus === col.value
                ? "border-slate-500 bg-slate-50 dark:bg-slate-900/40"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{col.label}</h3>
              <span className="text-xs bg-slate-800 text-white rounded-full px-2 py-0.5">
                {columnClients.length}
              </span>
            </div>

            <div className="space-y-2">
              {columnClients.map((client) => {
                const next = nextCrmStatus(client.status);
                const prev = previousCrmStatus(client.status);
                return (
                  <div
                    key={client.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/client-id", client.id);
                    }}
                    className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onEdit(client)}
                        className="text-sm font-medium text-left hover:underline"
                      >
                        {client.fullName}
                      </button>
                      <button
                        onClick={() => onDelete(client.id)}
                        className="text-neutral-400 hover:text-red-600 text-xs"
                        title="Excluir"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{client.legalArea}</p>
                    {client.companyName && (
                      <p className="text-xs text-neutral-500">{client.companyName}</p>
                    )}
                    <p className="text-xs text-neutral-400">
                      {client.city || "-"} · {formatDocument(client.documentType, client.documentNumber) || "-"}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <button
                        disabled={!prev}
                        onClick={() => prev && onStatusChange(client.id, prev)}
                        className="text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-30"
                        title="Voltar etapa"
                      >
                        ←
                      </button>
                      <button
                        disabled={!next}
                        onClick={() => next && onStatusChange(client.id, next)}
                        className="text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-30"
                        title="Avançar etapa"
                      >
                        →
                      </button>
                    </div>
                  </div>
                );
              })}
              {columnClients.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-4">Nenhum cliente aqui.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
