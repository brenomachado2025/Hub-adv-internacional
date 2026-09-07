import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

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

  return NextResponse.json({ user: dbUser });
}
