import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

// Conta dedicada, privada, criada automaticamente na primeira vez que alguém loga
// no painel super-admin (hub_master). É o workspace usado quando clica em "Voltar
// ao Hub" - CRM/processos/faturas próprios, vazios, nunca misturados com contas
// reais de clientes. A senha é aleatória e nunca revelada: só se entra nela pelo
// login fixo do super-admin, nunca pelo formulário normal de /login.
const ADMIN_WORKSPACE_EMAIL = "superadmin@internacionalhub.internal";

export async function getOrCreateAdminWorkspaceUser() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_WORKSPACE_EMAIL } });
  if (existing) return existing;

  const randomPassword = crypto.randomBytes(24).toString("hex");
  return prisma.user.create({
    data: {
      email: ADMIN_WORKSPACE_EMAIL,
      name: "Super-Admin",
      title: "",
      passwordHash: await hashPassword(randomPassword),
      role: "ADMIN",
    },
  });
}
