import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasFinanceAccess } from "@/lib/team";

export async function FinanceAccessGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allowed = await hasFinanceAccess(user.userId);
  if (!allowed) {
    return (
      <div className="flex flex-col items-center text-center gap-2 py-16 px-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
          <Lock size={22} strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Sem acesso a dados financeiros</p>
        <p className="text-xs text-neutral-400 max-w-xs">
          O dono da conta restringiu seu acesso a honorários e faturas. Fale com ele se precisar dessa informação.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
