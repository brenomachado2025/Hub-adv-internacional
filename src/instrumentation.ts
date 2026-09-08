// Executado uma vez quando o servidor Next.js inicia.
// Mantém uma sincronização periódica das listas de sanções em segundo plano
// enquanto o processo do servidor estiver rodando ("monitoramento contínuo").

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 horas

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { syncAllSources } = await import("@/lib/sanctions/sync");
  const { checkLegalDeadlines } = await import("@/lib/legal/deadlines");

  const runSync = () => {
    syncAllSources().catch((err) => {
      console.error("[internacional-hub] Falha na sincronização periódica de sanções:", err);
    });
  };

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
}
