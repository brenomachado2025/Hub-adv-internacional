import { NormalizedComplianceEvent, MissingApiKeyError } from "../types";

// Congress.gov API v3 (via api.data.gov) - exige chave gratuita.
// https://api.congress.gov/ - 5.000 requisições/hora por chave.
const TERMS = ["sanction", "export control"];

const BILL_TYPE_PATH: Record<string, string> = {
  HR: "house-bill",
  S: "senate-bill",
  HRES: "house-resolution",
  SRES: "senate-resolution",
  HJRES: "house-joint-resolution",
  SJRES: "senate-joint-resolution",
};

export async function fetchCongressGovList(): Promise<NormalizedComplianceEvent[]> {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) throw new MissingApiKeyError("CONGRESS_GOV_API_KEY não configurada");

  const url = `https://api.congress.gov/v3/bill?api_key=${apiKey}&sort=updateDate+desc&limit=100&format=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Congress.gov: falha ao buscar projetos de lei (${res.status})`);
  const data = await res.json();
  const bills: Record<string, unknown>[] = data?.bills ?? [];

  return bills
    .filter((b) => {
      const title = String(b.title ?? "").toLowerCase();
      return TERMS.some((t) => title.includes(t));
    })
    .map((b): NormalizedComplianceEvent => {
      const number = String(b.number ?? "");
      const type = String(b.type ?? "").toUpperCase();
      const congress = String(b.congress ?? "");
      const latestAction = (b.latestAction as Record<string, unknown>) ?? {};
      const path = BILL_TYPE_PATH[type] ?? type.toLowerCase();

      return {
        externalId: `${congress}-${type}${number}`,
        eventType: "LEGISLATION",
        source: "CONGRESS_GOV",
        issuingBody: "Congresso dos EUA",
        title: String(b.title ?? "(sem título)"),
        summary: String(latestAction.text ?? ""),
        severity: "MEDIUM",
        publishedDate: String(b.updateDate ?? new Date().toISOString()),
        sourceUrl: `https://www.congress.gov/bill/${congress}th-congress/${path}/${number}`,
      };
    });
}
