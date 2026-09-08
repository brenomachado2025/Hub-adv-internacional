import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseAlertDays(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .sort((a, b) => b - a);
}

/**
 * Verifica todos os prazos processuais pendentes: dispara notificação in-app quando
 * o prazo cruza um dos limiares configurados (ex.: 5, 2, 1 dias antes) e marca como
 * EXPIRED quando a data já passou. Chamada periodicamente pelo instrumentation.ts,
 * mesmo padrão de "monitoramento contínuo" já usado pela sincronização de sanções.
 */
export async function checkLegalDeadlines(): Promise<void> {
  const pending = await prisma.legalCaseDeadline.findMany({
    where: { status: "PENDING" },
    include: { case: { include: { client: true } } },
  });

  const now = Date.now();

  for (const deadline of pending) {
    const daysRemaining = Math.ceil((deadline.dueDate.getTime() - now) / MS_PER_DAY);

    if (daysRemaining < 0) {
      await prisma.legalCaseDeadline.update({ where: { id: deadline.id }, data: { status: "EXPIRED" } });
      continue;
    }

    const thresholds = parseAlertDays(deadline.alertDays);
    const alreadySent: number[] = JSON.parse(deadline.alertsSent || "[]");
    const dueThreshold = thresholds.find((t) => daysRemaining <= t && !alreadySent.includes(t));
    if (dueThreshold === undefined) continue;

    await prisma.notification.create({
      data: {
        userId: deadline.case.userId,
        type: "SYSTEM",
        sender: "Prazos Processuais",
        subject: `Prazo vence em ${daysRemaining} dia(s): ${deadline.title}`,
        body: `Processo "${deadline.case.title}" (${deadline.case.caseNumber || "sem número"}) do cliente ${deadline.case.client.fullName} — prazo "${deadline.title}" vence em ${deadline.dueDate.toLocaleDateString("pt-BR")}.`,
      },
    });

    await prisma.crmActivity.create({
      data: {
        clientId: deadline.case.clientId,
        type: "DEADLINE_ALERT",
        description: `Alerta de prazo: "${deadline.title}" vence em ${daysRemaining} dia(s)`,
        actor: "sistema",
      },
    });

    await prisma.legalCaseDeadline.update({
      where: { id: deadline.id },
      data: { alertsSent: JSON.stringify([...alreadySent, dueThreshold]) },
    });
  }
}
