import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ClientDetail } from "@/components/crm/detail/ClientDetail";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  return <ClientDetail clientId={id} />;
}
