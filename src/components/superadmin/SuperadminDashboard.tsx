"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SuperadminShell } from "./SuperadminShell";

type Account = {
  id: string;
  email: string;
  name: string;
  title: string;
  role: string;
  createdAt: string;
  isTeamMember: boolean;
  teamOwnerEmail: string | null;
  teamMembersCount: number;
  crmClientsCount: number;
  legalCasesCount: number;
  invoicesCount: number;
  feeContractsCount: number;
  whatsappStatus: string | null;
  whatsappPhone: string | null;
  suspended: boolean;
};

export function SuperadminDashboard() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    fetch("/api/superadmin/accounts")
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSuspend = async (account: Account) => {
    const next = !account.suspended;
    if (next && !confirm(`Suspender o acesso de ${account.email}? Ela não vai conseguir mais fazer login.`)) return;
    await fetch(`/api/superadmin/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: next }),
    });
    load();
  };

  const filtered = (accounts ?? []).filter(
    (a) =>
      !search.trim() ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const owners = filtered.filter((a) => !a.isTeamMember);
  const members = filtered.filter((a) => a.isTeamMember);

  return (
    <SuperadminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">Contas do Hub</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {accounts ? `${accounts.length} conta(s) no total` : "Carregando..."}
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full max-w-md px-3 py-2 rounded-md border border-red-950 bg-zinc-950 text-sm placeholder:text-zinc-600"
        />

        {!accounts ? (
          <p className="text-sm text-zinc-400">Carregando contas...</p>
        ) : (
          <>
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-2">
                Contas principais (donas de workspace)
              </h3>
              <div className="rounded-lg border border-red-950 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 border-b border-red-950">
                      <th className="py-2 px-3">Conta</th>
                      <th className="py-2 px-3">Cadastro</th>
                      <th className="py-2 px-3">Equipe</th>
                      <th className="py-2 px-3">Clientes</th>
                      <th className="py-2 px-3">Processos</th>
                      <th className="py-2 px-3">Faturas</th>
                      <th className="py-2 px-3">WhatsApp</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {owners.map((a) => (
                      <tr key={a.id} className="border-b border-zinc-900">
                        <td className="py-2 px-3">
                          <p className="font-medium flex items-center gap-2">
                            {a.name || "-"}
                            {a.suspended && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900">
                                suspensa
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{a.email}</p>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-zinc-500">
                          {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2 px-3">{a.teamMembersCount > 0 ? `${a.teamMembersCount} membro(s)` : "-"}</td>
                        <td className="py-2 px-3">{a.crmClientsCount}</td>
                        <td className="py-2 px-3">{a.legalCasesCount}</td>
                        <td className="py-2 px-3">{a.invoicesCount}</td>
                        <td className="py-2 px-3">
                          {a.whatsappStatus === "CONNECTED" ? (
                            <span className="text-emerald-400">Conectado</span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleSuspend(a)}
                            className={`text-xs mr-3 hover:underline ${a.suspended ? "text-emerald-400" : "text-red-500"}`}
                          >
                            {a.suspended ? "Reativar" : "Suspender"}
                          </button>
                          <Link href={`/superadmin/${a.id}`} className="text-red-500 hover:underline text-xs">
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {owners.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-zinc-600">
                          Nenhuma conta encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {members.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Membros de equipe</h3>
                <div className="rounded-lg border border-red-950 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-red-950">
                        <th className="py-2 px-3">Conta</th>
                        <th className="py-2 px-3">Membro da equipe de</th>
                        <th className="py-2 px-3">Cadastro</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((a) => (
                        <tr key={a.id} className="border-b border-zinc-900">
                          <td className="py-2 px-3">
                            <p className="font-medium">{a.name || "-"}</p>
                            <p className="text-xs text-zinc-500">{a.email}</p>
                          </td>
                          <td className="py-2 px-3 text-zinc-400">{a.teamOwnerEmail}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-zinc-500">
                            {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2 px-3">
                            <Link href={`/superadmin/${a.id}`} className="text-red-500 hover:underline text-xs">
                              Detalhes
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </SuperadminShell>
  );
}
