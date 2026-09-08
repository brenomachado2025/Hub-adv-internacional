import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AutomationsView } from "@/components/automations/AutomationsView";

export const dynamic = "force-dynamic";

export default async function AutomacoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Automações</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Regras "se isso, então aquilo" que rodam sozinhas — sem precisar programar nada.
        </p>
      </div>
      <AutomationsView />
    </div>
  );
}
