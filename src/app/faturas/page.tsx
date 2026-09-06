"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InvoiceItem = { id: string; description: string; quantity: number; unitPrice: number };
type Invoice = {
  id: string;
  number: string;
  clientName: string;
  currency: string;
  status: string;
  issueDate: string;
  taxRate: number;
  items: InvoiceItem[];
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ISSUED: "Emitida",
  PAID: "Paga",
};

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.invoices ?? []);
        setLoading(false);
      });
  }, []);

  const totalOf = (inv: Invoice) => {
    const subtotal = inv.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    return subtotal * (1 + inv.taxRate / 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Faturas</h2>
          <p className="text-neutral-500 text-sm mt-1">Emissão de faturas em formato aceito internacionalmente.</p>
        </div>
        <Link href="/faturas/nova" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">
          Nova fatura
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-2 px-3">Número</th>
              <th className="py-2 px-3">Cliente</th>
              <th className="py-2 px-3">Data de emissão</th>
              <th className="py-2 px-3">Total</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-neutral-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-neutral-500">
                  Nenhuma fatura emitida ainda.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 px-3 font-medium">{inv.number}</td>
                <td className="py-2 px-3">{inv.clientName}</td>
                <td className="py-2 px-3">{inv.issueDate}</td>
                <td className="py-2 px-3">
                  {inv.currency} {totalOf(inv).toFixed(2)}
                </td>
                <td className="py-2 px-3">{STATUS_LABEL[inv.status] ?? inv.status}</td>
                <td className="py-2 px-3">
                  <a
                    href={`/api/invoices/${inv.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-xs"
                  >
                    Ver PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
