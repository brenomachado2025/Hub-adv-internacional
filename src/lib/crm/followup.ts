import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Follow-up automático do funil: para cada workspace com a regra ativada, avisa o
 * responsável (ou o dono, se ninguém estiver atribuído) quando um cliente ainda não
 * finalizado ficar sem mudança de status por N dias. Só alerta uma vez por período
 * parado (lastFollowUpAlertAt é limpo sempre que o status muda).
 */
export async function checkStaleClients(): Promise<void> {
  const rules = await prisma.followUpRule.findMany({ where: { enabled: true } });

  for (const rule of rules) {
    const cutoff = new Date(Date.now() - rule.days * MS_PER_DAY);

    const staleClients = await prisma.crmClient.findMany({
      where: {
        userId: rule.userId,
        status: { not: "FINISHED" },
        updatedAt: { lte: cutoff },
        lastFollowUpAlertAt: null,
      },
      include: { assignee: true },
    });

    for (const client of staleClients) {
      const notifyUserId = client.assigneeId ?? rule.userId;

      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: "SYSTEM",
          sender: "Funil",
          subject: `Funil parado: ${client.fullName}`,
          body: `O cliente ${client.fullName} está sem mudança de status há ${rule.days} dia(s) ou mais.${
            client.assignee ? "" : " Nenhum responsável atribuído — notificando o dono da conta."
          }`,
        },
      });

      await prisma.crmActivity.create({
        data: {
          clientId: client.id,
          type: "FOLLOW_UP",
          description: `Alerta de funil parado (sem mudança de status há ${rule.days}+ dias)`,
          actor: "sistema",
        },
      });

      await prisma.crmClient.update({ where: { id: client.id }, data: { lastFollowUpAlertAt: new Date() } });
    }
  }
}
