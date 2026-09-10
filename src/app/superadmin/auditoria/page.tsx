import { redirect } from "next/navigation";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";
import { SuperadminAuditLog } from "@/components/superadmin/SuperadminAuditLog";

export const dynamic = "force-dynamic";

export default async function SuperadminAuditPage() {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) redirect("/superadmin/login");

  return <SuperadminAuditLog />;
}
