import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { DashboardHome } from "@/components/DashboardHome";

export const dynamic = "force-dynamic";

const WHATSAPP_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  CONNECTED: { label: "Conectado", color: "bg-emerald-500" },
  CONNECTING: { label: "Conectando...", color: "bg-amber-500" },
  DISCONNECTED: { label: "Desconectado", color: "bg-red-500" },
};

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  const workspaceUserId = await getWorkspaceOwnerId(session.userId);

  const [account, activeSanctions, unreadNotifications, recentChanges, invoiceCount, lastSync, whatsappSession] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId } }),
      prisma.sanctionEntry.count({ where: { active: true } }),
      prisma.notification.count({ where: { userId: workspaceUserId, isRead: false } }),
      prisma.sanctionChangeEvent.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.invoice.count({ where: { userId: workspaceUserId } }),
      prisma.sanctionSyncRun.findFirst({ orderBy: { startedAt: "desc" } }),
      prisma.whatsappSession.findUnique({ where: { userId: workspaceUserId } }),
    ]);

  if (!account) redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [whatsappSentToday, whatsappReceivedToday] = await Promise.all([
    prisma.whatsappMessage.count({
      where: { userId: workspaceUserId, direction: "OUT", status: "SENT", sentAt: { gte: startOfDay } },
    }),
    prisma.whatsappMessage.count({
      where: { userId: workspaceUserId, direction: "IN", createdAt: { gte: startOfDay } },
    }),
  ]);

  const [recentInvoices, recentNotifications] = await Promise.all([
    prisma.invoice.findMany({ where: { userId: workspaceUserId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.notification.findMany({ where: { userId: workspaceUserId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const rawFirstName = (account.name || account.email).trim().split(/\s+/)[0];
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const greetingName = account.title ? `${account.title} ${firstName}` : firstName;

  const whatsappStatus = WHATSAPP_STATUS_LABEL[whatsappSession?.status ?? "DISCONNECTED"];

  return (
    <DashboardHome
      greetingName={greetingName}
      stats={{ activeSanctions, unreadNotifications, recentChanges, invoiceCount }}
      whatsapp={{
        status: whatsappSession?.status ?? "DISCONNECTED",
        label: whatsappStatus.label,
        color: whatsappStatus.color,
        sentToday: whatsappSentToday,
        receivedToday: whatsappReceivedToday,
      }}
      lastSync={
        lastSync ? { source: lastSync.source, startedAt: lastSync.startedAt.toISOString(), ok: lastSync.status === "SUCCESS" } : null
      }
      recentNotifications={recentNotifications.map((n) => ({
        id: n.id,
        subject: n.subject,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }))}
      recentInvoices={recentInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.clientName,
        currency: inv.currency,
      }))}
    />
  );
}
