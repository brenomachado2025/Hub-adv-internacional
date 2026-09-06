export type NormalizedSanctionEntry = {
  externalId: string;
  source: "OFAC" | "EU" | "UN";
  name: string;
  aliases: string[];
  entityType: string;
  programs: string[];
  countries: string[];
  listedDate: string;
};

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function textOf(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
}
