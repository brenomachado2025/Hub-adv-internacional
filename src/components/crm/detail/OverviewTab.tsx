"use client";

import { useEffect, useState } from "react";
import { formatDocument } from "@/lib/data/crm";
import type { CrmClient } from "@/components/crm/types";

type TeamMember = { id: string; name: string; email: string };

export function OverviewTab({ client, onUpdated }: { client: CrmClient; onUpdated: () => void }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        const owner: TeamMember[] = data.owner
          ? [{ id: data.owner.id, name: data.isOwner ? "Você" : data.owner.name, email: data.owner.email }]
          : [];
        const members: TeamMember[] = (data.members ?? []).map((m: TeamMember) => ({ id: m.id, name: m.name, email: m.email }));
        setMembers([...owner, ...members]);
      });
  }, []);

  const changeAssignee = async (assigneeId: string) => {
    setSaving(true);
    await fetch(`/api/crm/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: assigneeId || null }),
    });
    setSaving(false);
    onUpdated();
  };

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
      <div>
        <p className="text-xs text-neutral-500">Responsável</p>
        <select
          value={client.assigneeId ?? ""}
          onChange={(e) => changeAssignee(e.target.value)}
          disabled={saving}
          className="mt-1 px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        >
          <option value="">Sem responsável</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.email}
            </option>
          ))}
        </select>
      </div>
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-sm mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}
