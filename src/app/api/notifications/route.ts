import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const unreadCount = await prisma.notification.count({ where: { isRead: false } });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isRead, markAllRead } = body as {
    id?: string;
    isRead?: boolean;
    markAllRead?: boolean;
  };

  if (markAllRead) {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  }

  await prisma.notification.update({ where: { id }, data: { isRead: isRead ?? true } });
  return NextResponse.json({ ok: true });
}
