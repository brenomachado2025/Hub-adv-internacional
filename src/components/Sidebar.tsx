"use client";

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
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { WhatsappStatusDot } from "@/components/WhatsappStatusDot";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/crm", label: "CRM de Clientes", icon: Contact },
  { href: "/processos", label: "Processos", icon: Scale },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, statusDot: true },
  { href: "/sancoes", label: "Sanções (ONU/OFAC/UE)", icon: ShieldAlert },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/auditoria", label: "Auditoria", icon: ClipboardList },
  { href: "/honorarios", label: "Honorários & Câmbio", icon: Landmark },
  { href: "/faturas", label: "Faturas", icon: Receipt },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/automacoes", label: "Automações", icon: Zap },
  { href: "/reunioes", label: "Reuniões & Fusos", icon: Globe },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 min-h-screen flex flex-col bg-[#0e1b30] text-slate-300">
      <div className="px-5 py-5 border-b border-white/10 flex flex-col items-center text-center gap-2">
        <Image src="/logo.png" alt="Internacional Hub" width={56} height={56} />
        <div>
          <h1 className="text-base font-bold leading-tight text-white tracking-wide">
            INTERNACIONAL HUB
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sanções internacionais &amp; due diligence</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <div className="p-3 border-t border-white/10 space-y-1">
        <ThemeToggle />
      </div>
      <div className="p-3 border-t border-white/10">
        <UserMenu />
      </div>
    </aside>
  );
}
