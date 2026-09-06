import { XMLParser } from "fast-xml-parser";
import { NormalizedSanctionEntry, toArray, textOf } from "./types";

const SOURCE_URL = "https://scsanctions.un.org/resources/xml/en/consolidated.xml";

export async function fetchUnList(): Promise<NormalizedSanctionEntry[]> {
  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`ONU: falha ao baixar lista (${res.status})`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, textNodeName: "#text" });
  const doc = parser.parse(xml);

  const root = doc?.CONSOLIDATED_LIST ?? doc?.["CONSOLIDATED_LIST"];
  const individuals = toArray(root?.INDIVIDUALS?.INDIVIDUAL);
  const entities = toArray(root?.ENTITIES?.ENTITY);

  const fromIndividuals: NormalizedSanctionEntry[] = individuals.map(
    (ind: Record<string, unknown>): NormalizedSanctionEntry => {
      const nameParts = [
        textOf(ind.FIRST_NAME),
        textOf(ind.SECOND_NAME),
        textOf(ind.THIRD_NAME),
        textOf(ind.FOURTH_NAME),
      ].filter(Boolean);
      const name = nameParts.join(" ") || "(sem nome)";

      const aliasList = toArray(
        (ind.INDIVIDUAL_ALIAS as Record<string, unknown>) as unknown
      ) as Record<string, unknown>[];
      const aliases = aliasList.map((a) => textOf(a.ALIAS_NAME)).filter(Boolean);

      const nationalityList = toArray(
        (ind.NATIONALITY as Record<string, unknown>)?.VALUE as unknown
      );
      const countries = nationalityList.map((v) => textOf(v)).filter(Boolean);

      return {
        externalId: textOf(ind.DATAID) || textOf(ind.REFERENCE_NUMBER) || name,
        source: "UN",
        name,
        aliases,
        entityType: "Individual",
        programs: [textOf(ind.UN_LIST_TYPE)].filter(Boolean),
        countries,
        listedDate: textOf(ind.LISTED_ON) || "",
      };
    }
  );

  const fromEntities: NormalizedSanctionEntry[] = entities.map(
    (ent: Record<string, unknown>): NormalizedSanctionEntry => {
      const name = textOf(ent.FIRST_NAME) || "(sem nome)";

      const aliasList = toArray(
        (ent.ENTITY_ALIAS as Record<string, unknown>) as unknown
      ) as Record<string, unknown>[];
      const aliases = aliasList.map((a) => textOf(a.ALIAS_NAME)).filter(Boolean);

      return {
        externalId: textOf(ent.DATAID) || textOf(ent.REFERENCE_NUMBER) || name,
        source: "UN",
        name,
        aliases,
        entityType: "Entity",
        programs: [textOf(ent.UN_LIST_TYPE)].filter(Boolean),
        countries: [],
        listedDate: textOf(ent.LISTED_ON) || "",
      };
    }
  );

  return [...fromIndividuals, ...fromEntities];
}
