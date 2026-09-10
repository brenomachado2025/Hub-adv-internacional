import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
  }

  if (user.suspended) {
    return NextResponse.json({ error: "Esta conta foi suspensa. Entre em contato com o suporte." }, { status: 403 });
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name || user.email,
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
