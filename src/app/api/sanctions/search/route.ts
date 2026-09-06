import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActorLabel } from "@/lib/auth/current-user";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.sanctionEntry.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { aliases: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  await prisma.auditLog.create({
    data: {
      actor: await getActorLabel(),
      action: "SEARCH",
      module: "sancoes",
      query: q,
      resultSummary: `${results.length} resultado(s) encontrados para due diligence`,
    },
  });

  return NextResponse.json({ results });
}
