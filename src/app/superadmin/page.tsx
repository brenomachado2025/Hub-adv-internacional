import { redirect } from "next/navigation";
import { getSuperadminAccess } from "@/lib/auth/superadmin-session";
import { SuperadminDashboard } from "@/components/superadmin/SuperadminDashboard";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const superadmin = await getSuperadminAccess();
  if (!superadmin) redirect("/superadmin/login");

  return <SuperadminDashboard />;
}
