"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CURRENCIES } from "@/lib/data/jurisdictions";

type LineItem = { description: string; quantity: number; unitPrice: number };

export function NovaFaturaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feeCalculationId = searchParams.get("feeCalculationId");

  const [issuerName, setIssuerName] = useState("");
  const [issuerTaxId, setIssuerTaxId] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feeCalculationId) return;
    fetch(`/api/fees/${feeCalculationId}`)
      .then((res) => res.json())
      .then((data) => {
        const calc = data.calculation;
        if (!calc) return;
        setCurrency(calc.targetCurrency);
        setExchangeRate(String(calc.rate));
        setItems([
          {
            description: calc.description || `Honorário (convertido de ${calc.baseAmount} ${calc.baseCurrency})`,
            quantity: 1,
            unitPrice: calc.convertedAmount,
          },
        ]);
      });
  }, [feeCalculationId]);

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const total = subtotal * (1 + Number(taxRate) / 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuerName,
          issuerTaxId,
          issuerAddress,
          clientName,
          clientTaxId,
          clientAddress,
          currency,
          exchangeRate: Number(exchangeRate),
          taxRate: Number(taxRate),
          notes,
          issueDate,
          dueDate,
          feeCalculationId: feeCalculationId ?? undefined,
          items,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao criar fatura");
      }
      const data = await res.json();
      window.open(`/api/invoices/${data.invoice.id}/pdf`, "_blank");
      router.push("/faturas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">Nova Fatura</h2>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <h3 className="font-semibold text-sm">Emitente</h3>
            <input
              required
              placeholder="Nome / Razão social"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              placeholder="ID fiscal (CNPJ/EIN/VAT...)"
              value={issuerTaxId}
              onChange={(e) => setIssuerTaxId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              placeholder="Endereço"
              value={issuerAddress}
              onChange={(e) => setIssuerAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <h3 className="font-semibold text-sm">Cliente</h3>
            <input
              required
              placeholder="Nome / Razão social"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              placeholder="ID fiscal (CNPJ/EIN/VAT...)"
              value={clientTaxId}
              onChange={(e) => setClientTaxId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              placeholder="Endereço"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Moeda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Taxa de câmbio de referência</label>
            <input
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Imposto (%)</label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div />
          <div>
            <label className="text-xs text-neutral-500">Data de emissão</label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Vencimento</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Itens</h3>
            <button type="button" onClick={addItem} className="text-xs text-blue-600">
              + adicionar item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  required
                  placeholder="Descrição"
                  value={it.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  className="col-span-6 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Qtd."
                  value={it.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  className="col-span-2 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Preço unit."
                  value={it.unitPrice}
                  onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                  className="col-span-3 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  className="col-span-1 text-red-600 text-xs disabled:opacity-30"
                >
                  remover
                </button>
              </div>
            ))}
          </div>
          <div className="text-sm text-right mt-4 space-y-1">
            <div>
              Subtotal: {currency} {subtotal.toFixed(2)}
            </div>
            <div className="font-semibold">
              Total: {currency} {total.toFixed(2)}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Gerando..." : "Emitir fatura e gerar PDF"}
        </button>
      </form>
    </div>
  );
}
