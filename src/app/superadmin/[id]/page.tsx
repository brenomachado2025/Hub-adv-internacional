import { redirect } from "next/navigation";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";
import { SuperadminAccountDetail } from "@/components/superadmin/SuperadminAccountDetail";

export const dynamic = "force-dynamic";

export default async function SuperadminAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) redirect("/superadmin/login");

  const { id } = await params;
  return <SuperadminAccountDetail accountId={id} />;
}
