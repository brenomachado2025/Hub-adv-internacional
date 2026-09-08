"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

type Installment = {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
  paidAmount: number | null;
};
type Contract = {
  id: string;
  description: string;
  totalAmount: number;
  currency: string;
  status: string;
  case: { id: string; title: string } | null;
  installments: Installment[];
};
type CaseOption = { id: string; title: string };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-neutral-500" },
  PAID: { label: "Pago", color: "text-emerald-600" },
  OVERDUE: { label: "Em atraso", color: "text-red-600" },
  CANCELLED: { label: "Cancelada", color: "text-neutral-400 line-through" },
};

export function FinanceTab({ clientId }: { clientId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [caseId, setCaseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/clients/${clientId}/contracts`);
    const data = await res.json();
    setContracts(data.contracts ?? []);
  }, [clientId]);

  useEffect(() => {
    load();
    fetch(`/api/crm/clients/${clientId}/cases`)
      .then((res) => res.json())
      .then((data) => setCases((data.cases ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))));
  }, [clientId, load]);

  const createContract = async () => {
    const amount = parseFloat(totalAmount.replace(",", "."));
    if (!amount || amount <= 0 || !firstDueDate) {
      setError("Informe o valor total e a data da primeira parcela.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/crm/clients/${clientId}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        totalAmount: amount,
        currency,
        installmentsCount: parseInt(installmentsCount, 10) || 1,
        firstDueDate,
        caseId: caseId || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao fechar contrato.");
    } else {
      setDescription("");
      setTotalAmount("");
      setInstallmentsCount("1");
      setFirstDueDate("");
      setCaseId("");
      setShowNew(false);
      load();
    }
    setSaving(false);
  };

  const registerPayment = async (contract: Contract, installment: Installment) => {
    await fetch(`/api/crm/clients/${clientId}/contracts/${contract.id}/installments/${installment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    load();
  };

  const generateInvoice = async (contract: Contract, installment: Installment) => {
    const res = await fetch(
      `/api/crm/clients/${clientId}/contracts/${contract.id}/installments/${installment.id}/invoice`,
      { method: "POST" }
    );
    const data = await res.json();
    if (data.invoice) window.open(`/api/invoices/${data.invoice.id}/pdf`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Contratos de honorários</h4>
          <button onClick={() => setShowNew((v) => !v)} className="text-xs text-blue-600 hover:underline">
            {showNew ? "Cancelar" : "+ Fechar contrato de honorários"}
          </button>
        </div>

        {showNew && (
          <div className="space-y-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (ex.: Honorários — ação trabalhista)"
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <div className="grid sm:grid-cols-4 gap-2">
              <input
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Valor total"
                inputMode="decimal"
                className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              >
                <option value="BRL">BRL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <input
                type="number"
                min={1}
                max={60}
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
                placeholder="Nº de parcelas"
                className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <input
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
            </div>
            {cases.length > 0 && (
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              >
                <option value="">Sem processo vinculado</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={createContract}
              disabled={saving}
              className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
            >
              Fechar contrato
            </button>
          </div>
        )}
      </div>

      {contracts.length === 0 && <p className="text-sm text-neutral-500">Nenhum contrato de honorários ainda.</p>}

      {contracts.map((c) => {
        const open = c.installments.filter((i) => i.status === "PENDING" || i.status === "OVERDUE");
        const outstanding = open.reduce((sum, i) => sum + i.amount, 0);
        return (
          <div key={c.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <button
              onClick={() => setExpanded((e) => (e === c.id ? null : c.id))}
              className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="text-left">
                <p className="text-sm font-medium">
                  {c.description || "Contrato de honorários"} — {c.currency} {c.totalAmount.toFixed(2)}
                  {c.case && <span className="text-neutral-400 font-normal"> · {c.case.title}</span>}
                </p>
                <p className="text-xs text-neutral-500">
                  Saldo em aberto: {c.currency} {outstanding.toFixed(2)} · {c.installments.length} parcela(s)
                </p>
              </div>
              <ChevronDown size={18} className={`transition-transform ${expanded === c.id ? "rotate-180" : ""}`} />
            </button>
            {expanded === c.id && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 space-y-2 bg-neutral-50 dark:bg-neutral-950">
                {c.installments.map((i) => {
                  const s = STATUS_LABEL[i.status];
                  return (
                    <div
                      key={i.id}
                      className="flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm"
                    >
                      <div>
                        <p>
                          Parcela {i.number} — {c.currency} {i.amount.toFixed(2)}
                        </p>
                        <p className={`text-xs ${s.color}`}>
                          {s.label} · vencimento {new Date(i.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {i.status !== "PAID" && i.status !== "CANCELLED" && (
                          <button
                            onClick={() => registerPayment(c, i)}
                            className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700"
                          >
                            Registrar pagamento
                          </button>
                        )}
                        {i.status === "PAID" && (
                          <a
                            href={`/api/crm/clients/${clientId}/contracts/${c.id}/installments/${i.id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Emitir recibo
                          </a>
                        )}
                        <button onClick={() => generateInvoice(c, i)} className="text-xs text-blue-600 hover:underline">
                          Gerar fatura
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
