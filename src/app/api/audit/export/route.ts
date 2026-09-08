import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceUserIds } from "@/lib/team";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserIds = await getWorkspaceUserIds(user.userId);

  const logs = await prisma.auditLog.findMany({
    where: { OR: [{ userId: { in: workspaceUserIds } }, { userId: null }] },
    orderBy: { createdAt: "desc" },
  });

  const header = ["data", "ator", "acao", "modulo", "consulta", "resumo_resultado"];
  const rows = logs.map((l) =>
    [
      l.createdAt.toISOString(),
      l.actor,
      l.action,
      l.module,
      l.query,
      l.resultSummary,
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria.csv"`,
    },
  });
}
