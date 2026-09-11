import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { searchCsl } from "@/lib/sanctions/csl";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const [dbResults, cslResults] = await Promise.all([
    prisma.sanctionEntry.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { aliases: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 100,
    }),
    searchCsl(q),
  ]);

  const results = [...dbResults, ...cslResults];

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "SEARCH",
      module: "sancoes",
      query: q,
      resultSummary: `${results.length} resultado(s) encontrados para due diligence`,
    },
  });

  return NextResponse.json({ results });
}
