"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { SuperadminShell } from "./SuperadminShell";

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
  suspended: boolean;
  suspendedAt: string | null;
};

export function SuperadminAccountDetail({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/superadmin/accounts/${accountId}`)
      .then((res) => res.json())
      .then((data) => setAccount(data.account));
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSuspend = async () => {
    if (!account) return;
    const next = !account.suspended;
    if (next && !confirm(`Suspender o acesso de ${account.email}? Ela não vai conseguir mais fazer login.`)) return;
    await fetch(`/api/superadmin/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: next }),
    });
    load();
  };

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
      <SuperadminShell>
        <p className="text-sm text-zinc-400">Carregando...</p>
      </SuperadminShell>
    );
  }

  return (
    <SuperadminShell>
      <div className="max-w-3xl space-y-6">
        <Link href="/superadmin" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {account.name || account.email}
              {account.suspended && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900">
                  suspensa
                </span>
              )}
            </h1>
            <p className="text-sm text-zinc-400">{account.email}</p>
            <p className="text-xs text-zinc-500 mt-1">
              Cadastrado em {new Date(account.createdAt).toLocaleString("pt-BR")} · role: {account.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSuspend}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${
                account.suspended
                  ? "border-emerald-900 text-emerald-400 hover:bg-emerald-950"
                  : "border-red-900 text-red-500 hover:bg-red-950"
              }`}
            >
              {account.suspended ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              {account.suspended ? "Reativar conta" : "Suspender conta"}
            </button>
            <button
              onClick={remove}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-900 text-red-400 text-sm hover:bg-red-950 disabled:opacity-50"
            >
              <Trash2 size={14} /> {deleting ? "Excluindo..." : "Excluir conta"}
            </button>
          </div>
        </div>

        {account.isTeamMember && account.teamOwner && (
          <div className="rounded-lg border border-red-950 p-4 text-sm">
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
          <div className="rounded-lg border border-red-950 p-4 text-sm">
            <p className="font-semibold mb-1">WhatsApp</p>
            <p>
              Status: {account.whatsapp.status} {account.whatsapp.phoneNumber && `· ${account.whatsapp.phoneNumber}`}
            </p>
          </div>
        )}

        {account.ownedTeamMembers.length > 0 && (
          <div className="rounded-lg border border-red-950 p-4">
            <p className="font-semibold text-sm mb-2">Membros da equipe desta conta</p>
            <ul className="space-y-1 text-sm">
              {account.ownedTeamMembers.map((m) => (
                <li key={m.email}>
                  {m.name || m.email} <span className="text-zinc-500 text-xs">({m.email})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SuperadminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-red-950 p-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
    </div>
  );
}
