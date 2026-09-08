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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; caseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId } = await params;
  const existing = await loadOwnedCase(id, caseId, workspaceUserId);
  if (!existing) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

  const { title, caseNumber, court, tribunalAlias, status } = (await req.json()) as {
    title?: string;
    caseNumber?: string;
    court?: string;
    tribunalAlias?: string;
    status?: string;
  };

  if (status && !["ACTIVE", "CLOSED", "ARCHIVED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const legalCase = await prisma.legalCase.update({
    where: { id: caseId },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(caseNumber !== undefined ? { caseNumber: caseNumber.trim() } : {}),
      ...(court !== undefined ? { court: court.trim() } : {}),
      ...(tribunalAlias !== undefined ? { tribunalAlias: tribunalAlias.trim() } : {}),
      ...(status !== undefined ? { status, closedAt: status === "ACTIVE" ? null : new Date() } : {}),
    },
  });

  if (status && status !== existing.status) {
    const label = status === "CLOSED" ? "encerrado" : status === "ARCHIVED" ? "arquivado" : "reaberto";
    await prisma.crmActivity.create({
      data: {
        clientId: id,
        type: "CASE",
        description: `Processo ${label}: ${legalCase.title}`,
        actor: user.name || user.email,
      },
    });
  }

  return NextResponse.json({ case: legalCase });
}
