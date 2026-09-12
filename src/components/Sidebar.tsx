"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Contact,
  ShieldAlert,
  Bell,
  ClipboardList,
  Landmark,
  Receipt,
  Globe,
  MessageCircle,
  Scale,
  BarChart3,
  Zap,
  Lock,
  MessagesSquare,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { WhatsappStatusDot } from "@/components/WhatsappStatusDot";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/crm", label: "CRM de Clientes", icon: Contact },
  { href: "/processos", label: "Processos", icon: Scale },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, statusDot: true },
  { href: "/chat-equipe", label: "Chat da Equipe", icon: MessagesSquare },
  { href: "/sancoes", label: "Sanções (ONU/OFAC/UE)", icon: ShieldAlert },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/auditoria", label: "Auditoria", icon: ClipboardList },
  { href: "/honorarios", label: "Honorários & Câmbio", icon: Landmark, financeOnly: true },
  { href: "/faturas", label: "Faturas", icon: Receipt, financeOnly: true },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/automacoes", label: "Automações", icon: Zap },
  { href: "/reunioes", label: "Reuniões & Fusos", icon: Globe },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [canViewFinance, setCanViewFinance] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.user?.role === "ADMIN");
        setCanViewFinance(data.user?.canViewFinance ?? true);
      })
      .catch(() => {});
  }, []);

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
        className={`w-64 shrink-0 min-h-screen flex flex-col bg-[#0e1b30] text-slate-300 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3 md:flex-col md:text-center md:gap-2">
          <Image src="/logo.png" alt="Internacional Hub" width={56} height={56} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight text-white tracking-wide">
              INTERNACIONAL HUB
            </h1>
            <p className="text-xs text-slate-400 mt-1">Sanções internacionais &amp; due diligence</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:bg-white/10 hover:text-white shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter((item) => !item.financeOnly || canViewFinance).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} className="shrink-0" />
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-black border border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400 transition-colors"
            >
              <Lock size={18} strokeWidth={1.75} className="shrink-0" />
              <span className="flex-1">ADM</span>
            </a>
          </div>
        )}

        <div className="p-3 border-t border-white/10 space-y-1">
          <ThemeToggle />
        </div>
        <div className="p-3 border-t border-white/10">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
