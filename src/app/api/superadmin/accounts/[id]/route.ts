import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          crmClients: true,
          legalCases: true,
          invoices: true,
          feeContracts: true,
          notifications: true,
          auditLogs: true,
        },
      },
      teamMembership: { include: { team: { include: { owner: { select: { email: true, name: true } } } } } },
      ownedTeam: { include: { members: { include: { user: { select: { email: true, name: true } } } } } },
      whatsappSession: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  return NextResponse.json({
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      title: user.title,
      role: user.role,
      createdAt: user.createdAt,
      counts: user._count,
      isTeamMember: !!user.teamMembership,
      teamOwner: user.teamMembership
        ? { email: user.teamMembership.team.owner.email, name: user.teamMembership.team.owner.name }
        : null,
      ownedTeamMembers: user.ownedTeam?.members.map((m) => ({ email: m.user.email, name: m.user.name })) ?? [],
      whatsapp: user.whatsappSession
        ? { status: user.whatsappSession.status, phoneNumber: user.whatsappSession.phoneNumber }
        : null,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
