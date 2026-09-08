import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const session = await prisma.whatsappSession.findUnique({ where: { userId: workspaceUserId } });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [sentToday, receivedToday, recentErrors] = await Promise.all([
    prisma.whatsappMessage.count({
      where: { userId: workspaceUserId, direction: "OUT", status: "SENT", sentAt: { gte: startOfDay } },
    }),
    prisma.whatsappMessage.count({
      where: { userId: workspaceUserId, direction: "IN", createdAt: { gte: startOfDay } },
    }),
    prisma.whatsappErrorLog.findMany({
      where: { userId: workspaceUserId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    session: session
      ? {
          status: session.status,
          qrCode: session.qrCode,
          phoneNumber: session.phoneNumber,
          lastConnectedAt: session.lastConnectedAt,
          lastError: session.lastError,
        }
      : { status: "DISCONNECTED", qrCode: "", phoneNumber: "", lastConnectedAt: null, lastError: "" },
    sentToday,
    receivedToday,
    recentErrors,
  });
}
