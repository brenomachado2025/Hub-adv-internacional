"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { crmStatusLabel, nextCrmStatus, previousCrmStatus, formatDocument } from "@/lib/data/crm";
import { ClientFormModal } from "@/components/crm/ClientFormModal";
import type { CrmClient } from "@/components/crm/types";
import { OverviewTab } from "./OverviewTab";
import { NotesTab } from "./NotesTab";
import { TasksTab } from "./TasksTab";
import { MeetingsTab } from "./MeetingsTab";
import { DocumentsTab } from "./DocumentsTab";
import { WhatsappTab } from "./WhatsappTab";
import { ActivityTab } from "./ActivityTab";

const TABS = ["Visão Geral", "Notas", "Tarefas", "Reuniões", "Documentos", "WhatsApp", "Atividade"] as const;
type Tab = (typeof TABS)[number];

export function ClientDetail({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<CrmClient | null>(null);
  const [tab, setTab] = useState<Tab>("Visão Geral");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/clients/${clientId}`);
    if (!res.ok) {
      setClient(null);
      return;
    }
    const data = await res.json();
    setClient(data.client);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (status: string) => {
    setClient((c) => (c ? { ...c, status } : c));
    await fetch(`/api/crm/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const duplicate = async () => {
    const res = await fetch(`/api/crm/clients/${clientId}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (data.client) router.push(`/crm/${data.client.id}`);
  };

  const remove = async () => {
    if (!confirm("Excluir este cliente? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/crm/clients/${clientId}`, { method: "DELETE" });
    router.push("/crm");
  };

  if (!client) {
    return <p className="text-sm text-neutral-500">Carregando...</p>;
  }

  const next = nextCrmStatus(client.status);
  const prev = previousCrmStatus(client.status);

  return (
    <div className="space-y-6">
      <Link href="/crm" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
        <ArrowLeft size={16} /> Voltar para o CRM
      </Link>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{client.fullName}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {client.legalArea} · {formatDocument(client.documentType, client.documentNumber) || "sem documento"}
              {client.companyName ? ` · ${client.companyName}` : ""}
              {client.city ? ` · ${client.city}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={duplicate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <Copy size={14} /> Duplicar
            </button>
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900 text-red-600 text-xs hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium">
            {crmStatusLabel(client.status)}
          </span>
          <button
            disabled={!prev}
            onClick={() => prev && changeStatus(prev)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-30"
          >
            <ChevronLeft size={14} /> Voltar etapa
          </button>
          <button
            disabled={!next}
            onClick={() => next && changeStatus(next)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-30"
          >
            Avançar etapa <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Visão Geral" && <OverviewTab client={client} />}
      {tab === "Notas" && <NotesTab clientId={clientId} />}
      {tab === "Tarefas" && <TasksTab clientId={clientId} />}
      {tab === "Reuniões" && <MeetingsTab clientId={clientId} />}
      {tab === "Documentos" && <DocumentsTab clientId={clientId} />}
      {tab === "WhatsApp" && <WhatsappTab clientId={clientId} />}
      {tab === "Atividade" && <ActivityTab clientId={clientId} />}

      {editing && (
        <ClientFormModal
          client={client}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}
