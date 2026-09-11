import crypto from "crypto";

// Consolidated Screening List (developer.trade.gov) - consolida 11 listas de screening
// (Comércio, Estado e Tesouro dos EUA) num único endpoint de busca por nome.
// É uma API de busca, não de dump completo - por isso é usada aqui como enriquecimento
// em tempo real da busca de due diligence, não como fonte de sincronização periódica.
export type CslSearchResult = {
  id: string;
  source: string;
  name: string;
  aliases: string;
  entityType: string;
  programs: string;
  countries: string;
  listedDate: string;
};

export async function searchCsl(query: string): Promise<CslSearchResult[]> {
  const apiKey = process.env.TRADE_GOV_API_KEY;
  if (!apiKey || !query.trim()) return [];

  try {
    const params = new URLSearchParams({ api_key: apiKey, q: query, size: "25" });
    const res = await fetch(`https://api.trade.gov/consolidated_screening_list/search?${params.toString()}`, {
      cache: "no-store",
    });
    // Enriquecimento é best-effort: se a fonte externa falhar, a busca local continua
    // funcionando normalmente - nunca deve derrubar a busca principal de sanções.
    if (!res.ok) return [];

    const data = await res.json();
    const results: Record<string, unknown>[] = data?.results ?? [];

    return results.map((r) => ({
      id: `csl-${String(r.id ?? crypto.randomUUID())}`,
      source: "CSL",
      name: String(r.name ?? "(sem nome)"),
      aliases: Array.isArray(r.alt_names) ? (r.alt_names as unknown[]).join("; ") : "",
      entityType: String(r.type ?? ""),
      programs: Array.isArray(r.programs) ? (r.programs as unknown[]).join("; ") : String(r.source ?? ""),
      countries: Array.isArray(r.countries) ? (r.countries as unknown[]).join("; ") : String(r.country ?? ""),
      listedDate: String(r.start_date ?? ""),
    }));
  } catch {
    return [];
  }
}
