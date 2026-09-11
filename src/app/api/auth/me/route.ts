import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasFinanceAccess } from "@/lib/team";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  // Busca os dados atuais no banco em vez de confiar só no que foi gravado no
  // cookie de sessão no momento do login (evita nome/tratamento desatualizados
  // até o usuário sair e entrar de novo).
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true, title: true, role: true },
  });

  if (!dbUser) return NextResponse.json({ user: null }, { status: 200 });

  const canViewFinance = await hasFinanceAccess(session.userId);

  return NextResponse.json({ user: { ...dbUser, canViewFinance } });
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, title } = (await req.json()) as { name?: string; title?: string };
  const data: { name?: string; title?: string } = {};
  if (typeof name === "string") data.name = name.trim();
  if (typeof title === "string" && ["", "Sr.", "Sra."].includes(title)) data.title = title;

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { email: true, name: true, title: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
