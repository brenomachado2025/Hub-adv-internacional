import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NormalizedComplianceEvent, MissingApiKeyError, ComplianceSource } from "./types";
import { fetchFederalRegisterList } from "./sources/federalRegister";
import { fetchCongressGovList } from "./sources/congressGov";
import { fetchGovInfoList } from "./sources/govInfo";

function hashEvent(e: NormalizedComplianceEvent): string {
  const payload = JSON.stringify({
    title: e.title,
    summary: e.summary,
    severity: e.severity,
    publishedDate: e.publishedDate,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

const FETCHERS: Record<ComplianceSource, () => Promise<NormalizedComplianceEvent[]>> = {
  FEDERAL_REGISTER: fetchFederalRegisterList,
  CONGRESS_GOV: fetchCongressGovList,
  GOVINFO: fetchGovInfoList,
};

// Mesmo padrão de sanctions/sync.ts: evita que duas chamadas concorrentes para a mesma
// fonte insiram os mesmos registros em paralelo.
const runningSyncs = new Map<string, ReturnType<typeof runSync>>();

export function syncComplianceSource(source: ComplianceSource) {
  const existing = runningSyncs.get(source);
  if (existing) return existing;

  const promise = runSync(source).finally(() => {
    runningSyncs.delete(source);
  });
  runningSyncs.set(source, promise);
  return promise;
}

async function runSync(source: ComplianceSource) {
  const startedAt = new Date();
  try {
    const events = await FETCHERS[source]();
    let changesCount = 0;

    const existing = await prisma.complianceEvent.findMany({ where: { source } });
    const existingById = new Map(existing.map((e) => [e.externalId, e]));

    const toCreate: {
      externalId: string;
      eventType: string;
      issuingBody: string;
      title: string;
      summary: string;
      severity: string;
      publishedDate: Date;
      sourceUrl: string;
      rawHash: string;
    }[] = [];
    const addedChangeEvents: { externalId: string; title: string; details: string }[] = [];
    const toUpdateModified: { id: string; data: Record<string, unknown> }[] = [];
    const modifiedChangeEvents: { eventId: string; externalId: string; title: string; details: string }[] = [];
    const unchangedIds: string[] = [];

    for (const event of events) {
      const hash = hashEvent(event);
      const prev = existingById.get(event.externalId);

      if (!prev) {
        toCreate.push({
          externalId: event.externalId,
          eventType: event.eventType,
          issuingBody: event.issuingBody,
          title: event.title,
          summary: event.summary,
          severity: event.severity,
          publishedDate: new Date(event.publishedDate),
          sourceUrl: event.sourceUrl,
          rawHash: hash,
        });
        addedChangeEvents.push({
          externalId: event.externalId,
          title: event.title,
          details: `Novo registro em ${source}. Órgão: ${event.issuingBody || "-"}`,
        });
        changesCount++;
      } else if (prev.rawHash !== hash) {
        toUpdateModified.push({
          id: prev.id,
          data: {
            title: event.title,
            summary: event.summary,
            severity: event.severity,
            issuingBody: event.issuingBody,
            sourceUrl: event.sourceUrl,
            rawHash: hash,
            lastSeenAt: new Date(),
            active: true,
          },
        });
        modifiedChangeEvents.push({
          eventId: prev.id,
          externalId: event.externalId,
          title: event.title,
          details: "Conteúdo atualizado na fonte",
        });
        changesCount++;
      } else {
        unchangedIds.push(prev.id);
      }
    }

    if (toCreate.length > 0) {
      await prisma.complianceEvent.createMany({
        data: toCreate.map((e) => ({ ...e, source })),
      });
      await prisma.complianceChangeEvent.createMany({
        data: addedChangeEvents.map((e) => ({
          source,
          externalId: e.externalId,
          title: e.title,
          changeType: "ADDED",
          details: e.details,
        })),
      });
    }

    if (unchangedIds.length > 0) {
      await prisma.complianceEvent.updateMany({
        where: { id: { in: unchangedIds } },
        data: { lastSeenAt: new Date() },
      });
    }

    if (toUpdateModified.length > 0) {
      await prisma.$transaction(
        toUpdateModified.map((u) => prisma.complianceEvent.update({ where: { id: u.id }, data: u.data }))
      );
      await prisma.complianceChangeEvent.createMany({
        data: modifiedChangeEvents.map((e) => ({
          eventId: e.eventId,
          source,
          externalId: e.externalId,
          title: e.title,
          changeType: "MODIFIED",
          details: e.details,
        })),
      });
    }

    // Diferente do módulo de sanções: legislação/regulamento não "desaparece" da fonte
    // (não há conceito de deslistagem), então não há passo de REMOVED aqui.

    if (changesCount > 0) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u) => ({
            userId: u.id,
            type: "SANCTIONS",
            sender: "Monitor de Compliance",
            subject: `${changesCount} atualização(ões) em legislação/regulamentos dos EUA (${source})`,
            body: `A sincronização de ${source} identificou ${changesCount} registro(s) novo(s) ou atualizado(s) de legislação/regulamento dos EUA relacionados a sanções e controle de exportação. Consulte a aba "Legislação & Regulamentos (EUA)" em Sanções.`,
          })),
        });
      }
    }

    await prisma.complianceSyncRun.create({
      data: {
        source,
        status: "SUCCESS",
        entriesCount: events.length,
        changesCount,
        startedAt,
        finishedAt: new Date(),
      },
    });

    return { source, status: "SUCCESS" as const, entriesCount: events.length, changesCount };
  } catch (err) {
    const skipped = err instanceof MissingApiKeyError;
    const message = err instanceof Error ? err.message : String(err);
    await prisma.complianceSyncRun.create({
      data: {
        source,
        status: skipped ? "SKIPPED" : "ERROR",
        message,
        startedAt,
        finishedAt: new Date(),
      },
    });
    if (skipped) return { source, status: "SKIPPED" as const, message };
    return { source, status: "ERROR" as const, message };
  }
}

export async function syncAllComplianceSources() {
  const sources: ComplianceSource[] = ["FEDERAL_REGISTER", "CONGRESS_GOV", "GOVINFO"];
  const results = [];
  for (const source of sources) {
    results.push(await syncComplianceSource(source));
  }
  return results;
}
