"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Contact, Scale, Receipt, X, type LucideIcon } from "lucide-react";

type ClientResult = { id: string; label: string; sublabel: string };
type CaseResult = { id: string; clientId: string; label: string; sublabel: string };
type InvoiceResult = { id: string; label: string; sublabel: string };

type Results = { clients: ClientResult[]; cases: CaseResult[]; invoices: InvoiceResult[] };

const EMPTY: Results = { clients: [], cases: [], invoices: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openHandler = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("hub:open-search", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("hub:open-search", openHandler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(EMPTY);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const requestId = ++requestIdRef.current;
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? res.json() : EMPTY))
        .then((data) => {
          // Ignora respostas de buscas anteriores que chegaram fora de ordem -
          // sem isso, uma resposta lenta de uma letra digitada antes podia
          // sobrescrever o resultado (já correto) de uma busca mais recente.
          if (requestId === requestIdRef.current) setResults(data);
        })
        .catch(() => {
          if (requestId === requestIdRef.current) setResults(EMPTY);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  const hasResults = results.clients.length + results.cases.length + results.invoices.length > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-24 px-4" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, processo ou fatura..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} aria-label="Fechar busca" className="text-neutral-400 hover:text-neutral-600 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 && (
            <p className="text-xs text-neutral-400 px-4 py-6 text-center">Digite ao menos 2 letras para buscar.</p>
          )}
          {query.trim().length >= 2 && !loading && !hasResults && (
            <p className="text-sm text-neutral-500 px-4 py-6 text-center">Nenhum resultado para "{query}".</p>
          )}

          {results.clients.length > 0 && (
            <ResultGroup label="Clientes">
              {results.clients.map((c) => (
                <ResultRow key={c.id} icon={Contact} label={c.label} sublabel={c.sublabel} onClick={() => go(`/crm/${c.id}`)} />
              ))}
            </ResultGroup>
          )}

          {results.cases.length > 0 && (
            <ResultGroup label="Processos">
              {results.cases.map((c) => (
                <ResultRow key={c.id} icon={Scale} label={c.label} sublabel={c.sublabel} onClick={() => go(`/crm/${c.clientId}`)} />
              ))}
            </ResultGroup>
          )}

          {results.invoices.length > 0 && (
            <ResultGroup label="Faturas">
              {results.invoices.map((i) => (
                <ResultRow
                  key={i.id}
                  icon={Receipt}
                  label={i.label}
                  sublabel={i.sublabel}
                  onClick={() => {
                    setOpen(false);
                    window.open(`/api/invoices/${i.id}/pdf`, "_blank");
                  }}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <p className="px-4 py-1 text-[11px] font-semibold uppercase text-neutral-400">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
    >
      <Icon size={16} className="text-neutral-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm truncate">{label}</p>
        {sublabel && <p className="text-xs text-neutral-400 truncate">{sublabel}</p>}
      </div>
    </button>
  );
}
