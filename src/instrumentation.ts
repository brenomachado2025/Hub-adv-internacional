// Executado uma vez quando o servidor Next.js inicia.
// Mantém uma sincronização periódica das listas de sanções em segundo plano
// enquanto o processo do servidor estiver rodando ("monitoramento contínuo").

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 horas

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { syncAllSources } = await import("@/lib/sanctions/sync");
  const { syncAllComplianceSources } = await import("@/lib/compliance/sync");
  const { checkLegalDeadlines } = await import("@/lib/legal/deadlines");
  const { checkOverdueInstallments } = await import("@/lib/finance/billing");
  const { checkStaleClients } = await import("@/lib/crm/followup");

  const runSync = () => {
    syncAllSources().catch((err) => {
      console.error("[internacional-hub] Falha na sincronização periódica de sanções:", err);
    });
  };

  const runComplianceSync = () => {
    syncAllComplianceSources().catch((err) => {
      console.error("[internacional-hub] Falha na sincronização periódica de legislação/regulamentos dos EUA:", err);
    });
  };
  setTimeout(runComplianceSync, 35_000);
  setInterval(runComplianceSync, SYNC_INTERVAL_MS);

  const runDeadlineCheck = () => {
    checkLegalDeadlines().catch((err) => {
      console.error("[internacional-hub] Falha ao verificar prazos processuais:", err);
    });
  };

  // Roda uma vez pouco depois do boot, depois repete no intervalo definido.
  setTimeout(runSync, 15_000);
  setInterval(runSync, SYNC_INTERVAL_MS);

  setTimeout(runDeadlineCheck, 20_000);
  setInterval(runDeadlineCheck, SYNC_INTERVAL_MS);

  const runOverdueCheck = () => {
    checkOverdueInstallments().catch((err) => {
      console.error("[internacional-hub] Falha ao verificar parcelas em atraso:", err);
    });
  };
  setTimeout(runOverdueCheck, 25_000);
  setInterval(runOverdueCheck, SYNC_INTERVAL_MS);

  const runStaleCheck = () => {
    checkStaleClients().catch((err) => {
      console.error("[internacional-hub] Falha ao verificar follow-up do funil:", err);
    });
  };
  setTimeout(runStaleCheck, 30_000);
  setInterval(runStaleCheck, SYNC_INTERVAL_MS);
}
