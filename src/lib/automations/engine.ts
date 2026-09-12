import { prisma } from "@/lib/prisma";
import type { CrmClient } from "@prisma/client";

// Motor genérico de automações personalizadas ("se isso, então aquilo"). Roda ao
// lado das automações fixas já existentes (tarefa automática de novo cliente,
// prazo processual, parcela em atraso, WhatsApp por status) - essas continuam
// funcionando como estão; este motor cobre combinações extras que o usuário
// mesmo configura em /automacoes.

async function runAction(rule: { actionType: string; actionText: string; actionDays: number }, client: CrmClient, workspaceUserId: string) {
  if (rule.actionType === "CREATE_TASK") {
    const dueDate = new Date(Date.now() + rule.actionDays * 24 * 60 * 60 * 1000);
    await prisma.crmTask.create({
      data: { clientId: client.id, title: rule.actionText || "Tarefa automática", dueDate },
    });
    await prisma.crmActivity.create({
      data: {
        clientId: client.id,
        type: "TASK",
        description: `Tarefa automática criada: ${rule.actionText || "Tarefa automática"}`,
        actor: "automação",
      },
    });
    return;
  }

  if (rule.actionType === "SEND_NOTIFICATION") {
    await prisma.notification.create({
      data: {
        userId: workspaceUserId,
        type: "SYSTEM",
        sender: "Automação",
        subject: rule.actionText || "Automação disparada",
        body: `Cliente: ${client.fullName}`,
      },
    });
    return;
  }

  if (rule.actionType === "SEND_WHATSAPP") {
    if (!client.phone || !rule.actionText.trim()) return;
    // Mesma regra de segurança já usada nas notificações automáticas por status:
    // só envia para quem já iniciou conversa (evita mensagem não solicitada).
    const hasIncomingMessage = await prisma.whatsappMessage.findFirst({
      where: { crmClientId: client.id, direction: "IN" },
    });
    if (!hasIncomingMessage) return;

    const delaySeconds = Math.floor(Math.random() * 26) + 5;
    await prisma.whatsappMessage.create({
      data: {
        userId: workspaceUserId,
        crmClientId: client.id,
        phone: client.phone,
        direction: "OUT",
        body: rule.actionText,
        status: "QUEUED",
        scheduledFor: new Date(Date.now() + delaySeconds * 1000),
      },
    });
  }
}

export async function runClientCreatedAutomations(workspaceUserId: string, client: CrmClient) {
  const rules = await prisma.automationRule.findMany({
    where: { userId: workspaceUserId, enabled: true, triggerType: "CLIENT_CREATED" },
  });
  for (const rule of rules) {
    await runAction(rule, client, workspaceUserId).catch((err) => {
      console.error(`[automations] falha ao executar regra ${rule.id} (${rule.actionType}):`, err);
    });
  }
}

export async function runClientStatusChangedAutomations(workspaceUserId: string, client: CrmClient, newStatus: string) {
  const rules = await prisma.automationRule.findMany({
    where: {
      userId: workspaceUserId,
      enabled: true,
      triggerType: "CLIENT_STATUS_CHANGED",
      OR: [{ triggerStatus: "" }, { triggerStatus: newStatus }],
    },
  });
  for (const rule of rules) {
    await runAction(rule, client, workspaceUserId).catch((err) => {
      console.error(`[automations] falha ao executar regra ${rule.id} (${rule.actionType}):`, err);
    });
  }
}
