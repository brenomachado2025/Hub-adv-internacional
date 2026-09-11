import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const source = params.get("source") ?? undefined;
  const eventType = params.get("eventType") ?? undefined;
  const severity = params.get("severity") ?? undefined;
  const q = params.get("q")?.trim() ?? undefined;

  const events = await prisma.complianceEvent.findMany({
    where: {
      active: true,
      ...(source ? { source } : {}),
      ...(eventType ? { eventType } : {}),
      ...(severity ? { severity } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { publishedDate: "desc" },
    take: 100,
  });

  return NextResponse.json({ events });
}
