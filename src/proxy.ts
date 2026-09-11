import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { COOKIE_NAME as SUPERADMIN_COOKIE_NAME, verifySuperadminToken } from "@/lib/auth/superadmin-session";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/esqueci-senha",
  "/redefinir-senha",
  "/robots.txt",
  "/sitemap.xml",
  "/superadmin/login",
  "/manifest.json",
  "/sw.js",
];
const PUBLIC_PREFIXES = ["/scenes/"];
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/superadmin/login",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // O painel super-admin exige sempre o login fixo separado (hub_superadmin_session) -
  // nenhuma conta de e-mail/senha do Hub dá acesso, nem mesmo role=ADMIN.
  if (pathname.startsWith("/superadmin") || pathname.startsWith("/api/superadmin")) {
    const superadminToken = req.cookies.get(SUPERADMIN_COOKIE_NAME)?.value;
    const superadmin = superadminToken ? await verifySuperadminToken(superadminToken) : null;

    if (!superadmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/superadmin/login", req.url));
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
