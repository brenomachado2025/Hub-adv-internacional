import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken, SessionPayload } from "./session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  // Checa a cada request se a conta não foi suspensa pelo painel super-admin -
  // suspensão deve derrubar o acesso na hora, não só bloquear login futuro.
  const dbUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { suspended: true } });
  if (!dbUser || dbUser.suspended) return null;

  return session;
}
