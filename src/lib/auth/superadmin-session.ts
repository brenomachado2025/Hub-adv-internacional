import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Sessão do painel super-admin (/superadmin) - totalmente separada da sessão normal
// de usuário (hub_session): cookie próprio, payload próprio, sem relação com a
// tabela User. O login é um usuário/senha fixos definidos em .env, não cadastro.
const COOKIE_NAME = "hub_superadmin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET não configurado ou muito curto.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSuperadminToken(username: string): Promise<string> {
  return new SignJWT({ superadmin: true, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySuperadminToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.superadmin === true && typeof payload.username === "string") {
      return { username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentSuperadmin(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySuperadminToken(token);
}

// Acesso ao painel admin exige sempre o login fixo separado (hub_superadmin_session) -
// não é liberado por nenhuma conta de e-mail/senha do Hub, nem mesmo role=ADMIN.
export async function getSuperadminAccess(): Promise<{ via: "fixed"; identity: string } | null> {
  const fixed = await getCurrentSuperadmin();
  if (fixed) return { via: "fixed", identity: fixed.username };
  return null;
}

export { COOKIE_NAME, SESSION_DURATION_SECONDS };
