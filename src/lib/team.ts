import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generateInviteCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

// Se o usuário faz parte de uma equipe (foi convidado), os dados do app devem
// ser lidos/gravados no "workspace" do dono da equipe, não no seu próprio userId.
export async function getWorkspaceOwnerId(userId: string): Promise<string> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId },
    select: { team: { select: { ownerId: true } } },
  });
  return membership?.team.ownerId ?? userId;
}

export async function getOrCreateTeam(ownerId: string) {
  const existing = await prisma.team.findUnique({ where: { ownerId } });
  if (existing) return existing;
  return prisma.team.create({ data: { ownerId } });
}

// Todos os ids de usuário que compartilham o workspace (o dono + membros convidados),
// usado para consultas que precisam enxergar/atribuir ações de toda a equipe (ex.: auditoria).
export async function getWorkspaceUserIds(userId: string): Promise<string[]> {
  const workspaceOwnerId = await getWorkspaceOwnerId(userId);
  const members = await prisma.teamMember.findMany({
    where: { team: { ownerId: workspaceOwnerId } },
    select: { userId: true },
  });
  return [workspaceOwnerId, ...members.map((m) => m.userId)];
}
