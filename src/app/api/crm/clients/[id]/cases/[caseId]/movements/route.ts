import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

async function loadOwnedCase(clientId: string, caseId: string, workspaceUserId: string) {
  const client = await prisma.crmClient.findUnique({ where: { id: clientId } });
  if (!client || client.userId !== workspaceUserId) return null;
  const legalCase = await prisma.legalCase.findUnique({ where: { id: caseId } });
  if (!legalCase || legalCase.clientId !== clientId) return null;
  return legalCase;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; caseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId } = await params;
  const legalCase = await loadOwnedCase(id, caseId, workspaceUserId);
  if (!legalCase) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

  const movements = await prisma.legalCaseMovement.findMany({
    where: { caseId },
    orderBy: { occurredAt: "desc" },
  });
  return NextResponse.json({ movements });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; caseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId } = await params;
  const legalCase = await loadOwnedCase(id, caseId, workspaceUserId);
  if (!legalCase) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

  const { type, description, occurredAt } = (await req.json()) as {
    type?: string;
    description?: string;
    occurredAt?: string;
  };
  if (!description?.trim()) return NextResponse.json({ error: "Descrição é obrigatória" }, { status: 400 });

  const movement = await prisma.legalCaseMovement.create({
    data: {
      caseId,
      type: ["MOVEMENT", "DECISION", "DISPATCH"].includes(type ?? "") ? (type as string) : "MOVEMENT",
      description: description.trim(),
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "CASE",
      description: `Andamento em "${legalCase.title}": ${movement.description.slice(0, 100)}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ movement });
}
