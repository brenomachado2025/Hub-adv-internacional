import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllSources } from "@/lib/sanctions/sync";
import { getCurrentUser } from "@/lib/auth/current-user";

// Sincronizar as 3 fontes pode levar mais que o limite padrão de 10s da Vercel;
// estende o tempo máximo de execução da função (respeitando o teto do plano contratado).
export const maxDuration = 300;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const results = await syncAllSources();

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "SYNC",
      module: "sancoes",
      resultSummary: results
        .map((r) => (r.status === "SUCCESS" ? `${r.source}: ${r.changesCount} mudanças` : `${r.source}: erro`))
        .join(" | "),
    },
  });

  return NextResponse.json({ results });
}

export async function GET() {
  const runs = await prisma.sanctionSyncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 15,
  });
  const totalActive = await prisma.sanctionEntry.count({ where: { active: true } });
  return NextResponse.json({ runs, totalActive });
}
