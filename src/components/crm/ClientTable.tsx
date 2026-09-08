"use client";

import Link from "next/link";
import { crmStatusLabel, formatDocument } from "@/lib/data/crm";
import type { CrmClient } from "./types";

type Props = {
  clients: CrmClient[];
  onEdit: (client: CrmClient) => void;
  onDelete: (id: string) => void;
};

export function ClientTable({ clients, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
            <th className="py-2 px-3">Nome</th>
            <th className="py-2 px-3">Documento</th>
            <th className="py-2 px-3">Área jurídica</th>
            <th className="py-2 px-3">Empresa</th>
            <th className="py-2 px-3">Cidade</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Cadastro</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-neutral-500">
                Nenhum cliente encontrado.
              </td>
            </tr>
          )}
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2 px-3 font-medium">
                <Link href={`/crm/${c.id}`} className="hover:underline">
                  {c.fullName}
                </Link>
              </td>
              <td className="py-2 px-3">
                {c.documentType}: {formatDocument(c.documentType, c.documentNumber) || "-"}
              </td>
              <td className="py-2 px-3">{c.legalArea}</td>
              <td className="py-2 px-3">{c.companyName || "-"}</td>
              <td className="py-2 px-3">{c.city || "-"}</td>
              <td className="py-2 px-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {crmStatusLabel(c.status)}
                </span>
              </td>
              <td className="py-2 px-3 whitespace-nowrap">
                {new Date(c.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td className="py-2 px-3 whitespace-nowrap">
                <button onClick={() => onEdit(c)} className="text-slate-700 dark:text-slate-300 text-xs mr-3">
                  Editar
                </button>
                <button onClick={() => onDelete(c.id)} className="text-red-600 text-xs">
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
