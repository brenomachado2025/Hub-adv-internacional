import { NextRequest, NextResponse } from "next/server";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/session";
import { getOrCreateAdminWorkspaceUser } from "@/lib/auth/admin-workspace";

// Chamado sempre que o super-admin clica em "Voltar ao Hub" - garante, na hora,
// que a sessão normal do Hub aponta para o workspace privado do admin, mesmo que
// hub_session estivesse apontando para outra conta (ex.: login normal feito antes
// ou depois do login do super-admin, ou sessão antiga em cache).
export async function GET(req: NextRequest) {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) {
    return NextResponse.redirect(new URL("/superadmin/login", req.url));
  }

  const adminUser = await getOrCreateAdminWorkspaceUser();
  const hubToken = await createSessionToken({
    userId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    title: adminUser.title,
    role: adminUser.role,
  });

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(COOKIE_NAME, hubToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return res;
}
