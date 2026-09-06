import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [activeSanctions, unreadNotifications, recentChanges, invoiceCount, lastSync] = await Promise.all([
    prisma.sanctionEntry.count({ where: { active: true } }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.sanctionChangeEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.invoice.count(),
    prisma.sanctionSyncRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

  const recentInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentNotifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const cards = [
    {
      label: "Entradas ativas em listas de sanção",
      value: activeSanctions,
      href: "/sancoes",
      color: "text-blue-600",
    },
    {
      label: "Mudanças de jurisdição (7 dias)",
      value: recentChanges,
      href: "/sancoes",
      color: "text-amber-600",
    },
    {
      label: "Notificações não lidas",
      value: unreadNotifications,
      href: "/notificacoes",
      color: "text-red-600",
    },
    {
      label: "Faturas emitidas",
      value: invoiceCount,
      href: "/faturas",
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Painel de Compliance</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Visão geral de due diligence, sanções e faturamento internacional.
        </p>
        {lastSync ? (
          <p className="text-xs text-neutral-400 mt-1">
            Última sincronização: {lastSync.source} em {lastSync.startedAt.toLocaleString("pt-BR")} (
            {lastSync.status === "SUCCESS" ? "ok" : "erro"})
          </p>
        ) : (
          <p className="text-xs text-neutral-400 mt-1">
            Ainda não houve sincronização de sanções. Acesse a página de Sanções para sincronizar.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-sm transition-shadow"
          >
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold mb-3">Notificações recentes</h3>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentNotifications.map((n) => (
                <li key={n.id} className="text-sm">
                  <span className={n.isRead ? "text-neutral-500" : "font-semibold"}>{n.subject}</span>
                  <span className="text-xs text-neutral-400 ml-2">
                    {n.createdAt.toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/notificacoes" className="text-xs text-blue-600 mt-3 inline-block">
            Ver todas →
          </Link>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="font-semibold mb-3">Faturas recentes</h3>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma fatura emitida ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentInvoices.map((inv) => (
                <li key={inv.id} className="text-sm flex justify-between">
                  <span>
                    {inv.number} — {inv.clientName}
                  </span>
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
    </div>
  );
}
