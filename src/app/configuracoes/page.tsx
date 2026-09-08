import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SettingsShell } from "@/components/settings/SettingsShell";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-neutral-500 text-sm mt-1">Perfil, usuários e equipe do Hub.</p>
      </div>
      <SettingsShell />
    </div>
  );
}
