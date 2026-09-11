import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

const GENERIC_ERROR = "Código inválido ou expirado.";
const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { email, code, newPassword } = (await req.json()) as {
    email?: string;
    code?: string;
    newPassword?: string;
  };

  if (!email?.trim() || !code?.trim() || !newPassword) {
    return NextResponse.json({ error: "Preencha e-mail, código e nova senha" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "A senha precisa ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!token || token.expiresAt < new Date()) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  if (token.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Muitas tentativas. Peça um novo código." }, { status: 429 });
  }

  if (token.code !== code.trim()) {
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
