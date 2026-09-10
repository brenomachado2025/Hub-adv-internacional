import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { TeamChat } from "@/components/team/TeamChat";

export const dynamic = "force-dynamic";

export default async function ChatEquipePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chat da Equipe</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Conversa interna entre você e sua equipe — separado das conversas de WhatsApp com clientes.
        </p>
      </div>
      <TeamChat />
    </div>
  );
}
