import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "Login com Google não configurado no servidor.");
    return NextResponse.redirect(loginUrl);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const deniedReason = req.nextUrl.searchParams.get("error");
  const expectedState = req.cookies.get("google_oauth_state")?.value;
  const next = req.cookies.get("google_oauth_next")?.value || "/dashboard";

  if (deniedReason) {
    loginUrl.searchParams.set("error", "Login com Google cancelado.");
    return NextResponse.redirect(loginUrl);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    loginUrl.searchParams.set("error", "Sessão de login expirada. Tente novamente.");
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");
    const tokens = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error("userinfo failed");
    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
    };

    if (!profile.email || !profile.email_verified) {
      loginUrl.searchParams.set("error", "Sua conta Google precisa ter o e-mail verificado.");
      return NextResponse.redirect(loginUrl);
    }

    const email = profile.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        // Conta já existia com e-mail/senha - vincula o Google pra próxima vez
        // ser mais rápido, já que o e-mail do Google veio verificado.
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.sub } });
      } else {
        const randomPassword = await hashPassword(crypto.randomUUID() + crypto.randomUUID());
        try {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.name ?? "",
              passwordHash: randomPassword,
              googleId: profile.sub,
            },
          });
        } catch (err) {
          // Corrida: duas abas fazendo o primeiro login com o mesmo e-mail ao
          // mesmo tempo - a segunda esbarra na constraint única de e-mail/googleId.
          // Em vez de quebrar, busca a conta que a outra requisição acabou de criar.
          const isUniqueConstraint =
            typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
          if (!isUniqueConstraint) throw err;
          user = await prisma.user.findUnique({ where: { email } });
          if (!user) throw err;
        }
      }
    }

    if (user.suspended) {
      loginUrl.searchParams.set("error", "Esta conta foi suspensa. Entre em contato com o suporte.");
      return NextResponse.redirect(loginUrl);
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name || user.email,
      title: user.title,
      role: user.role,
    });

    const res = NextResponse.redirect(new URL(next, req.url));
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
    res.cookies.delete("google_oauth_state");
    res.cookies.delete("google_oauth_next");
    return res;
  } catch {
    loginUrl.searchParams.set("error", "Falha ao entrar com Google. Tente novamente.");
    return NextResponse.redirect(loginUrl);
  }
}
