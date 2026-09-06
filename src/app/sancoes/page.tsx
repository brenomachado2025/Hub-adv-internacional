"use client";

import { useEffect, useState, useCallback } from "react";

type SanctionEntry = {
  id: string;
  source: string;
  name: string;
  aliases: string;
  entityType: string;
  programs: string;
  countries: string;
  listedDate: string;
};

type ChangeEvent = {
  id: string;
  source: string;
  entryName: string;
  changeType: string;
  details: string;
  createdAt: string;
};

type SyncRun = {
  id: string;
  source: string;
  status: string;
  message: string;
  entriesCount: number;
  changesCount: number;
  startedAt: string;
};

const SOURCE_LABEL: Record<string, string> = {
  OFAC: "OFAC (EUA)",
  EU: "União Europeia",
  UN: "ONU",
};

const CHANGE_LABEL: Record<string, { label: string; className: string }> = {
  ADDED: { label: "Incluído", className: "bg-emerald-100 text-emerald-700" },
  REMOVED: { label: "Removido", className: "bg-neutral-200 text-neutral-700" },
  MODIFIED: { label: "Alterado", className: "bg-amber-100 text-amber-700" },
};

export default function SancoesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SanctionEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [totalActive, setTotalActive] = useState(0);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/sanctions/sync");
    const data = await res.json();
    setRuns(data.runs ?? []);
    setTotalActive(data.totalActive ?? 0);
  }, []);

  const loadChanges = useCallback(async () => {
    const res = await fetch("/api/sanctions/changes");
    const data = await res.json();
    setChanges(data.changes ?? []);
  }, []);

  useEffect(() => {
    loadStatus();
    loadChanges();
  }, [loadStatus, loadChanges]);

  const runSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/sanctions/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sanctions/sync", { method: "POST" });
      const data = await res.json();
      const summary = (data.results ?? [])
        .map((r: { source: string; status: string; changesCount?: number; message?: string }) =>
          r.status === "SUCCESS"
            ? `${SOURCE_LABEL[r.source] ?? r.source}: ${r.changesCount} mudança(s)`
            : `${SOURCE_LABEL[r.source] ?? r.source}: erro (${r.message})`
        )
        .join(" · ");
      setSyncMessage(summary);
      await Promise.all([loadStatus(), loadChanges()]);
    } catch {
      setSyncMessage("Falha ao sincronizar. Verifique a conexão de rede.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sanções Internacionais</h2>
          <p className="text-neutral-500 text-sm mt-1">
            Busca de due diligence nas listas consolidadas da ONU, OFAC (EUA) e União Europeia — {totalActive} entradas
            ativas.
          </p>
        </div>
        <button
          onClick={runSync}
          disabled={syncing}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </button>
      </div>

      {syncMessage && (
        <div className="text-sm rounded-md border border-neutral-200 dark:border-neutral-800 p-3">{syncMessage}</div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <h3 className="font-semibold mb-3">Buscar entidade / pessoa para due diligence</h3>
        <input
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Digite um nome para buscar nas listas de sanção..."
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
        <p className="text-xs text-neutral-400 mt-1">Toda busca é registrada no histórico de auditoria.</p>

        {searching && <p className="text-sm text-neutral-500 mt-3">Buscando...</p>}

        {!searching && query && results.length === 0 && (
          <p className="text-sm text-neutral-500 mt-3">Nenhum resultado encontrado.</p>
        )}

        {results.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Fonte</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Programas / Jurisdição</th>
                  <th className="py-2 pr-4">Países</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-4">{SOURCE_LABEL[r.source] ?? r.source}</td>
                    <td className="py-2 pr-4">{r.entityType}</td>
                    <td className="py-2 pr-4">{r.programs || "-"}</td>
                    <td className="py-2 pr-4">{r.countries || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold mb-3">Mudanças recentes de jurisdição</h3>
          {changes.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma mudança registrada ainda.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {changes.map((c) => (
                <li key={c.id} className="text-sm border-b border-neutral-100 dark:border-neutral-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${CHANGE_LABEL[c.changeType]?.className ?? ""}`}
                    >
                      {CHANGE_LABEL[c.changeType]?.label ?? c.changeType}
                    </span>
                    <span className="font-medium">{c.entryName}</span>
                    <span className="text-neutral-400 text-xs">({SOURCE_LABEL[c.source] ?? c.source})</span>
                  </div>
                  <p className="text-neutral-500 text-xs mt-1">{c.details}</p>
                  <p className="text-neutral-400 text-xs">{new Date(c.createdAt).toLocaleString("pt-BR")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold mb-3">Histórico de sincronizações</h3>
          {runs.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma sincronização executada ainda.</p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {runs.map((r) => (
                <li key={r.id} className="text-sm flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2">
                  <span>
                    {SOURCE_LABEL[r.source] ?? r.source} — {r.status === "SUCCESS" ? `${r.entriesCount} entradas, ${r.changesCount} mudanças` : `erro: ${r.message}`}
                  </span>
                  <span className="text-neutral-400 text-xs">{new Date(r.startedAt).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
