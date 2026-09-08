import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code } = (await req.json()) as { code?: string };
  const normalizedCode = (code ?? "").trim().toUpperCase();
  if (!normalizedCode) {
    return NextResponse.json({ error: "Informe o código de convite." }, { status: 400 });
  }

  const [me, existingMembership, ownsTeam] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.teamMember.findUnique({ where: { userId: session.userId } }),
    prisma.team.findUnique({ where: { ownerId: session.userId } }),
  ]);

  if (existingMembership) {
    return NextResponse.json({ error: "Você já faz parte de uma equipe." }, { status: 400 });
  }
  if (ownsTeam) {
    return NextResponse.json(
      { error: "Sua conta já é dona de uma equipe. Só é possível entrar em outra equipe com uma conta nova." },
      { status: 400 }
    );
  }

  const invite = await prisma.teamInvite.findUnique({ where: { code: normalizedCode } });
  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Código inválido ou já utilizado." }, { status: 400 });
  }
  if (invite.email.toLowerCase() !== (me?.email ?? "").toLowerCase()) {
    return NextResponse.json(
      { error: "Esse código foi gerado para outro e-mail. Entre com a conta correspondente ao convite." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.teamMember.create({ data: { teamId: invite.teamId, userId: session.userId } }),
    prisma.teamInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
