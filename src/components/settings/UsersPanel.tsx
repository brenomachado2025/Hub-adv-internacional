"use client";

import { useEffect, useState } from "react";

type TeamData = {
  isOwner: boolean;
  team: { id: string; name: string } | null;
  owner: { name: string; email: string } | null;
  members: { id: string; name: string; email: string; joinedAt: string }[];
};

type Me = { name: string; email: string };

export function UsersPanel() {
  const [data, setData] = useState<TeamData | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then(setData);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => setMe(d.user));
  }, []);

  if (!data || !me) return <p className="text-sm text-neutral-500">Carregando...</p>;

  const rows = data.isOwner
    ? [{ name: me.name || me.email, email: me.email, role: "Dono" as const }, ...data.members.map((m) => ({ name: m.name || m.email, email: m.email, role: "Membro" as const }))]
    : [
        { name: data.owner?.name || data.owner?.email || "", email: data.owner?.email ?? "", role: "Dono" as const },
        ...data.members
          .filter((m) => m.email.toLowerCase() !== me.email.toLowerCase())
          .map((m) => ({ name: m.name || m.email, email: m.email, role: "Membro" as const })),
        { name: me.name || me.email, email: me.email, role: "Membro" as const },
      ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Usuários</h3>
      <p className="text-xs text-neutral-500">
        Pessoas com acesso a esta conta do Hub — todas compartilham os mesmos clientes, conversas e faturas.
      </p>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        {rows.map((r) => (
          <div key={r.email} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-neutral-500">{r.email}</p>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                r.role === "Dono"
                  ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
              }`}
            >
              {r.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
