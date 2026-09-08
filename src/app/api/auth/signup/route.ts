import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TITLES = ["Sr.", "Sra.", ""];

export async function POST(req: NextRequest) {
  const { email, password, name, title } = (await req.json()) as {
    email?: string;
    password?: string;
    name?: string;
    title?: string;
  };

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com esse e-mail" }, { status: 409 });
  }

  const resolvedTitle = VALID_TITLES.includes(title ?? "") ? (title as string) : "";

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split("@")[0],
      title: resolvedTitle,
      passwordHash,
      role: "CLIENT",
    },
  });

  const pendingInvite = await prisma.teamInvite.findFirst({
    where: { email: normalizedEmail, status: "PENDING" },
    include: { team: { include: { owner: true } } },
  });
  if (pendingInvite) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        sender: "Equipe",
        subject: `Convite para a equipe de ${pendingInvite.team.owner.name || pendingInvite.team.owner.email}`,
        body: `Você foi convidado para compartilhar a conta de ${
          pendingInvite.team.owner.name || pendingInvite.team.owner.email
        } no Internacional Hub. Para aceitar, acesse Configurações → Equipes e informe o código: ${pendingInvite.code}`,
      },
    });
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    title: user.title,
    role: user.role,
  });

  const res = NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name, title: user.title, role: user.role },
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return res;
}
