import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" } });

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
