"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

type AccountDetail = {
  id: string;
  email: string;
  name: string;
  title: string;
  role: string;
  createdAt: string;
  counts: {
    crmClients: number;
    legalCases: number;
    invoices: number;
    feeContracts: number;
    notifications: number;
    auditLogs: number;
  };
  isTeamMember: boolean;
  teamOwner: { email: string; name: string } | null;
  ownedTeamMembers: { email: string; name: string }[];
  whatsapp: { status: string; phoneNumber: string } | null;
};

export function SuperadminAccountDetail({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/superadmin/accounts/${accountId}`)
      .then((res) => res.json())
      .then((data) => setAccount(data.account));
  }, [accountId]);

  const remove = async () => {
    if (!account) return;
    if (
      !confirm(
        `Excluir a conta ${account.email}? Isso apaga TODOS os dados dela (clientes, processos, faturas, conversas). Não pode ser desfeito.`
      )
    )
      return;
    setDeleting(true);
    await fetch(`/api/superadmin/accounts/${accountId}`, { method: "DELETE" });
    router.push("/superadmin");
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-slate-200 p-10">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-200 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/superadmin" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{account.name || account.email}</h1>
            <p className="text-sm text-slate-400">{account.email}</p>
            <p className="text-xs text-slate-500 mt-1">
              Cadastrado em {new Date(account.createdAt).toLocaleString("pt-BR")} · role: {account.role}
            </p>
          </div>
          <button
            onClick={remove}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-900 text-red-400 text-sm hover:bg-red-950 disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? "Excluindo..." : "Excluir conta"}
          </button>
        </div>

        {account.isTeamMember && account.teamOwner && (
          <div className="rounded-lg border border-white/10 p-4 text-sm">
            Membro da equipe de <strong>{account.teamOwner.name || account.teamOwner.email}</strong>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Clientes (CRM)" value={account.counts.crmClients} />
          <Stat label="Processos" value={account.counts.legalCases} />
          <Stat label="Faturas" value={account.counts.invoices} />
          <Stat label="Contratos de honorários" value={account.counts.feeContracts} />
          <Stat label="Notificações" value={account.counts.notifications} />
          <Stat label="Registros de auditoria" value={account.counts.auditLogs} />
        </div>

        {account.whatsapp && (
          <div className="rounded-lg border border-white/10 p-4 text-sm">
            <p className="font-semibold mb-1">WhatsApp</p>
            <p>
              Status: {account.whatsapp.status} {account.whatsapp.phoneNumber && `· ${account.whatsapp.phoneNumber}`}
            </p>
          </div>
        )}

        {account.ownedTeamMembers.length > 0 && (
          <div className="rounded-lg border border-white/10 p-4">
            <p className="font-semibold text-sm mb-2">Membros da equipe desta conta</p>
            <ul className="space-y-1 text-sm">
              {account.ownedTeamMembers.map((m) => (
                <li key={m.email}>
                  {m.name || m.email} <span className="text-slate-500 text-xs">({m.email})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
