import { redirect } from "next/navigation";
import { getSuperadminAccess } from "@/lib/auth/superadmin-session";
import { SuperadminHealth } from "@/components/superadmin/SuperadminHealth";

export const dynamic = "force-dynamic";

export default async function SuperadminHealthPage() {
  const superadmin = await getSuperadminAccess();
  if (!superadmin) redirect("/superadmin/login");

  return <SuperadminHealth />;
}
