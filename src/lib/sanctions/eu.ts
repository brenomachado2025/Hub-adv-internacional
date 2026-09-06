import { parse } from "csv-parse/sync";
import { NormalizedSanctionEntry } from "./types";

// Lista Consolidada de Sanções Financeiras da UE.
// A fonte oficial da Comissão Europeia (webgate.ec.europa.eu) exige login pessoal via EU Login
// (sessão autenticada por cookie), o que não é compatível com sincronização automática em segundo
// plano. Em vez disso, usamos o espelho público e sem autenticação da OpenSanctions.org — organização
// open-source de dados de compliance amplamente usada no mercado — que republica esta mesma lista
// diariamente a partir da fonte oficial.
const SOURCE_URL = "https://data.opensanctions.org/datasets/latest/eu_fsf/targets.simple.csv";

type CsvRow = {
  id: string;
  schema: string;
  name: string;
  aliases: string;
  countries: string;
  program_ids: string;
  first_seen: string;
};

export async function fetchEuList(): Promise<NormalizedSanctionEntry[]> {
  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`UE: falha ao baixar lista (${res.status})`);
  const csv = await res.text();

  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as CsvRow[];

  return rows.map((row): NormalizedSanctionEntry => {
    const aliases = row.aliases ? row.aliases.split(";").map((a) => a.trim()).filter(Boolean) : [];
    const countries = row.countries
      ? row.countries.split(";").map((c) => c.trim().toUpperCase()).filter(Boolean)
      : [];
    const programs = row.program_ids
      ? row.program_ids.split(";").map((p) => p.trim()).filter(Boolean)
      : [];

    return {
      externalId: row.id,
      source: "EU",
      name: row.name || "(sem nome)",
      aliases,
      entityType: row.schema || "Unknown",
      programs,
      countries,
      listedDate: row.first_seen || "",
    };
  });
}
