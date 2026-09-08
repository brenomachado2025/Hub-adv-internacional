import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const templates = await prisma.crmDocumentTemplate.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { title, body } = (await req.json()) as { title?: string; body?: string };
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Título e corpo do modelo são obrigatórios" }, { status: 400 });
  }

  const template = await prisma.crmDocumentTemplate.create({
    data: { userId: workspaceUserId, title: title.trim(), body },
  });
  return NextResponse.json({ template });
}
