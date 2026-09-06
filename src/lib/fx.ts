// Integração com a Frankfurter API (taxas do BCE) - gratuita, sem chave.
// https://api.frankfurter.dev

export type FxRateResult = {
  rate: number;
  date: string;
  base: string;
  target: string;
};

export async function getExchangeRate(
  base: string,
  target: string,
  date?: string
): Promise<FxRateResult> {
  if (base === target) {
    return { rate: 1, date: date ?? new Date().toISOString().slice(0, 10), base, target };
  }

  const path = date ? date : "latest";
  const url = `https://api.frankfurter.dev/v1/${path}?base=${encodeURIComponent(
    base
  )}&symbols=${encodeURIComponent(target)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao consultar taxa de câmbio (${res.status})`);
  }
  const data = (await res.json()) as { rates: Record<string, number>; date: string };
  const rate = data.rates[target];
  if (rate === undefined) {
    throw new Error(`Moeda de destino não suportada: ${target}`);
  }
  return { rate, date: data.date, base, target };
}

export async function getRateHistory(
  base: string,
  target: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; rate: number }[]> {
  if (base === target) return [];
  const url = `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=${encodeURIComponent(
    base
  )}&symbols=${encodeURIComponent(target)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao consultar histórico de câmbio (${res.status})`);
  const data = (await res.json()) as { rates: Record<string, Record<string, number>> };
  return Object.entries(data.rates)
    .map(([date, rates]) => ({ date, rate: rates[target] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
