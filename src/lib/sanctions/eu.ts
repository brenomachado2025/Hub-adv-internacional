import { XMLParser } from "fast-xml-parser";
import { NormalizedSanctionEntry, toArray, textOf } from "./types";

// Lista Consolidada de Sanções Financeiras da UE (Financial Sanctions Database).
// A UE exige registro gratuito em https://webgate.ec.europa.eu/europeaid/fsd/fsf#!/files
// para obter um token pessoal de acesso ao XML completo. Configure-o em EU_SANCTIONS_TOKEN (.env).
function buildSourceUrl(): string {
  const token = process.env.EU_SANCTIONS_TOKEN;
  if (!token) {
    throw new Error(
      "UE: token de acesso não configurado. Registre-se em https://webgate.ec.europa.eu/europeaid/fsd/fsf#!/files e defina EU_SANCTIONS_TOKEN no .env"
    );
  }
  return `https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList/content?token=${encodeURIComponent(
    token
  )}`;
}

function attr(obj: Record<string, unknown> | undefined, name: string): string {
  if (!obj) return "";
  const v = obj[`@_${name}`];
  return v === undefined || v === null ? "" : String(v);
}

export async function fetchEuList(): Promise<NormalizedSanctionEntry[]> {
  const res = await fetch(buildSourceUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error(`UE: falha ao baixar lista (${res.status})`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });
  const doc = parser.parse(xml);

  const root = doc?.export ?? doc?.EXPORT ?? doc;
  const entities = toArray(root?.sanctionEntity);

  return entities.map((ent: Record<string, unknown>): NormalizedSanctionEntry => {
    const euRef = attr(ent, "euReferenceNumber") || attr(ent, "logicalId");

    const aliases = toArray(ent.nameAlias as unknown) as Record<string, unknown>[];
    const names = aliases.map((a) => {
      const whole = attr(a, "wholeName");
      if (whole) return whole;
      return [attr(a, "firstName"), attr(a, "middleName"), attr(a, "lastName")]
        .filter(Boolean)
        .join(" ");
    }).filter(Boolean);

    const strongAlias = aliases.find((a) => attr(a, "strong") === "true" || attr(a, "strong") === "STRONG");
    const primaryName =
      (strongAlias && (attr(strongAlias, "wholeName") ||
        [attr(strongAlias, "firstName"), attr(strongAlias, "lastName")].filter(Boolean).join(" "))) ||
      names[0] ||
      "(sem nome)";

    const otherNames = names.filter((n) => n !== primaryName);

    const regulations = toArray(ent.regulation as unknown) as Record<string, unknown>[];
    const programs = Array.from(
      new Set(regulations.map((r) => attr(r, "programme")).filter(Boolean))
    );

    const addresses = toArray(ent.address as unknown) as Record<string, unknown>[];
    const citizenships = toArray(ent.citizenship as unknown) as Record<string, unknown>[];
    const countries = Array.from(
      new Set(
        [...addresses.map((a) => attr(a, "countryDescription")), ...citizenships.map((c) => attr(c, "countryDescription"))].filter(
          Boolean
        )
      )
    );

    const subjectType = attr(ent.subjectType as Record<string, unknown>, "classificationCode");

    const latestPublication = regulations
      .map((r) => attr(r, "publicationDate"))
      .filter(Boolean)
      .sort()
      .pop();

    return {
      externalId: euRef || primaryName,
      source: "EU",
      name: primaryName,
      aliases: otherNames,
      entityType: subjectType || "Unknown",
      programs,
      countries,
      listedDate: latestPublication || "",
    };
  });
}
