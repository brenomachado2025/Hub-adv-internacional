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
    const unchangedIds: string[] = [];

    // Em vez de uma escrita por linha (lento em rede - milhares de round-trips para
    // fontes grandes), agrupamos as operações e as enviamos em lote ao final.
    const toCreate: {
      externalId: string;
      name: string;
      aliases: string;
      entityType: string;
      programs: string;
      countries: string;
      listedDate: string;
      rawHash: string;
    }[] = [];
    const addedChangeEvents: { externalId: string; entryName: string; details: string }[] = [];
    const toUpdateModified: { id: string; data: Record<string, unknown> }[] = [];
    const modifiedChangeEvents: { entryId: string; externalId: string; entryName: string; details: string }[] = [];

    for (const entry of entries) {
      seenIds.add(entry.externalId);
      const hash = hashEntry(entry);
      const prev = existingById.get(entry.externalId);

      if (!prev) {
        toCreate.push({
          externalId: entry.externalId,
          name: entry.name,
          aliases: entry.aliases.join("; "),
          entityType: entry.entityType,
          programs: entry.programs.join("; "),
          countries: entry.countries.join("; "),
          listedDate: entry.listedDate,
          rawHash: hash,
        });
        addedChangeEvents.push({
          externalId: entry.externalId,
          entryName: entry.name,
          details: `Nova entrada na lista ${source}. Programas/jurisdição: ${entry.programs.join(", ") || "-"}`,
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

        toUpdateModified.push({
          id: prev.id,
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
        modifiedChangeEvents.push({
          entryId: prev.id,
          externalId: entry.externalId,
          entryName: entry.name,
          details: changedFields.join(" | "),
        });
        changesCount++;
      } else {
        unchangedIds.push(prev.id);
      }
    }

    if (toCreate.length > 0) {
      await prisma.sanctionEntry.createMany({
        data: toCreate.map((e) => ({ ...e, source })),
      });
      await prisma.sanctionChangeEvent.createMany({
        data: addedChangeEvents.map((e) => ({
          source,
          externalId: e.externalId,
          entryName: e.entryName,
          changeType: "ADDED",
          details: e.details,
        })),
      });
    }

    if (unchangedIds.length > 0) {
      await prisma.sanctionEntry.updateMany({
        where: { id: { in: unchangedIds } },
        data: { lastSeenAt: new Date() },
      });
    }

    if (toUpdateModified.length > 0) {
      await prisma.$transaction(
        toUpdateModified.map((u) => prisma.sanctionEntry.update({ where: { id: u.id }, data: u.data }))
      );
      await prisma.sanctionChangeEvent.createMany({
        data: modifiedChangeEvents.map((e) => ({
          entryId: e.entryId,
          source,
          externalId: e.externalId,
          entryName: e.entryName,
          changeType: "MODIFIED",
          details: e.details,
        })),
      });
    }

    // Entradas que saíram da lista (removidas/deslistadas)
    const removed = existing.filter((prev) => !seenIds.has(prev.externalId) && prev.active);
    if (removed.length > 0) {
      await prisma.sanctionEntry.updateMany({
        where: { id: { in: removed.map((r) => r.id) } },
        data: { active: false },
      });
      await prisma.sanctionChangeEvent.createMany({
        data: removed.map((prev) => ({
          entryId: prev.id,
          source,
          externalId: prev.externalId,
          entryName: prev.name,
          changeType: "REMOVED",
          details: `Entrada removida/deslistada da lista ${source}`,
        })),
      });
      changesCount += removed.length;
    }

    if (changesCount > 0) {
      // Alerta de sanções é relevante para todo mundo que usa o hub - distribui uma cópia
      // da notificação para cada conta existente.
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u) => ({
            userId: u.id,
            type: "SANCTIONS",
            sender: "Monitor de Sanções",
            subject: `${changesCount} mudança(s) detectada(s) na lista ${source}`,
            body: `A sincronização da lista de sanções ${source} identificou ${changesCount} mudança(s) (inclusões, remoções ou alterações de jurisdição/programa). Consulte o histórico de sanções para detalhes completos.`,
          })),
        });
      }
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
