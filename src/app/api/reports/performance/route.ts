import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { getPerformanceReport, type Period } from "@/lib/reports/performance";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const periodParam = req.nextUrl.searchParams.get("period");
  const period: Period = periodParam === "quarter" ? "quarter" : "month";

  const report = await getPerformanceReport(workspaceUserId, period);
  return NextResponse.json({ report });
}
