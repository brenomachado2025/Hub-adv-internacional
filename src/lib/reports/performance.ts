import { prisma } from "@/lib/prisma";

export type Period = "month" | "quarter";

type Range = { start: Date; end: Date; label: string };

function monthRange(offset: number): Range {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 1));
  const label = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start, end, label };
}

function quarterRange(offset: number): Range {
  const now = new Date();
  const currentQuarter = Math.floor(now.getUTCMonth() / 3);
  const start = new Date(Date.UTC(now.getUTCFullYear(), (currentQuarter + offset) * 3, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), (currentQuarter + offset + 1) * 3, 1));
  const label = `T${Math.floor(start.getUTCMonth() / 3) + 1}/${start.getUTCFullYear()}`;
  return { start, end, label };
}

function getRanges(period: Period): { current: Range; previous: Range } {
  const fn = period === "month" ? monthRange : quarterRange;
  return { current: fn(0), previous: fn(-1) };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // null = "novo" (sem base de comparação)
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function computeMetrics(workspaceUserId: string, range: Range) {
  const [newClients, finishedInPeriod, invoices] = await Promise.all([
    prisma.crmClient.findMany({
      where: { userId: workspaceUserId, createdAt: { gte: range.start, lt: range.end } },
      select: { id: true, status: true, legalArea: true },
    }),
    prisma.crmClient.count({
      where: {
        userId: workspaceUserId,
        createdAt: { gte: range.start, lt: range.end },
        status: "FINISHED",
      },
    }),
    prisma.invoice.findMany({
      where: { userId: workspaceUserId },
      include: { items: true, crmClient: { select: { legalArea: true } } },
    }),
  ]);

  const periodInvoices = invoices.filter((inv) => {
    const d = new Date(inv.issueDate);
    return d >= range.start && d < range.end;
  });

  const revenueByCurrency = new Map<string, number>();
  const revenueByArea = new Map<string, number>(); // key: `${area}|${currency}`

  for (const inv of periodInvoices) {
    const subtotal = inv.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const total = subtotal * (1 + inv.taxRate / 100);
    revenueByCurrency.set(inv.currency, (revenueByCurrency.get(inv.currency) ?? 0) + total);

    const area = inv.crmClient?.legalArea ?? "Sem área";
    const key = `${area}|${inv.currency}`;
    revenueByArea.set(key, (revenueByArea.get(key) ?? 0) + total);
  }

  return {
    newClientsCount: newClients.length,
    finishedCount: finishedInPeriod,
    conversionRate: newClients.length > 0 ? Math.round((finishedInPeriod / newClients.length) * 1000) / 10 : 0,
    revenueByCurrency: Object.fromEntries(revenueByCurrency),
    revenueByArea: Array.from(revenueByArea.entries()).map(([key, amount]) => {
      const [area, currency] = key.split("|");
      return { area, currency, amount: Math.round(amount * 100) / 100 };
    }),
  };
}

export async function getPerformanceReport(workspaceUserId: string, period: Period) {
  const { current, previous } = getRanges(period);
  const [currentMetrics, previousMetrics] = await Promise.all([
    computeMetrics(workspaceUserId, current),
    computeMetrics(workspaceUserId, previous),
  ]);

  const allCurrencies = new Set([
    ...Object.keys(currentMetrics.revenueByCurrency),
    ...Object.keys(previousMetrics.revenueByCurrency),
  ]);

  return {
    period,
    currentLabel: current.label,
    previousLabel: previous.label,
    newClients: {
      current: currentMetrics.newClientsCount,
      previous: previousMetrics.newClientsCount,
      changePct: pctChange(currentMetrics.newClientsCount, previousMetrics.newClientsCount),
    },
    conversionRate: {
      current: currentMetrics.conversionRate,
      previous: previousMetrics.conversionRate,
      changePct: pctChange(currentMetrics.conversionRate, previousMetrics.conversionRate),
    },
    revenue: Array.from(allCurrencies).map((currency) => ({
      currency,
      current: Math.round((currentMetrics.revenueByCurrency[currency] ?? 0) * 100) / 100,
      previous: Math.round((previousMetrics.revenueByCurrency[currency] ?? 0) * 100) / 100,
      changePct: pctChange(currentMetrics.revenueByCurrency[currency] ?? 0, previousMetrics.revenueByCurrency[currency] ?? 0),
    })),
    revenueByArea: currentMetrics.revenueByArea,
  };
}
