import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.teamMember.findUnique({ where: { userId: id }, include: { team: true } });
  if (!member || member.team.ownerId !== session.userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.teamMember.delete({ where: { userId: id } });
  return NextResponse.json({ ok: true });
}
