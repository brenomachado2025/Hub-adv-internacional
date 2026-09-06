import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllSources } from "@/lib/sanctions/sync";
import { getActorLabel } from "@/lib/auth/current-user";

export async function POST() {
  const results = await syncAllSources();

  await prisma.auditLog.create({
    data: {
      actor: await getActorLabel(),
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
