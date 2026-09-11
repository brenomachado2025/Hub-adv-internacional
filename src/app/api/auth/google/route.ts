import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Passo 1 do login com Google: redireciona para a tela de consentimento do
// Google. O redirect_uri é montado a partir da própria origem da requisição -
// por isso é preciso cadastrar TODAS as origens usadas (produção e localhost,
// se for testar local) como "URIs de redirecionamento autorizados" no Google
// Cloud Console, apontando para <origem>/api/auth/google/callback.
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Login com Google não configurado no servidor." }, { status: 503 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const next = req.nextUrl.searchParams.get("next") || "/dashboard";
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("google_oauth_next", next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
