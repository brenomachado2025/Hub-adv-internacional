"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type Report = {
  period: string;
  currentLabel: string;
  previousLabel: string;
  newClients: { current: number; previous: number; changePct: number | null };
  conversionRate: { current: number; previous: number; changePct: number | null };
  revenue: { currency: string; current: number; previous: number; changePct: number | null }[];
  revenueByArea: { area: string; currency: string; amount: number }[];
};

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-neutral-400">novo</span>;
  }
  const positive = pct >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? "+" : ""}
      {pct}%
    </span>
  );
}

export function ReportsView() {
  const [period, setPeriod] = useState<"month" | "quarter">("month");
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    setReport(null);
    fetch(`/api/reports/performance?period=${period}`)
      .then((res) => res.json())
      .then((data) => setReport(data.report));
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden text-sm">
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1.5 ${period === "month" ? "bg-slate-800 text-white" : ""}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod("quarter")}
            className={`px-3 py-1.5 ${period === "quarter" ? "bg-slate-800 text-white" : ""}`}
          >
            Trimestral
          </button>
        </div>
        <a
          href={`/api/reports/performance/pdf?period=${period}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm"
        >
          <Download size={16} /> Exportar PDF
        </a>
      </div>

      {!report ? (
        <p className="text-sm text-neutral-500">Carregando...</p>
      ) : (
        <>
          <p className="text-xs text-neutral-500">
            Período atual: <strong>{report.currentLabel}</strong> · comparado a{" "}
            <strong>{report.previousLabel}</strong>
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-xs text-neutral-500">Novos clientes</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-blue-600">{report.newClients.current}</span>
                <ChangeBadge pct={report.newClients.changePct} />
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <p className="text-xs text-neutral-500">Taxa de conversão do funil</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-emerald-600">{report.conversionRate.current}%</span>
                <ChangeBadge pct={report.conversionRate.changePct} />
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Clientes cadastrados no período que já estão com status "Cliente finalizado"
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <h3 className="text-sm font-semibold mb-3">Faturamento total no período</h3>
            {report.revenue.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhuma fatura emitida no período.</p>
            ) : (
              <div className="space-y-2">
                {report.revenue.map((r) => (
                  <div key={r.currency} className="flex items-center justify-between text-sm">
                    <span>{r.currency}</span>
                    <span className="flex items-center gap-2">
                      <strong>{r.current.toFixed(2)}</strong>
                      <ChangeBadge pct={r.changePct} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <h3 className="text-sm font-semibold mb-3">Faturamento por área jurídica</h3>
            {report.revenueByArea.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhuma fatura vinculada a cliente/área no período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                    <th className="py-1.5">Área</th>
                    <th className="py-1.5">Moeda</th>
                    <th className="py-1.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.revenueByArea.map((r, i) => (
                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-900">
                      <td className="py-1.5">{r.area}</td>
                      <td className="py-1.5">{r.currency}</td>
                      <td className="py-1.5 text-right">{r.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
