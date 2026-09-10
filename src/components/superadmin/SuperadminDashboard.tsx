"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

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
};

export function SuperadminDashboard() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/superadmin/accounts")
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts ?? []));
  }, []);

  const logout = async () => {
    await fetch("/api/superadmin/logout", { method: "POST" });
    router.push("/superadmin/login");
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
    <div className="min-h-screen bg-[#0a0f1a] text-slate-200 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Painel Super-Admin</h1>
            <p className="text-sm text-slate-400 mt-1">
              {accounts ? `${accounts.length} conta(s) no Internacional Hub` : "Carregando..."}
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 text-sm hover:bg-white/5"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full max-w-md px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm"
        />

        {!accounts ? (
          <p className="text-sm text-slate-400">Carregando contas...</p>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">
                Contas principais (donas de workspace)
              </h2>
              <div className="rounded-lg border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
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
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-2 px-3">
                          <p className="font-medium">{a.name || "-"}</p>
                          <p className="text-xs text-slate-400">{a.email}</p>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-400">
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
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <Link href={`/superadmin/${a.id}`} className="text-blue-400 hover:underline text-xs">
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {owners.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500">
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
                <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2">Membros de equipe</h2>
                <div className="rounded-lg border border-white/10 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-white/10">
                        <th className="py-2 px-3">Conta</th>
                        <th className="py-2 px-3">Membro da equipe de</th>
                        <th className="py-2 px-3">Cadastro</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((a) => (
                        <tr key={a.id} className="border-b border-white/5">
                          <td className="py-2 px-3">
                            <p className="font-medium">{a.name || "-"}</p>
                            <p className="text-xs text-slate-400">{a.email}</p>
                          </td>
                          <td className="py-2 px-3 text-slate-400">{a.teamOwnerEmail}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                            {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2 px-3">
                            <Link href={`/superadmin/${a.id}`} className="text-blue-400 hover:underline text-xs">
                              Ver detalhes
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
    </div>
  );
}
