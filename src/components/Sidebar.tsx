"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { WhatsappStatusDot } from "@/components/WhatsappStatusDot";

const SIDEBAR_COLLAPSED_KEY = "hub-sidebar-collapsed";

// Cada modulo tem um emoji dentro de um quadro (tile) colorido, tipo icone de
// app - deixa facil reconhecer o modulo de relance, igual num celular.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", emoji: "🏠", tile: "bg-orange-500" },
  { href: "/crm", label: "CRM de Clientes", emoji: "👥", tile: "bg-blue-500" },
  { href: "/processos", label: "Processos", emoji: "⚖️", tile: "bg-fuchsia-500" },
  { href: "/whatsapp", label: "WhatsApp", emoji: "📱", tile: "bg-green-500", statusDot: true },
  { href: "/chat-equipe", label: "Chat da Equipe", emoji: "💬", tile: "bg-sky-500" },
  { href: "/sancoes", label: "Sanções (ONU/OFAC/UE)", emoji: "🛡️", tile: "bg-red-500" },
  { href: "/notificacoes", label: "Notificações", emoji: "🔔", tile: "bg-amber-500" },
  { href: "/auditoria", label: "Auditoria", emoji: "📋", tile: "bg-slate-500" },
  { href: "/honorarios", label: "Honorários & Câmbio", emoji: "💱", tile: "bg-emerald-500", financeOnly: true },
  { href: "/faturas", label: "Faturas", emoji: "🧾", tile: "bg-rose-500", financeOnly: true },
  { href: "/relatorios", label: "Relatórios", emoji: "📊", tile: "bg-indigo-500" },
  { href: "/automacoes", label: "Automações", emoji: "⚡", tile: "bg-yellow-500" },
  { href: "/reunioes", label: "Reuniões & Fusos", emoji: "🌐", tile: "bg-teal-500" },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [canViewFinance, setCanViewFinance] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.user?.role === "ADMIN");
        setCanViewFinance(data.user?.canViewFinance ?? true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      // localStorage indisponível - mantém expandido por padrão.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // localStorage indisponível - a preferência só não persiste entre visitas.
      }
      return next;
    });
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`shrink-0 flex flex-col bg-[#0e1b30] text-slate-300 fixed inset-y-0 left-0 z-50 overflow-y-auto transform transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-auto ${
          collapsed ? "w-20" : "w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-3 py-3 border-b border-white/10 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Internacional Hub"
            width={collapsed ? 32 : 36}
            height={collapsed ? 32 : 36}
            className="shrink-0 rounded-md"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold leading-tight text-white tracking-wide truncate">
                INTERNACIONAL HUB
              </h1>
              <p className="text-[11px] text-slate-400 truncate">Sanções &amp; due diligence</p>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.filter((item) => !item.financeOnly || canViewFinance).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (collapsed) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={item.label}
                  aria-label={item.label}
                  className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-lg transition-all ${item.tile} ${
                    active ? "ring-2 ring-white/85" : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <span aria-hidden>{item.emoji}</span>
                  {item.statusDot && (
                    <span className="absolute -top-0.5 -right-0.5">
                      <WhatsappStatusDot />
                    </span>
                  )}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`relative flex items-center justify-center w-7 h-7 rounded-lg text-sm shrink-0 ${item.tile}`}>
                  <span aria-hidden>{item.emoji}</span>
                  {item.statusDot && (
                    <span className="absolute -top-0.5 -right-0.5">
                      <WhatsappStatusDot />
                    </span>
                  )}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="p-2 border-t border-white/10">
            <a
              href="/superadmin"
              title="ADM"
              className={`flex items-center rounded-xl text-sm font-medium bg-black border border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400 transition-colors ${
                collapsed ? "justify-center w-10 h-10 mx-auto text-lg" : "gap-2.5 px-2 py-1.5"
              }`}
            >
              <span aria-hidden>🔒</span>
              {!collapsed && <span className="flex-1">ADM</span>}
            </a>
          </div>
        )}

        <div className="p-2 border-t border-white/10">
          <ThemeToggle collapsed={collapsed} />
        </div>
        <div className="p-2 border-t border-white/10">
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
