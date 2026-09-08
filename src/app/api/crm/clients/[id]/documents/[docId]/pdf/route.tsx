import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { CrmDocumentPdf } from "@/lib/pdf/CrmDocumentPdf";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, docId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const document = await prisma.crmDocument.findUnique({ where: { id: docId } });
  if (!document || document.clientId !== id) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <CrmDocumentPdf
      title={document.title}
      content={document.content}
      createdAt={document.createdAt.toLocaleDateString("pt-BR")}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.title}.pdf"`,
    },
  });
}
