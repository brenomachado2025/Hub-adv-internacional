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

  const deadlines = await prisma.legalCaseDeadline.findMany({ where: { caseId }, orderBy: { dueDate: "asc" } });
  return NextResponse.json({ deadlines });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; caseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId } = await params;
  const legalCase = await loadOwnedCase(id, caseId, workspaceUserId);
  if (!legalCase) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

  const { title, dueDate, alertDays } = (await req.json()) as {
    title?: string;
    dueDate?: string;
    alertDays?: string;
  };
  if (!title?.trim() || !dueDate) {
    return NextResponse.json({ error: "Título e data de vencimento são obrigatórios" }, { status: 400 });
  }

  const cleanAlertDays = (alertDays ?? "5,2,1")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .join(",");

  const deadline = await prisma.legalCaseDeadline.create({
    data: {
      caseId,
      title: title.trim(),
      dueDate: new Date(dueDate),
      alertDays: cleanAlertDays || "5,2,1",
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "CASE",
      description: `Prazo definido em "${legalCase.title}": ${deadline.title} (${deadline.dueDate.toLocaleDateString("pt-BR")})`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ deadline });
}
