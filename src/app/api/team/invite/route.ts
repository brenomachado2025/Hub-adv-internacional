import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { generateInviteCode, getOrCreateTeam } from "@/lib/team";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const membership = await prisma.teamMember.findUnique({ where: { userId: session.userId } });
  if (membership) {
    return NextResponse.json({ error: "Você já faz parte de uma equipe e não pode convidar membros." }, { status: 400 });
  }

  const { email } = (await req.json()) as { email?: string };
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (normalizedEmail === session.email.toLowerCase()) {
    return NextResponse.json({ error: "Você não pode convidar a si mesmo." }, { status: 400 });
  }

  const team = await getOrCreateTeam(session.userId);

  const existingInvite = await prisma.teamInvite.findFirst({
    where: { teamId: team.id, email: normalizedEmail, status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json({ invite: existingInvite });
  }

  const invite = await prisma.teamInvite.create({
    data: { teamId: team.id, email: normalizedEmail, code: generateInviteCode() },
  });

  return NextResponse.json({ invite });
}
