import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ProcessosList } from "@/components/crm/ProcessosList";

export const dynamic = "force-dynamic";

export default async function ProcessosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Processos</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Todos os processos vinculados a clientes, com prazos pendentes em destaque.
        </p>
      </div>
      <ProcessosList />
    </div>
  );
}
