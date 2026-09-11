import { NormalizedComplianceEvent } from "../types";

// API pública do Federal Register - sem chave, sem autenticação.
// https://www.federalregister.gov/developers/documentation/api/v1
const BASE = "https://www.federalregister.gov/api/v1/documents.json";
const AGENCIES = ["treasury-department", "commerce-department"];
const TERMS = ["sanctions", "export control"];

type FrDoc = {
  title: string;
  type: string;
  abstract: string | null;
  document_number: string;
  html_url: string;
  publication_date: string;
  agencies?: { name: string }[];
};

function severityForType(type: string): NormalizedComplianceEvent["severity"] {
  if (type === "Rule") return "HIGH";
  if (type === "Proposed Rule") return "MEDIUM";
  return "LOW";
}

export async function fetchFederalRegisterList(): Promise<NormalizedComplianceEvent[]> {
  const seen = new Map<string, FrDoc>();

  for (const term of TERMS) {
    const params = new URLSearchParams();
    params.set("conditions[term]", term);
    for (const agency of AGENCIES) params.append("conditions[agencies][]", agency);
    params.set("order", "newest");
    params.set("per_page", "40");

    const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Federal Register: falha ao buscar documentos (${res.status})`);
    const data = await res.json();
    const results: FrDoc[] = data?.results ?? [];
    for (const doc of results) {
      if (doc.document_number) seen.set(doc.document_number, doc);
    }
  }

  return Array.from(seen.values()).map((doc): NormalizedComplianceEvent => ({
    externalId: doc.document_number,
    eventType: "REGULATION",
    source: "FEDERAL_REGISTER",
    issuingBody: doc.agencies?.map((a) => a.name).join(", ") || "Federal Register",
    title: doc.title,
    summary: doc.abstract ?? "",
    severity: severityForType(doc.type),
    publishedDate: doc.publication_date,
    sourceUrl: doc.html_url,
  }));
}
