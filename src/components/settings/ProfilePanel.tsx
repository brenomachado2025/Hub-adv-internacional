"use client";

import { useEffect, useState } from "react";

type MeUser = { email: string; name: string; title: string; role: string };

export function ProfilePanel() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name ?? "");
          setTitle(data.user.title ?? "");
        }
      });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, title }),
    });
    const data = await res.json();
    setUser(data.user);
    setSaving(false);
    setSaved(true);
  };

  if (!user) return <p className="text-sm text-neutral-500">Carregando...</p>;

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="font-semibold">Perfil</h3>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">E-mail</label>
        <input
          value={user.email}
          disabled
          className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">Tratamento</label>
        <select
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        >
          <option value="">Nenhum</option>
          <option value="Sr.">Sr.</option>
          <option value="Sra.">Sra.</option>
        </select>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
      {saved && <span className="text-xs text-emerald-600 ml-3">Salvo!</span>}
    </div>
  );
}
