import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";

export async function GET() {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [whatsappSessions, recentSyncRuns, pendingDeadlines, overdueInstallments] = await Promise.all([
    prisma.whatsappSession.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.sanctionSyncRun.findMany({ orderBy: { startedAt: "desc" }, take: 5 }),
    prisma.legalCaseDeadline.count({ where: { status: "PENDING" } }),
    prisma.feeInstallment.count({ where: { status: "OVERDUE" } }),
  ]);

  return NextResponse.json({
    whatsappSessions: whatsappSessions.map((s) => ({
      status: s.status,
      phoneNumber: s.phoneNumber,
      lastConnectedAt: s.lastConnectedAt,
      updatedAt: s.updatedAt,
      lastError: s.lastError,
      ownerEmail: s.user.email,
      ownerName: s.user.name,
    })),
    sanctionsSyncRuns: recentSyncRuns,
    pendingDeadlines,
    overdueInstallments,
    apiKeys: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      datajud: !!process.env.DATAJUD_API_KEY,
    },
  });
}
