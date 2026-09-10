import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const messages = await prisma.teamChatMessage.findMany({
    where: { teamOwnerId: workspaceUserId },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  return NextResponse.json({ messages, selfId: user.userId });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const message = await prisma.teamChatMessage.create({
    data: {
      teamOwnerId: workspaceUserId,
      authorId: user.userId,
      authorName: user.name || user.email,
      text: text.trim().slice(0, 2000),
    },
  });

  return NextResponse.json({ message });
}
