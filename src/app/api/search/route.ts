import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ clients: [], cases: [], invoices: [] });

  const [clients, cases, invoices] = await Promise.all([
    prisma.crmClient.findMany({
      where: {
        userId: workspaceUserId,
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { documentNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, fullName: true, companyName: true, documentNumber: true },
      take: 6,
    }),
    prisma.legalCase.findMany({
      where: {
        userId: workspaceUserId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { caseNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, caseNumber: true, clientId: true, client: { select: { fullName: true } } },
      take: 6,
    }),
    prisma.invoice.findMany({
      where: {
        userId: workspaceUserId,
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { clientName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, number: true, clientName: true, currency: true },
      take: 6,
    }),
  ]);

  return NextResponse.json({
    clients: clients.map((c) => ({ id: c.id, label: c.fullName, sublabel: c.companyName || c.documentNumber || "" })),
    cases: cases.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      label: c.title,
      sublabel: [c.caseNumber, c.client.fullName].filter(Boolean).join(" · "),
    })),
    invoices: invoices.map((i) => ({ id: i.id, label: i.number, sublabel: `${i.clientName} · ${i.currency}` })),
  });
}
