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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", emoji: "🏠" },
  { href: "/crm", label: "CRM de Clientes", emoji: "👥" },
  { href: "/processos", label: "Processos", emoji: "⚖️" },
  { href: "/whatsapp", label: "WhatsApp", emoji: "📱", statusDot: true },
  { href: "/chat-equipe", label: "Chat da Equipe", emoji: "💬" },
  { href: "/sancoes", label: "Sanções (ONU/OFAC/UE)", emoji: "🛡️" },
  { href: "/notificacoes", label: "Notificações", emoji: "🔔" },
  { href: "/auditoria", label: "Auditoria", emoji: "📋" },
  { href: "/honorarios", label: "Honorários & Câmbio", emoji: "💱", financeOnly: true },
  { href: "/faturas", label: "Faturas", emoji: "🧾", financeOnly: true },
  { href: "/relatorios", label: "Relatórios", emoji: "📊" },
  { href: "/automacoes", label: "Automações", emoji: "⚡" },
  { href: "/reunioes", label: "Reuniões & Fusos", emoji: "🌐" },
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
        className={`shrink-0 min-h-screen flex flex-col bg-[#0e1b30] text-slate-300 fixed inset-y-0 left-0 z-50 transform transition-all duration-200 md:relative md:translate-x-0 md:z-auto ${
          collapsed ? "w-20" : "w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-[#0e1b30] border border-white/15 text-slate-300 hover:bg-white/10 hover:text-white absolute -right-3 top-8 z-10 shadow-md"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={`px-4 py-5 border-b border-white/10 flex items-center gap-3 ${
            collapsed ? "flex-col text-center gap-2" : "md:flex-col md:text-center md:gap-2"
          }`}
        >
          <Image src="/logo.png" alt="Internacional Hub" width={collapsed ? 40 : 56} height={collapsed ? 40 : 56} className="shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold leading-tight text-white tracking-wide">
                INTERNACIONAL HUB
              </h1>
              <p className="text-xs text-slate-400 mt-1">Sanções internacionais &amp; due diligence</p>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                  className={`relative flex items-center justify-center w-11 h-11 mx-auto rounded-2xl text-lg transition-colors ${
                    active ? "bg-blue-600" : "hover:bg-white/10"
                  }`}
                >
                  <span aria-hidden>{item.emoji}</span>
                  {item.statusDot && (
                    <span className="absolute top-1.5 right-1.5">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base leading-none shrink-0" aria-hidden>{item.emoji}</span>
                <span className="flex-1">{item.label}</span>
                {item.statusDot && <WhatsappStatusDot />}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="p-3 border-t border-white/10">
            <a
              href="/superadmin"
              title="ADM"
              className={`flex items-center rounded-2xl text-sm font-medium bg-black border border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400 transition-colors ${
                collapsed ? "justify-center w-11 h-11 mx-auto text-lg" : "gap-3 px-3 py-2"
              }`}
            >
              <span aria-hidden>🔒</span>
              {!collapsed && <span className="flex-1">ADM</span>}
            </a>
          </div>
        )}

        <div className="p-3 border-t border-white/10 space-y-1">
          <ThemeToggle collapsed={collapsed} />
        </div>
        <div className="p-3 border-t border-white/10">
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
