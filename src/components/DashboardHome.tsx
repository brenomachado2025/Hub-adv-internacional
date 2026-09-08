"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Contact,
  MessageCircle,
  ShieldAlert,
  Landmark,
  Receipt,
  Globe,
  Bell,
  ClipboardList,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

type Stats = {
  activeSanctions: number;
  unreadNotifications: number;
  recentChanges: number;
  invoiceCount: number;
};

type WhatsappInfo = {
  status: string;
  label: string;
  color: string;
  sentToday: number;
  receivedToday: number;
};

type LastSync = { source: string; startedAt: string; ok: boolean } | null;

type NotificationItem = { id: string; subject: string; isRead: boolean; createdAt: string };
type InvoiceItem = { id: string; number: string; clientName: string; currency: string };

type Props = {
  greetingName: string;
  stats: Stats;
  whatsapp: WhatsappInfo;
  lastSync: LastSync;
  recentNotifications: NotificationItem[];
  recentInvoices: InvoiceItem[];
};

const QUICK_LINKS = [
  { href: "/crm", label: "CRM de Clientes", icon: Contact, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
  { href: "/sancoes", label: "Sanções", icon: ShieldAlert, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  { href: "/honorarios", label: "Honorários", icon: Landmark, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950" },
  { href: "/faturas", label: "Faturas", icon: Receipt, color: "text-rose-600 bg-rose-50 dark:bg-rose-950" },
  { href: "/reunioes", label: "Reuniões", icon: Globe, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950" },
  { href: "/notificacoes", label: "Notificações", icon: Bell, color: "text-purple-600 bg-purple-50 dark:bg-purple-950" },
  { href: "/auditoria", label: "Auditoria", icon: ClipboardList, color: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800" },
] as const;

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const TABS = ["Compliance", "CRM & WhatsApp", "Financeiro"] as const;
type Tab = (typeof TABS)[number];

export function DashboardHome({
  greetingName,
  stats,
  whatsapp,
  lastSync,
  recentNotifications,
  recentInvoices,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("Compliance");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#0e1b30] via-[#132540] to-blue-900 text-white p-6 md:p-8">
        <p className="text-blue-200 text-sm">{timeOfDayGreeting()}, {greetingName}</p>
        <h2 className="text-2xl md:text-3xl font-bold mt-1">Bem-vindo ao Internacional Hub</h2>
        <p className="text-blue-200/80 text-sm mt-2 max-w-xl">
          Seu escritório em um só lugar: sanções, clientes, WhatsApp e faturamento internacional.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <Link
            href="/faturas/nova"
            className="px-4 py-2 rounded-lg bg-white text-[#0e1b30] text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Nova fatura
          </Link>
          <Link
            href="/sancoes"
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Sincronizar sanções
          </Link>
          <Link
            href="/crm"
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Abrir CRM
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          const badge =
            item.href === "/notificacoes" && stats.unreadNotifications > 0
              ? stats.unreadNotifications
              : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all bg-white dark:bg-neutral-900"
            >
              {badge && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                  {badge}
                </span>
              )}
              {item.href === "/whatsapp" && (
                <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${whatsapp.color}`} />
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
        >
          <div className="text-left">
            <h3 className="font-semibold">Atividade recente</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lastSync
                ? `Última sincronização: ${lastSync.source} em ${new Date(lastSync.startedAt).toLocaleString("pt-BR")}`
                : "Toque para ver números de sanções, CRM e faturamento."}
            </p>
          </div>
          <ChevronDown
            size={20}
            className={`shrink-0 transition-transform text-neutral-400 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-5">
            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === t
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "Compliance" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Entradas ativas em listas de sanção" value={stats.activeSanctions} color="text-blue-600" href="/sancoes" />
                <StatCard label="Mudanças de jurisdição (7 dias)" value={stats.recentChanges} color="text-amber-600" href="/sancoes" />
                <StatCard label="Notificações não lidas" value={stats.unreadNotifications} color="text-red-600" href="/notificacoes" />
              </div>
            )}

            {tab === "CRM & WhatsApp" && (
              <div className="space-y-4">
                <Link
                  href="/whatsapp"
                  className="block rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${whatsapp.color}`} />
                      <span className="font-semibold">WhatsApp — {whatsapp.label}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span>
                        <strong className="text-emerald-600">{whatsapp.sentToday}</strong> enviadas hoje
                      </span>
                      <span>
                        <strong className="text-blue-600">{whatsapp.receivedToday}</strong> recebidas hoje
                      </span>
                    </div>
                  </div>
                </Link>
                <Link href="/crm" className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                  Ver pipeline do CRM <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {tab === "Financeiro" && (
              <div className="grid md:grid-cols-2 gap-6">
                <StatCard label="Faturas emitidas" value={stats.invoiceCount} color="text-emerald-600" href="/faturas" />
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
                  <h4 className="font-semibold mb-3 text-sm">Faturas recentes</h4>
                  {recentInvoices.length === 0 ? (
                    <p className="text-sm text-neutral-500">Nenhuma fatura emitida ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {recentInvoices.map((inv) => (
                        <li key={inv.id} className="text-sm flex justify-between">
                          <span>{inv.number} — {inv.clientName}</span>
                          <span className="text-neutral-500">{inv.currency}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/faturas" className="text-xs text-blue-600 mt-3 inline-block">
                    Ver todas →
                  </Link>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
              <h4 className="font-semibold mb-3 text-sm">Notificações recentes</h4>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-neutral-500">Nenhuma notificação ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {recentNotifications.map((n) => (
                    <li key={n.id} className="text-sm">
                      <span className={n.isRead ? "text-neutral-500" : "font-semibold"}>{n.subject}</span>
                      <span className="text-xs text-neutral-400 ml-2">
                        {new Date(n.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/notificacoes" className="text-xs text-blue-600 mt-3 inline-block">
                Ver todas →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, href }: { label: string; value: number; color: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-sm transition-shadow"
    >
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </Link>
  );
}
