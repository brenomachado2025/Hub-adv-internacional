import { prisma } from "@/lib/prisma";

export function generateInstallments(
  totalAmount: number,
  count: number,
  firstDueDate: Date
): { number: number; amount: number; dueDate: Date }[] {
  const base = Math.floor((totalAmount / count) * 100) / 100;
  const installments: { number: number; amount: number; dueDate: Date }[] = [];
  let allocated = 0;

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? Math.round((totalAmount - allocated) * 100) / 100 : base;
    allocated += amount;

    // Aritmética em UTC (evita o "salto de mês" quando a data de referência, ao
    // cruzar meia-noite UTC, cai em dia 31 no fuso local e um mês seguinte tem
    // menos dias, e evita depender do fuso horário do servidor).
    const dueDate = new Date(
      Date.UTC(firstDueDate.getUTCFullYear(), firstDueDate.getUTCMonth() + i, firstDueDate.getUTCDate())
    );

    installments.push({ number: i + 1, amount, dueDate });
  }

  return installments;
}

/**
 * Verifica parcelas pendentes vencidas: marca como OVERDUE, notifica o escritório
 * no Hub e, se o cliente já tiver conversado por WhatsApp antes, envia um aviso de
 * cobrança automático (mesma humanização/condição do restante do WhatsApp: nunca
 * fala primeiro com quem nunca escreveu). Chamada periodicamente pelo
 * instrumentation.ts, mesmo padrão da sincronização de sanções e prazos.
 */
export async function checkOverdueInstallments(): Promise<void> {
  const overdue = await prisma.feeInstallment.findMany({
    where: { status: "PENDING", dueDate: { lt: new Date() } },
    include: { contract: { include: { client: true } } },
  });

  for (const installment of overdue) {
    await prisma.feeInstallment.update({ where: { id: installment.id }, data: { status: "OVERDUE" } });

    const { contract } = installment;
    await prisma.notification.create({
      data: {
        userId: contract.userId,
        type: "SYSTEM",
        sender: "Financeiro",
        subject: `Parcela em atraso: ${contract.client.fullName}`,
        body: `Parcela ${installment.number} (${contract.currency} ${installment.amount.toFixed(2)}) de "${contract.description || "contrato de honorários"}" venceu em ${installment.dueDate.toLocaleDateString("pt-BR")} e ainda não foi paga.`,
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId: contract.clientId,
        type: "BILLING",
        description: `Parcela ${installment.number} em atraso (${contract.currency} ${installment.amount.toFixed(2)})`,
        actor: "sistema",
      },
    });

    if (contract.client.phone) {
      const hasIncomingMessage = await prisma.whatsappMessage.findFirst({
        where: { crmClientId: contract.clientId, direction: "IN" },
      });
      if (hasIncomingMessage) {
        const delaySeconds = Math.floor(Math.random() * 26) + 5;
        await prisma.whatsappMessage.create({
          data: {
            userId: contract.userId,
            crmClientId: contract.clientId,
            phone: contract.client.phone,
            direction: "OUT",
            body: `Olá! Identificamos que a parcela ${installment.number} (${contract.currency} ${installment.amount.toFixed(2)}), vencida em ${installment.dueDate.toLocaleDateString("pt-BR")}, ainda consta em aberto. Qualquer dúvida, estamos à disposição.`,
            status: "QUEUED",
            scheduledFor: new Date(Date.now() + delaySeconds * 1000),
          },
        });
      }
    }
  }
}
