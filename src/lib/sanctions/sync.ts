import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NormalizedSanctionEntry } from "./types";
import { fetchOfacList } from "./ofac";
import { fetchEuList } from "./eu";
import { fetchUnList } from "./un";

function hashEntry(e: NormalizedSanctionEntry): string {
  const payload = JSON.stringify({
    name: e.name,
    aliases: [...e.aliases].sort(),
    entityType: e.entityType,
    programs: [...e.programs].sort(),
    countries: [...e.countries].sort(),
    listedDate: e.listedDate,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

const FETCHERS: Record<string, () => Promise<NormalizedSanctionEntry[]>> = {
  OFAC: fetchOfacList,
  EU: fetchEuList,
  UN: fetchUnList,
};

// Evita corridas: duas chamadas concorrentes para a mesma fonte (ex.: sync manual
// disparado enquanto a sincronização automática de fundo já está rodando) reutilizam
// a mesma execução em vez de inserir os mesmos registros em paralelo.
const runningSyncs = new Map<string, ReturnType<typeof runSync>>();

export function syncSanctionSource(source: "OFAC" | "EU" | "UN") {
  const existing = runningSyncs.get(source);
  if (existing) return existing;

  const promise = runSync(source).finally(() => {
    runningSyncs.delete(source);
  });
  runningSyncs.set(source, promise);
  return promise;
}

async function runSync(source: "OFAC" | "EU" | "UN") {
  const startedAt = new Date();
  try {
    const entries = await FETCHERS[source]();
    let changesCount = 0;

    const existing = await prisma.sanctionEntry.findMany({ where: { source } });
    const existingById = new Map(existing.map((e) => [e.externalId, e]));
    const seenIds = new Set<string>();

    for (const entry of entries) {
      seenIds.add(entry.externalId);
      const hash = hashEntry(entry);
      const prev = existingById.get(entry.externalId);

      if (!prev) {
        await prisma.sanctionEntry.create({
          data: {
            externalId: entry.externalId,
            source,
            name: entry.name,
            aliases: entry.aliases.join("; "),
            entityType: entry.entityType,
            programs: entry.programs.join("; "),
            countries: entry.countries.join("; "),
            listedDate: entry.listedDate,
            rawHash: hash,
          },
        });
        await prisma.sanctionChangeEvent.create({
          data: {
            source,
            externalId: entry.externalId,
            entryName: entry.name,
            changeType: "ADDED",
            details: `Nova entrada na lista ${source}. Programas/jurisdição: ${entry.programs.join(", ") || "-"}`,
          },
        });
        changesCount++;
      } else if (prev.rawHash !== hash) {
        const changedFields: string[] = [];
        if (prev.programs !== entry.programs.join("; ")) {
          changedFields.push(
            `programas/jurisdição: "${prev.programs}" → "${entry.programs.join("; ")}"`
          );
        }
        if (prev.countries !== entry.countries.join("; ")) {
          changedFields.push(
            `países: "${prev.countries}" → "${entry.countries.join("; ")}"`
          );
        }
        if (changedFields.length === 0) changedFields.push("dados cadastrais atualizados");

        await prisma.sanctionEntry.update({
          where: { id: prev.id },
          data: {
            name: entry.name,
            aliases: entry.aliases.join("; "),
            entityType: entry.entityType,
            programs: entry.programs.join("; "),
            countries: entry.countries.join("; "),
            listedDate: entry.listedDate,
            rawHash: hash,
            lastSeenAt: new Date(),
            active: true,
          },
        });
        await prisma.sanctionChangeEvent.create({
          data: {
            entryId: prev.id,
            source,
            externalId: entry.externalId,
            entryName: entry.name,
            changeType: "MODIFIED",
            details: changedFields.join(" | "),
          },
        });
        changesCount++;
      } else {
        await prisma.sanctionEntry.update({
          where: { id: prev.id },
          data: { lastSeenAt: new Date() },
        });
      }
    }

    // Entradas que saíram da lista (removidas/deslistadas)
    for (const prev of existing) {
      if (!seenIds.has(prev.externalId) && prev.active) {
        await prisma.sanctionEntry.update({ where: { id: prev.id }, data: { active: false } });
        await prisma.sanctionChangeEvent.create({
          data: {
            entryId: prev.id,
            source,
            externalId: prev.externalId,
            entryName: prev.name,
            changeType: "REMOVED",
            details: `Entrada removida/deslistada da lista ${source}`,
          },
        });
        changesCount++;
      }
    }

    if (changesCount > 0) {
      await prisma.notification.create({
        data: {
          type: "SANCTIONS",
          sender: "Monitor de Sanções",
          subject: `${changesCount} mudança(s) detectada(s) na lista ${source}`,
          body: `A sincronização da lista de sanções ${source} identificou ${changesCount} mudança(s) (inclusões, remoções ou alterações de jurisdição/programa). Consulte o histórico de sanções para detalhes completos.`,
        },
      });
    }

    await prisma.sanctionSyncRun.create({
      data: {
        source,
        status: "SUCCESS",
        entriesCount: entries.length,
        changesCount,
        startedAt,
        finishedAt: new Date(),
      },
    });

    return { source, status: "SUCCESS" as const, entriesCount: entries.length, changesCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.sanctionSyncRun.create({
      data: {
        source,
        status: "ERROR",
        message,
        startedAt,
        finishedAt: new Date(),
      },
    });
    return { source, status: "ERROR" as const, message };
  }
}

export async function syncAllSources() {
  const sources: ("OFAC" | "EU" | "UN")[] = ["OFAC", "EU", "UN"];
  const results = [];
  for (const source of sources) {
    results.push(await syncSanctionSource(source));
  }
  return results;
}
