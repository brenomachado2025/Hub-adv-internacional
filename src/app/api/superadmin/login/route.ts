import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSuperadminToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/superadmin-session";
import {
  createSessionToken,
  COOKIE_NAME as HUB_COOKIE_NAME,
  SESSION_DURATION_SECONDS as HUB_SESSION_DURATION_SECONDS,
} from "@/lib/auth/session";
import { getOrCreateAdminWorkspaceUser } from "@/lib/auth/admin-workspace";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { username?: string; password?: string };
  // Tolera espaço extra no começo/fim (comum em teclado de celular e autocomplete).
  const username = body.username?.trim();
  const password = body.password?.trim();

  const expectedUsername = process.env.SUPERADMIN_USERNAME;
  const expectedHash = process.env.SUPERADMIN_PASSWORD_HASH;
  if (!expectedUsername || !expectedHash) {
    return NextResponse.json({ error: "Painel super-admin não configurado no servidor." }, { status: 500 });
  }

  if (!username || !password || username !== expectedUsername) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const valid = await verifyPassword(password, expectedHash);
  if (!valid) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const token = await createSuperadminToken(username);

  // Também autentica o admin no Hub normal, mas num workspace privado e dedicado -
  // "Voltar ao Hub" nunca deve cair na conta de um cliente real (ex.: caso já
  // houvesse uma sessão antiga em cache no mesmo navegador).
  const adminUser = await getOrCreateAdminWorkspaceUser();
  const hubToken = await createSessionToken({
    userId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    title: adminUser.title,
    role: adminUser.role,
  });

  await prisma.superadminAuditLog.create({
    data: { action: "LOGIN", targetEmail: username },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  res.cookies.set(HUB_COOKIE_NAME, hubToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HUB_SESSION_DURATION_SECONDS,
  });
  return res;
}
