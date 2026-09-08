import { formatDocument } from "@/lib/data/crm";
import type { CrmClient } from "@/components/crm/types";

export function OverviewTab({ client }: { client: CrmClient }) {
  const fields: [string, string][] = [
    ["Nome completo", client.fullName],
    ["Documento", `${client.documentType}: ${formatDocument(client.documentType, client.documentNumber) || "-"}`],
    ["Área jurídica", client.legalArea],
    ["Empresa vinculada", client.companyName || "-"],
    ["Cidade", client.city || "-"],
    ["WhatsApp", client.phone || "-"],
    ["E-mail", client.email || "-"],
    ["Cadastrado em", new Date(client.createdAt).toLocaleString("pt-BR")],
    ["Última atualização", new Date(client.updatedAt).toLocaleString("pt-BR")],
  ];

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-5 grid sm:grid-cols-2 gap-4">
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-sm mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}
