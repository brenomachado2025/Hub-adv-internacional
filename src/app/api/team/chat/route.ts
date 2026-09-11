import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId, getWorkspaceUserIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const withUserId = req.nextUrl.searchParams.get("with");

  if (withUserId) {
    const roster = await getWorkspaceUserIds(user.userId);
    if (!roster.includes(withUserId)) {
      return NextResponse.json({ error: "Pessoa não encontrada na equipe" }, { status: 404 });
    }
    const messages = await prisma.teamChatMessage.findMany({
      where: {
        teamOwnerId: workspaceUserId,
        OR: [
          { authorId: user.userId, recipientId: withUserId },
          { authorId: withUserId, recipientId: user.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 300,
    });
    return NextResponse.json({ messages, selfId: user.userId });
  }

  const messages = await prisma.teamChatMessage.findMany({
    where: { teamOwnerId: workspaceUserId, recipientId: null },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  return NextResponse.json({ messages, selfId: user.userId });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { text, recipientId } = (await req.json()) as { text?: string; recipientId?: string };
  if (!text?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  let recipient: string | null = null;
  if (recipientId) {
    if (recipientId === user.userId) {
      return NextResponse.json({ error: "Não é possível enviar mensagem para si mesmo" }, { status: 400 });
    }
    const roster = await getWorkspaceUserIds(user.userId);
    if (!roster.includes(recipientId)) {
      return NextResponse.json({ error: "Pessoa não encontrada na equipe" }, { status: 404 });
    }
    recipient = recipientId;
  }

  const message = await prisma.teamChatMessage.create({
    data: {
      teamOwnerId: workspaceUserId,
      authorId: user.userId,
      authorName: user.name || user.email,
      recipientId: recipient,
      text: text.trim().slice(0, 2000),
    },
  });

  return NextResponse.json({ message });
}
