import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
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

  const { status } = (await req.json()) as { status?: string };

  if (status === "APPROVED") {
    if (document.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Documento não está pendente de aprovação" }, { status: 400 });
    }
    if (user.userId !== workspaceUserId) {
      return NextResponse.json({ error: "Só o dono da conta pode aprovar documentos." }, { status: 403 });
    }
  } else if (status === "SENT") {
    if (document.status !== "APPROVED") {
      return NextResponse.json({ error: "Documento precisa estar aprovado antes de ser enviado." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const updated = await prisma.crmDocument.update({
    where: { id: docId },
    data: {
      status,
      ...(status === "APPROVED" ? { approvedAt: new Date() } : {}),
      ...(status === "SENT" ? { sentAt: new Date() } : {}),
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "DOCUMENT",
      description: status === "APPROVED" ? `Documento aprovado: ${document.title}` : `Documento marcado como enviado: ${document.title}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ document: updated });
}
