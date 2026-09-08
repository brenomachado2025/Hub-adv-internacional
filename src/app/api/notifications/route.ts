import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const notifications = await prisma.notification.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: workspaceUserId, isRead: false },
  });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const body = await req.json();
  const { id, isRead, markAllRead } = body as {
    id?: string;
    isRead?: boolean;
    markAllRead?: boolean;
  };

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: workspaceUserId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id, userId: workspaceUserId },
    data: { isRead: isRead ?? true },
  });
  return NextResponse.json({ ok: true });
}
