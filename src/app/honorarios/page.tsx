"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NORTH_AMERICA_COUNTRIES, CURRENCIES } from "@/lib/data/jurisdictions";
import { formatCurrency } from "@/lib/format";

type FeeCalculation = {
  id: string;
  description: string;
  baseAmount: number;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  convertedAmount: number;
  rateDate: string;
  jurisdictionCountry: string;
  jurisdictionState: string;
  createdAt: string;
};

export default function HonorariosPage() {
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("1000");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("BRL");
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<FeeCalculation | null>(null);
  const [history, setHistory] = useState<FeeCalculation[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const selectedCountry = NORTH_AMERICA_COUNTRIES.find((c) => c.code === country);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/fees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.calculations ?? []);
      setHistoryError(null);
    } catch {
      setHistoryError("Não foi possível carregar o histórico. Tente recarregar a página.");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          baseAmount: Number(baseAmount),
          baseCurrency,
          targetCurrency,
          jurisdictionCountry: country,
          jurisdictionState: state,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao calcular");
      }
      const data = await res.json();
      setLastResult(data.calculation);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Calculadora de Honorários Multi-Moeda</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Cotação automática de câmbio e histórico para faturamento internacional, com foco na América do Norte.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-neutral-500">Descrição (opcional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            placeholder="Ex.: Honorário de due diligence - Cliente X"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Valor base</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Moeda base</label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Converter para</label>
          <select
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">País (jurisdição)</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState("");
              }}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              {NORTH_AMERICA_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Estado / Província</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={!selectedCountry?.states}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm disabled:opacity-40"
            >
              <option value="">-</option>
              {selectedCountry?.states?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Calculando..." : "Calcular"}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {lastResult && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-4">
          <p className="text-sm">
            <strong>{formatCurrency(lastResult.baseAmount, lastResult.baseCurrency)}</strong> equivale a{" "}
            <strong>{formatCurrency(lastResult.convertedAmount, lastResult.targetCurrency)}</strong> (taxa{" "}
            {lastResult.rate} em {lastResult.rateDate})
          </p>
          <Link
            href={`/faturas/nova?feeCalculationId=${lastResult.id}`}
            className="text-xs text-blue-600 mt-2 inline-block"
          >
            Usar este cálculo para gerar uma fatura →
          </Link>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <h3 className="font-semibold p-4 pb-0">Histórico de câmbio para faturamento</h3>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 px-3">Data</th>
              <th className="py-2 px-3">Descrição</th>
              <th className="py-2 px-3">Base</th>
              <th className="py-2 px-3">Convertido</th>
              <th className="py-2 px-3">Taxa</th>
              <th className="py-2 px-3">Jurisdição</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {historyError && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-red-600">
                  {historyError}
                </td>
              </tr>
            )}
            {!historyError && history.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-neutral-500">
                  Nenhum cálculo realizado ainda.
                </td>
              </tr>
            )}
            {history.map((h) => (
              <tr key={h.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 px-3 whitespace-nowrap">{new Date(h.createdAt).toLocaleString("pt-BR")}</td>
                <td className="py-2 px-3">{h.description || "-"}</td>
                <td className="py-2 px-3">{formatCurrency(h.baseAmount, h.baseCurrency)}</td>
                <td className="py-2 px-3">{formatCurrency(h.convertedAmount, h.targetCurrency)}</td>
                <td className="py-2 px-3">
                  {h.rate} ({h.rateDate})
                </td>
                <td className="py-2 px-3">
                  {h.jurisdictionCountry}
                  {h.jurisdictionState ? ` / ${h.jurisdictionState}` : ""}
                </td>
                <td className="py-2 px-3">
                  <Link href={`/faturas/nova?feeCalculationId=${h.id}`} className="text-blue-600 text-xs">
                    Faturar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
