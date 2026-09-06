import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken, SessionPayload } from "./session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Retorna o identificador do ator para uso em AuditLog/registros — nunca lança. */
export async function getActorLabel(): Promise<string> {
  const user = await getCurrentUser();
  return user?.email ?? "desconhecido";
}
