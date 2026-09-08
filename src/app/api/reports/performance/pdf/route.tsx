import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { getPerformanceReport, type Period } from "@/lib/reports/performance";
import { ReportPdf } from "@/lib/pdf/ReportPdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const periodParam = req.nextUrl.searchParams.get("period");
  const period: Period = periodParam === "quarter" ? "quarter" : "month";

  const report = await getPerformanceReport(workspaceUserId, period);
  const buffer = await renderToBuffer(
    <ReportPdf report={report} generatedAt={new Date().toLocaleString("pt-BR")} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-${report.currentLabel}.pdf"`,
    },
  });
}
