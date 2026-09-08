import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const cases = await prisma.legalCase.findMany({
    where: { clientId: id },
    include: {
      deadlines: { where: { status: "PENDING" }, orderBy: { dueDate: "asc" } },
      _count: { select: { movements: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const { title, caseNumber, court } = (await req.json()) as {
    title?: string;
    caseNumber?: string;
    court?: string;
  };
  if (!title?.trim()) return NextResponse.json({ error: "Título do processo é obrigatório" }, { status: 400 });

  const legalCase = await prisma.legalCase.create({
    data: {
      userId: workspaceUserId,
      clientId: id,
      title: title.trim(),
      caseNumber: caseNumber?.trim() ?? "",
      court: court?.trim() ?? "",
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "CASE",
      description: `Processo vinculado: ${legalCase.title}${legalCase.caseNumber ? ` (${legalCase.caseNumber})` : ""}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ case: legalCase });
}
