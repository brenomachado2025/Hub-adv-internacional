export type ComplianceSource = "FEDERAL_REGISTER" | "CONGRESS_GOV" | "GOVINFO";
export type ComplianceEventType = "REGULATION" | "LEGISLATION";
export type ComplianceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NormalizedComplianceEvent = {
  externalId: string;
  eventType: ComplianceEventType;
  source: ComplianceSource;
  issuingBody: string;
  title: string;
  summary: string;
  severity: ComplianceSeverity;
  publishedDate: string; // ISO
  sourceUrl: string;
};

// Lançado pelos fetchers quando a fonte exige uma chave de API (Congress.gov, GovInfo)
// que ainda não foi configurada. O motor de sync trata isso como "SKIPPED", não "ERROR" -
// não é uma falha, é uma fonte que aguarda credencial.
export class MissingApiKeyError extends Error {}
