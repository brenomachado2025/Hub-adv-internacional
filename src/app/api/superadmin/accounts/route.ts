import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";

export async function GET() {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { crmClients: true, legalCases: true, invoices: true, feeContracts: true } },
      teamMembership: { include: { team: { include: { owner: { select: { email: true, name: true } } } } } },
      ownedTeam: { include: { _count: { select: { members: true } } } },
      whatsappSession: { select: { status: true, phoneNumber: true } },
    },
  });

  const accounts = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    title: u.title,
    role: u.role,
    createdAt: u.createdAt,
    isTeamMember: !!u.teamMembership,
    teamOwnerEmail: u.teamMembership?.team.owner.email ?? null,
    teamMembersCount: u.ownedTeam?._count.members ?? 0,
    crmClientsCount: u._count.crmClients,
    legalCasesCount: u._count.legalCases,
    invoicesCount: u._count.invoices,
    feeContractsCount: u._count.feeContracts,
    whatsappStatus: u.whatsappSession?.status ?? null,
    whatsappPhone: u.whatsappSession?.phoneNumber ?? null,
    suspended: u.suspended,
  }));

  return NextResponse.json({ accounts });
}
