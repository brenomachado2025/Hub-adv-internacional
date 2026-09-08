import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const membership = await prisma.teamMember.findUnique({
    where: { userId: session.userId },
    include: { team: { include: { owner: true } } },
  });

  if (membership) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: membership.teamId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });
    return NextResponse.json({
      isOwner: false,
      team: { id: membership.team.id, name: membership.team.name },
      owner: { id: membership.team.ownerId, name: membership.team.owner.name, email: membership.team.owner.email },
      members: members.map((m) => ({ id: m.userId, name: m.user.name, email: m.user.email, joinedAt: m.joinedAt })),
      invites: [],
    });
  }

  const [team, self] = await Promise.all([
    prisma.team.findUnique({ where: { ownerId: session.userId } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);

  const ownerInfo = { id: session.userId, name: self?.name ?? "", email: self?.email ?? "" };

  if (!team) {
    return NextResponse.json({ isOwner: true, team: null, owner: ownerInfo, members: [], invites: [] });
  }

  const [members, invites] = await Promise.all([
    prisma.teamMember.findMany({ where: { teamId: team.id }, include: { user: true }, orderBy: { joinedAt: "asc" } }),
    prisma.teamInvite.findMany({ where: { teamId: team.id, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    isOwner: true,
    team: { id: team.id, name: team.name },
    owner: ownerInfo,
    members: members.map((m) => ({ id: m.userId, name: m.user.name, email: m.user.email, joinedAt: m.joinedAt })),
    invites: invites.map((i) => ({ id: i.id, email: i.email, code: i.code, createdAt: i.createdAt })),
  });
}
