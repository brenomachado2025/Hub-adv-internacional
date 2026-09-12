"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.user?.email ?? null);
        setName(data.user?.name ?? null);
        setAvatarUrl(data.user?.avatarUrl || null);
      })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (!email) return null;

  const initial = (name || email).charAt(0).toUpperCase();
  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
      {initial}
    </div>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div title={`${name || "Minha conta"} · ${email}`}>{avatar}</div>
        <button
          onClick={logout}
          title="Sair"
          aria-label="Sair"
          className="flex items-center justify-center w-9 h-9 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{name || "Minha conta"}</p>
        <p className="text-xs text-slate-400 truncate">{email}</p>
      </div>
      <button
        onClick={logout}
        title="Sair"
        className="p-1.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
      >
        <LogOut size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
