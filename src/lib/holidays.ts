// Integração com Nager.Date - feriados públicos, gratuita, sem chave.
// https://date.nager.at
// Nota: cobertura de subdivisões (ex.: por estado dos EUA) é limitada nesta API pública;
// os feriados retornados para os EUA são majoritariamente federais.

export type PublicHoliday = {
  date: string; // YYYY-MM-DD
  localName: string;
  name: string;
  countryCode: string;
  global: boolean;
  counties?: string[] | null;
};

const cache = new Map<string, PublicHoliday[]>();

export async function getPublicHolidays(
  year: number,
  countryCode: string
): Promise<PublicHoliday[]> {
  const key = `${year}-${countryCode}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) {
      cache.set(key, []);
      return [];
    }
    throw new Error(`Falha ao consultar feriados de ${countryCode} (${res.status})`);
  }
  const data = (await res.json()) as PublicHoliday[];
  cache.set(key, data);
  return data;
}

export type ConflictZone = {
  date: string;
  holidayCountries: { countryCode: string; name: string }[];
  freeCountries: string[];
};

/**
 * Cruza feriados de múltiplos países num intervalo de anos e retorna as datas em que
 * pelo menos um país (mas não todos) tem feriado — "zonas de conflito" para agendamento.
 */
export function findConflictZones(
  holidaysByCountry: Record<string, PublicHoliday[]>,
  countryCodes: string[]
): ConflictZone[] {
  const byDate = new Map<string, { countryCode: string; name: string }[]>();

  for (const cc of countryCodes) {
    const holidays = holidaysByCountry[cc] ?? [];
    // Alguns países têm múltiplos registros no mesmo dia (subdivisões/estados);
    // deduplicamos por nome para não repetir o mesmo feriado na mesma data.
    const seenNames = new Set<string>();
    for (const h of holidays) {
      const key = `${h.date}|${h.localName}`;
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      const list = byDate.get(h.date) ?? [];
      list.push({ countryCode: cc, name: h.localName });
      byDate.set(h.date, list);
    }
  }

  const zones: ConflictZone[] = [];
  for (const [date, holidayCountries] of byDate.entries()) {
    if (holidayCountries.length === 0 || holidayCountries.length === countryCodes.length) continue;
    const holidaySet = new Set(holidayCountries.map((h) => h.countryCode));
    const freeCountries = countryCodes.filter((cc) => !holidaySet.has(cc));
    zones.push({ date, holidayCountries, freeCountries });
  }

  return zones.sort((a, b) => a.date.localeCompare(b.date));
}
