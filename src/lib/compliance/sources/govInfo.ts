import crypto from "crypto";
import { NormalizedComplianceEvent, MissingApiKeyError } from "../types";

// GovInfo API (via api.data.gov) - exige chave gratuita (mesma chave do Congress.gov
// funciona nos dois, ambos rodam sob api.data.gov). Limite padrão: 1.000 req/hora.
// https://api.govinfo.gov/docs/

export async function fetchGovInfoList(): Promise<NormalizedComplianceEvent[]> {
  const apiKey = process.env.GOVINFO_API_KEY;
  if (!apiKey) throw new MissingApiKeyError("GOVINFO_API_KEY não configurada");

  const res = await fetch(`https://api.govinfo.gov/search?api_key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: 'sanctions OR "export control"',
      pageSize: 50,
      offsetMark: "*",
      sorts: [{ field: "publishdate", sortOrder: "DESC" }],
      historical: false,
      collections: ["FR", "BILLS"],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GovInfo: falha ao buscar (${res.status})`);
  const data = await res.json();
  const results: Record<string, unknown>[] = data?.results ?? [];

  return results.map((r): NormalizedComplianceEvent => {
    const packageId = String(r.packageId ?? r.granuleId ?? crypto.randomUUID());
    const download = (r.download as Record<string, unknown>) ?? {};
    return {
      externalId: packageId,
      eventType: "REGULATION",
      source: "GOVINFO",
      issuingBody: String(r.governmentAuthor1 ?? r.publisher ?? "GovInfo"),
      title: String(r.title ?? "(sem título)"),
      summary: "",
      severity: "LOW",
      publishedDate: String(r.dateIssued ?? new Date().toISOString()),
      sourceUrl: String(download.pdfLink ?? r.resultLink ?? `https://www.govinfo.gov/app/details/${packageId}`),
    };
  });
}
