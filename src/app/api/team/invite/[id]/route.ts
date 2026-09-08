import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const invite = await prisma.teamInvite.findUnique({ where: { id }, include: { team: true } });
  if (!invite || invite.team.ownerId !== session.userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.teamInvite.update({ where: { id }, data: { status: "REVOKED" } });
  return NextResponse.json({ ok: true });
}
