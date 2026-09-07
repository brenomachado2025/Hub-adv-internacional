"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.user?.email ?? null);
        setName(data.user?.name ?? null);
      });
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!email) return null;

  const initial = (name || email).charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{name || "Minha conta"}</p>
        <p className="text-xs text-slate-400 truncate">{email}</p>
      </div>
      <button
        onClick={logout}
        title="Sair"
        className="p-1.5 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
      >
        <LogOut size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
