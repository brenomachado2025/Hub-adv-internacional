"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Users, Activity, ScrollText } from "lucide-react";

const NAV = [
  { href: "/superadmin", label: "Contas", icon: Users },
  { href: "/superadmin/saude", label: "Saúde do sistema", icon: Activity },
  { href: "/superadmin/auditoria", label: "Auditoria", icon: ScrollText },
] as const;

export function SuperadminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const logout = async () => {
    await fetch("/api/superadmin/logout", { method: "POST" });
    // Navegação de página cheia: evita servir do cache de rota do Next.js uma
    // versão antiga de /dashboard renderizada para outra conta/sessão.
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <header className="border-b border-red-950 bg-black">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <h1 className="text-sm font-bold text-white tracking-wide">SUPER-ADMIN · Internacional Hub</h1>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    active ? "bg-red-600 text-white font-medium" : "text-zinc-400 hover:text-white hover:bg-red-950/60"
                  }`}
                >
                  <Icon size={14} /> {item.label}
                </Link>
              );
            })}
            <a
              href="/api/superadmin/enter-workspace"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-red-950/60"
            >
              Voltar ao Hub
            </a>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-red-950/60"
            >
              <LogOut size={14} /> Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
