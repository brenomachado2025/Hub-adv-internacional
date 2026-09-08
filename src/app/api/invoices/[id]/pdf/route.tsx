import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });

  if (!invoice || invoice.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  }

  const buffer = await renderToBuffer(<InvoiceDocument invoice={invoice} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
