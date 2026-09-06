import { XMLParser } from "fast-xml-parser";
import { NormalizedSanctionEntry, toArray, textOf } from "./types";

const SOURCE_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";

export async function fetchOfacList(): Promise<NormalizedSanctionEntry[]> {
  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`OFAC: falha ao baixar lista (${res.status})`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, textNodeName: "#text" });
  const doc = parser.parse(xml);

  const entries = toArray(doc?.sdnList?.sdnEntry);

  return entries.map((entry: Record<string, unknown>): NormalizedSanctionEntry => {
    const uid = textOf(entry.uid);
    const first = textOf(entry.firstName);
    const last = textOf(entry.lastName);
    const name = [first, last].filter(Boolean).join(" ") || last || first || "(sem nome)";

    const akaList = toArray((entry.akaList as Record<string, unknown>)?.aka as unknown) as Record<
      string,
      unknown
    >[];
    const aliases = akaList
      .map((aka) => [textOf(aka.firstName), textOf(aka.lastName)].filter(Boolean).join(" "))
      .filter(Boolean);

    const programList = toArray((entry.programList as Record<string, unknown>)?.program as unknown);
    const programs = programList.map((p) => textOf(p)).filter(Boolean);

    const addressList = toArray(
      (entry.addressList as Record<string, unknown>)?.address as unknown
    ) as Record<string, unknown>[];
    const countries = Array.from(new Set(addressList.map((a) => textOf(a.country)).filter(Boolean)));

    return {
      externalId: uid || name,
      source: "OFAC",
      name,
      aliases,
      entityType: textOf(entry.sdnType) || "Unknown",
      programs,
      countries,
      listedDate: textOf(entry.dateOfIssue) || "",
    };
  });
}
