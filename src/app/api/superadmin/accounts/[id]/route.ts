import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperadminAccess } from "@/lib/auth/superadmin-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const superadmin = await getSuperadminAccess();
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
      suspended: user.suspended,
      suspendedAt: user.suspendedAt,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const superadmin = await getSuperadminAccess();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  const { suspended } = (await req.json()) as { suspended?: boolean };
  if (typeof suspended !== "boolean") {
    return NextResponse.json({ error: "Campo suspended é obrigatório" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { suspended, suspendedAt: suspended ? new Date() : null },
  });

  await prisma.superadminAuditLog.create({
    data: {
      action: suspended ? "SUSPEND" : "UNSUSPEND",
      targetEmail: user.email,
      targetUserId: user.id,
      details: `por ${superadmin.identity}`,
    },
  });

  return NextResponse.json({ account: { id: user.id, suspended: user.suspended } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const superadmin = await getSuperadminAccess();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  await prisma.superadminAuditLog.create({
    data: {
      action: "DELETE_ACCOUNT",
      targetEmail: user.email,
      targetUserId: user.id,
      details: `por ${superadmin.identity}`,
    },
  });

  return NextResponse.json({ ok: true });
}
