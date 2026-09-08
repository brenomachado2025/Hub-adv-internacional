import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Relatórios</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Performance do escritório: novos clientes, conversão do funil e faturamento.
        </p>
      </div>
      <ReportsView />
    </div>
  );
}
