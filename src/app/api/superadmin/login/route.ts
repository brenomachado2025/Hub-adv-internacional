import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSuperadminToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/superadmin-session";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as { username?: string; password?: string };

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
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return res;
}
