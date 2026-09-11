"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_STATUSES, LEGAL_AREAS } from "@/lib/data/crm";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { ClientTable } from "@/components/crm/ClientTable";
import { ClientFormModal } from "@/components/crm/ClientFormModal";
import { ImportModal } from "@/components/crm/ImportModal";
import { FollowUpSettings } from "@/components/crm/FollowUpSettings";
import { useToast } from "@/components/Toast";
import { SkeletonCards } from "@/components/Skeleton";
import type { CrmClient } from "@/components/crm/types";

export default function CrmPage() {
  const showToast = useToast();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [legalAreaFilter, setLegalAreaFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [search, setSearch] = useState("");

  const [formClient, setFormClient] = useState<CrmClient | null | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (legalAreaFilter) params.set("legalArea", legalAreaFilter);
    if (cityFilter) params.set("city", cityFilter);
    if (search) params.set("q", search);
    return params.toString();
  }, [statusFilter, legalAreaFilter, cityFilter, search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/clients?${buildQuery()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(data.clients ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const uniqueCities = Array.from(new Set(clients.map((c) => c.city).filter(Boolean))).sort();

  const handleStatusChange = async (id: string, status: string) => {
    const previous = clients.find((c) => c.id === id)?.status;
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      const res = await fetch(`/api/crm/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setClients((prev) => prev.map((c) => (c.id === id && previous ? { ...c, status: previous } : c)));
      showToast("Não foi possível mover o cliente. Tente novamente.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente? Essa ação não pode ser desfeita.")) return;
    const previous = clients;
    setClients((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/crm/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setClients(previous);
      showToast("Não foi possível excluir o cliente. Tente novamente.", "error");
    }
  };

  const exportUrl = `/api/crm/clients/export?${buildQuery()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">CRM de Clientes</h2>
          <p className="text-neutral-500 text-sm mt-1">
            Gestão do funil de clientes do escritório, do primeiro contato ao encerramento.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={exportUrl}
            className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
          >
            Exportar CSV
          </a>
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
          >
            Importar planilha
          </button>
          <button
            onClick={() => setFormClient(null)}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium"
          >
            + Novo cliente
          </button>
        </div>
      </div>

      <FollowUpSettings />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden text-sm">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 ${view === "kanban" ? "bg-slate-800 text-white" : ""}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 ${view === "list" ? "bg-slate-800 text-white" : ""}`}
          >
            Lista
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, documento ou empresa..."
          className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm flex-1 min-w-[200px]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        >
          <option value="">Todos os status</option>
          {CRM_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={legalAreaFilter}
          onChange={(e) => setLegalAreaFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        >
          <option value="">Todas as áreas</option>
          {LEGAL_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        >
          <option value="">Todas as cidades</option>
          {uniqueCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonCards count={8} />
      ) : loadError ? (
        <p className="text-sm text-red-600">Não foi possível carregar os clientes. Tente recarregar a página.</p>
      ) : view === "kanban" ? (
        <KanbanBoard
          clients={clients}
          onStatusChange={handleStatusChange}
          onEdit={(c) => setFormClient(c)}
          onDelete={handleDelete}
        />
      ) : (
        <ClientTable clients={clients} onEdit={(c) => setFormClient(c)} onDelete={handleDelete} />
      )}

      {formClient !== undefined && (
        <ClientFormModal
          client={formClient}
          onClose={() => setFormClient(undefined)}
          onSaved={() => {
            setFormClient(undefined);
            load();
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            load();
          }}
        />
      )}
    </div>
  );
}
