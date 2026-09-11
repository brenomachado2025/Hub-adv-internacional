"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Trash2 } from "lucide-react";

type TeamData = {
  isOwner: boolean;
  team: { id: string; name: string } | null;
  owner: { name: string; email: string } | null;
  members: { id: string; name: string; email: string; joinedAt: string; canViewFinance: boolean }[];
  invites: { id: string; email: string; code: string; createdAt: string }[];
};

export function TeamPanel() {
  const [data, setData] = useState<TeamData | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteInfo, setInviteInfo] = useState("");
  const [code, setCode] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const [acceptOk, setAcceptOk] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    setInviting(true);
    setInviteError("");
    setInviteInfo("");
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) {
      setInviteError(json.error ?? "Não foi possível convidar.");
    } else {
      setInviteInfo(
        json.notified
          ? "Convite enviado — a pessoa já foi notificada dentro do Hub."
          : "Convite criado. Essa pessoa ainda não tem conta no Hub: envie o código a ela por fora (WhatsApp, e-mail etc.) ou peça para se cadastrar com esse e-mail — ao entrar, ela verá o convite na Central de Notificações."
      );
      setEmail("");
      load();
    }
    setInviting(false);
  };

  const revoke = async (id: string) => {
    await fetch(`/api/team/invite/${id}`, { method: "DELETE" });
    load();
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remover este membro da equipe? Ele perderá acesso aos dados compartilhados.")) return;
    await fetch(`/api/team/members/${id}`, { method: "DELETE" });
    load();
  };

  const toggleFinanceAccess = async (id: string, canViewFinance: boolean) => {
    await fetch(`/api/team/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canViewFinance }),
    });
    load();
  };

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const acceptInvite = async () => {
    setAccepting(true);
    setAcceptError("");
    const res = await fetch("/api/team/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    if (!res.ok) {
      setAcceptError(json.error ?? "Não foi possível entrar na equipe.");
    } else {
      setAcceptOk(true);
      setCode("");
      load();
    }
    setAccepting(false);
  };

  if (!data) return <p className="text-sm text-neutral-500">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Equipes</h3>
      <p className="text-xs text-neutral-500 max-w-lg -mt-4">
        Convide colegas por e-mail para compartilhar toda a conta — mesmos clientes, conversas de WhatsApp e faturas.
      </p>

      {!data.isOwner && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 text-sm">
          Você faz parte da equipe de <strong>{data.owner?.name || data.owner?.email}</strong>.
        </div>
      )}

      {data.isOwner && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
          <h4 className="text-sm font-semibold">{data.team?.name ?? "Convidar para a equipe"}</h4>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <button
              onClick={invite}
              disabled={inviting || !email.trim()}
              className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
            >
              Convidar
            </button>
          </div>
          {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
          {inviteInfo && <p className="text-xs text-emerald-600">{inviteInfo}</p>}

          {data.invites.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-neutral-500 mb-2">Convites pendentes</p>
              <ul className="space-y-2">
                {data.invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm">{inv.email}</p>
                      <p className="text-xs font-mono text-neutral-500">{inv.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copy(inv.id, inv.code)}
                        className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                        title="Copiar código"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => revoke(inv.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                        title="Revogar convite"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {copiedId === inv.id && <span className="text-xs text-emerald-600">copiado!</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <h4 className="text-sm font-semibold mb-2">Membros</h4>
        {data.members.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum membro ainda além de você.</p>
        ) : (
          <ul className="space-y-3">
            {data.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm gap-3">
                <span className="min-w-0 truncate">
                  {m.name || m.email} <span className="text-neutral-400 text-xs">({m.email})</span>
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  {data.isOwner && (
                    <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.canViewFinance}
                        onChange={(e) => toggleFinanceAccess(m.id, e.target.checked)}
                      />
                      Vê financeiro
                    </label>
                  )}
                  {data.isOwner && (
                    <button onClick={() => removeMember(m.id)} className="text-xs text-red-600 hover:underline">
                      Remover
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!data.isOwner || data.members.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
          <h4 className="text-sm font-semibold">Tenho um código de convite</h4>
          <div className="flex gap-2 max-w-sm">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código"
              className="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm font-mono"
            />
            <button
              onClick={acceptInvite}
              disabled={accepting || !code.trim()}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
            >
              Entrar
            </button>
          </div>
          {acceptError && <p className="text-xs text-red-600">{acceptError}</p>}
          {acceptOk && <p className="text-xs text-emerald-600">Você entrou na equipe!</p>}
        </div>
      ) : null}
    </div>
  );
}
