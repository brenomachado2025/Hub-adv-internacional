"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";

type Deadline = { id: string; title: string; dueDate: string; status: string };
type CaseItem = {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  status: string;
  client: { id: string; fullName: string };
  deadlines: Deadline[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Ativo", color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
  CLOSED: { label: "Encerrado", color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500" },
  ARCHIVED: { label: "Arquivado", color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500" },
};

export function ProcessosList() {
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setCases(data.cases ?? []))
      .catch(() => setError("Não foi possível carregar os processos. Tente recarregar a página."));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!cases) return <SkeletonList rows={5} />;
  if (cases.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="Nenhum processo vinculado ainda"
        description={'Abra o perfil de um cliente no CRM e use a aba "Processos" para vincular o primeiro.'}
      />
    );
  }

  const withUpcomingDeadline = cases.filter((c) => c.deadlines.length > 0);

  return (
    <div className="space-y-6">
      {withUpcomingDeadline.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Prazos pendentes</h3>
          <div className="space-y-1.5">
            {withUpcomingDeadline.flatMap((c) =>
              c.deadlines.map((d) => (
                <Link
                  key={d.id}
                  href={`/crm/${c.client.id}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span>
                    {d.title} — {c.title} ({c.client.fullName})
                  </span>
                  <span className={d.status === "EXPIRED" ? "text-red-600 font-medium" : "text-amber-700 dark:text-amber-400"}>
                    {new Date(d.dueDate).toLocaleDateString("pt-BR")}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 px-3">Processo</th>
              <th className="py-2 px-3">Cliente</th>
              <th className="py-2 px-3">Nº CNJ</th>
              <th className="py-2 px-3">Tribunal</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Prazos pendentes</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 px-3 font-medium">
                  <Link href={`/crm/${c.client.id}`} className="hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="py-2 px-3">{c.client.fullName}</td>
                <td className="py-2 px-3">{c.caseNumber || "-"}</td>
                <td className="py-2 px-3">{c.court || "-"}</td>
                <td className="py-2 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABEL[c.status].color}`}>
                    {STATUS_LABEL[c.status].label}
                  </span>
                </td>
                <td className="py-2 px-3">{c.deadlines.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
