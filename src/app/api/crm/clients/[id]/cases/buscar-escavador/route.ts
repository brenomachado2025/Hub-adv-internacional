import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { searchProcessesByDocument } from "@/lib/legal/escavador";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  let processos;
  try {
    processos = await searchProcessesByDocument(client.documentNumber);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha ao consultar o Escavador" }, { status: 502 });
  }

  // Não mostra de novo processos que já foram vinculados a este cliente.
  const existingCases = await prisma.legalCase.findMany({
    where: { clientId: id },
    select: { caseNumber: true },
  });
  const existingNumbers = new Set(existingCases.map((c) => c.caseNumber).filter(Boolean));
  const novos = processos.filter((p) => !existingNumbers.has(p.numeroCnj));

  return NextResponse.json({ processos: novos });
}
