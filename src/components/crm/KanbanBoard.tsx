"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CRM_STATUSES, nextCrmStatus, previousCrmStatus, formatDocument } from "@/lib/data/crm";
import type { CrmClient } from "./types";

type Props = {
  clients: CrmClient[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (client: CrmClient) => void;
  onDelete: (id: string) => void;
};

// Cada etapa tem um emoji e uma cor de destaque proprios, pra diferenciar as
// colunas de relance mesmo recolhidas (so o retangulo colorido + emoji).
const STATUS_STYLE: Record<string, { emoji: string; border: string; bg: string; badge: string }> = {
  CONTACTED: {
    emoji: "📞",
    border: "border-blue-200 dark:border-blue-900/60",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    badge: "bg-blue-600",
  },
  INITIALIZED: {
    emoji: "🚀",
    border: "border-violet-200 dark:border-violet-900/60",
    bg: "bg-violet-50/60 dark:bg-violet-950/20",
    badge: "bg-violet-600",
  },
  IN_PROGRESS: {
    emoji: "⏳",
    border: "border-amber-200 dark:border-amber-900/60",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    badge: "bg-amber-600",
  },
  FINISHED: {
    emoji: "✅",
    border: "border-emerald-200 dark:border-emerald-900/60",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    badge: "bg-emerald-600",
  },
};

export function KanbanBoard({ clients, onStatusChange, onEdit, onDelete }: Props) {
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapsed = (status: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      {CRM_STATUSES.map((col) => {
        const columnClients = clients.filter((c) => c.status === col.value);
        const isCollapsed = collapsed.has(col.value);
        const style = STATUS_STYLE[col.value];
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
            className={`rounded-2xl border p-3 min-h-[200px] transition-colors ${
              isCollapsed ? "w-16 shrink-0 space-y-2" : "flex-1 min-w-[240px] space-y-3"
            } ${
              dragOverStatus === col.value
                ? "border-slate-500 bg-slate-50 dark:bg-slate-900/40"
                : `${style.border} ${style.bg}`
            }`}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <span className="text-2xl leading-none" aria-hidden>{style.emoji}</span>
                <span className={`text-[11px] text-white rounded-full px-1.5 py-0.5 ${style.badge}`}>
                  {columnClients.length}
                </span>
                <button
                  onClick={() => toggleCollapsed(col.value)}
                  title={`Abrir "${col.label}"`}
                  aria-label={`Abrir "${col.label}"`}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-neutral-900"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0" aria-hidden>{style.emoji}</span>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{col.label}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs text-white rounded-full px-2 py-0.5 ${style.badge}`}>
                    {columnClients.length}
                  </span>
                  <button
                    onClick={() => toggleCollapsed(col.value)}
                    title={`Recolher "${col.label}"`}
                    aria-label={`Recolher "${col.label}"`}
                    className="flex items-center justify-center w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-neutral-900"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>
              </div>
            )}

            {!isCollapsed && <div className="space-y-2">
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
                    className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/crm/${client.id}`} className="text-sm font-medium text-left hover:underline">
                        {client.fullName}
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onEdit(client)}
                          aria-label="Editar rápido"
                          title="Editar rápido"
                          className="flex items-center justify-center w-6 h-6 rounded-full text-neutral-400 hover:text-slate-700 hover:bg-neutral-100 dark:hover:text-slate-200 dark:hover:bg-neutral-800 text-xs"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDelete(client.id)}
                          aria-label="Excluir cliente"
                          title="Excluir"
                          className="flex items-center justify-center w-6 h-6 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{client.legalArea}</p>
                    {client.companyName && (
                      <p className="text-xs text-neutral-500">{client.companyName}</p>
                    )}
                    <p className="text-xs text-neutral-400">
                      {client.city || "-"} · {formatDocument(client.documentType, client.documentNumber) || "-"}
                    </p>
                    {client.assignee && (
                      <p className="text-xs text-blue-600 mt-1">{client.assignee.name || client.assignee.email}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <button
                        disabled={!prev}
                        onClick={() => prev && onStatusChange(client.id, prev)}
                        aria-label="Voltar etapa"
                        title="Voltar etapa"
                        className="text-xs px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        ←
                      </button>
                      <button
                        disabled={!next}
                        onClick={() => next && onStatusChange(client.id, next)}
                        aria-label="Avançar etapa"
                        title="Avançar etapa"
                        className="text-xs px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
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
            </div>}
          </div>
        );
      })}
    </div>
  );
}
