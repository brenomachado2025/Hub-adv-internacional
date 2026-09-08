import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { queryDataJudProcess } from "@/lib/legal/datajud";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; caseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  const legalCase = await prisma.legalCase.findUnique({ where: { id: caseId } });
  if (!legalCase || legalCase.clientId !== id) {
    return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
  }
  if (!legalCase.caseNumber || !legalCase.tribunalAlias) {
    return NextResponse.json(
      { error: "Informe o número do processo (CNJ) e o tribunal antes de consultar." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await queryDataJudProcess(legalCase.tribunalAlias, legalCase.caseNumber);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha ao consultar o DataJud" }, { status: 502 });
  }

  if (!result.found) {
    return NextResponse.json({ imported: 0, message: "Processo não encontrado no DataJud para esse tribunal/número." });
  }

  const existing = await prisma.legalCaseMovement.findMany({
    where: { caseId, source: "DATAJUD" },
    select: { occurredAt: true, description: true },
  });
  const existingKeys = new Set(existing.map((m) => `${m.occurredAt.toISOString()}|${m.description}`));

  const toCreate = result.movimentos
    .map((m) => ({
      caseId,
      type: "MOVEMENT" as const,
      description: m.nome,
      occurredAt: new Date(m.dataHora),
      source: "DATAJUD" as const,
    }))
    .filter((m) => !existingKeys.has(`${m.occurredAt.toISOString()}|${m.description}`));

  if (toCreate.length > 0) {
    await prisma.legalCaseMovement.createMany({ data: toCreate });
  }

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "CASE",
      description: `Consulta DataJud em "${legalCase.title}": ${toCreate.length} novo(s) andamento(s) importado(s)`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ imported: toCreate.length });
}
