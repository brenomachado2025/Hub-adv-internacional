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

  const entries = await prisma.timeEntry.findMany({
    where: { caseId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; caseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId } = await params;
  const legalCase = await loadOwnedCase(id, caseId, workspaceUserId);
  if (!legalCase) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

  const { description, hours, hourlyRate, date } = (await req.json()) as {
    description?: string;
    hours?: number;
    hourlyRate?: number;
    date?: string;
  };
  if (!hours || hours <= 0) {
    return NextResponse.json({ error: "Informe a quantidade de horas" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.create({
    data: {
      caseId,
      userId: user.userId,
      description: description?.trim() ?? "",
      hours,
      hourlyRate: hourlyRate || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "CASE",
      description: `${hours}h registradas em "${legalCase.title}" por ${user.name || user.email}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ entry });
}
