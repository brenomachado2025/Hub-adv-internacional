export const LEGAL_AREAS = [
  "Direito Internacional",
  "Societário",
  "Contratos",
  "Tributário",
  "Trabalhista",
  "Outro",
] as const;

export type LegalArea = (typeof LEGAL_AREAS)[number];

export const CRM_STATUSES = [
  { value: "CONTACTED", label: "Entrou em contato" },
  { value: "INITIALIZED", label: "Cliente inicializado" },
  { value: "IN_PROGRESS", label: "Cliente em andamento" },
  { value: "FINISHED", label: "Cliente finalizado" },
] as const;

export type CrmStatus = (typeof CRM_STATUSES)[number]["value"];

export const CRM_STATUS_ORDER: CrmStatus[] = CRM_STATUSES.map((s) => s.value);

export function crmStatusLabel(status: string): string {
  return CRM_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function nextCrmStatus(status: string): CrmStatus | null {
  const idx = CRM_STATUS_ORDER.indexOf(status as CrmStatus);
  if (idx === -1 || idx === CRM_STATUS_ORDER.length - 1) return null;
  return CRM_STATUS_ORDER[idx + 1];
}

export function previousCrmStatus(status: string): CrmStatus | null {
  const idx = CRM_STATUS_ORDER.indexOf(status as CrmStatus);
  if (idx <= 0) return null;
  return CRM_STATUS_ORDER[idx - 1];
}

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata uma string de dígitos como CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function formatDocument(documentType: string, rawValue: string): string {
  const digits = onlyDigits(rawValue);
  if (documentType === "CNPJ") {
    return digits
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
