import { formatDocument, crmStatusLabel } from "@/lib/data/crm";

type ClientLike = {
  fullName: string;
  documentType: string;
  documentNumber: string;
  legalArea: string;
  companyName: string;
  city: string;
  phone: string;
  email: string;
  status: string;
};

export function fillTemplate(body: string, client: ClientLike, issuerName: string): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const values: Record<string, string> = {
    fullName: client.fullName,
    documentType: client.documentType,
    documentNumber: formatDocument(client.documentType, client.documentNumber) || "-",
    legalArea: client.legalArea,
    companyName: client.companyName || "-",
    city: client.city || "-",
    phone: client.phone || "-",
    email: client.email || "-",
    status: crmStatusLabel(client.status),
    issuerName,
    today,
  };

  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
}

export const DOCUMENT_PLACEHOLDERS = [
  "fullName",
  "documentType",
  "documentNumber",
  "legalArea",
  "companyName",
  "city",
  "phone",
  "email",
  "status",
  "issuerName",
  "today",
] as const;
