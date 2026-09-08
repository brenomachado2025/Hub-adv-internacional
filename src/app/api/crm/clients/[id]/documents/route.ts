import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { fillTemplate } from "@/lib/data/documents";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const documents = await prisma.crmDocument.findMany({ where: { clientId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const { templateId } = (await req.json()) as { templateId?: string };
  if (!templateId) return NextResponse.json({ error: "templateId é obrigatório" }, { status: 400 });

  const template = await prisma.crmDocumentTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
  }

  const owner = await prisma.user.findUnique({ where: { id: workspaceUserId } });
  const content = fillTemplate(template.body, client, owner?.name || owner?.email || "");

  // Documento gerado pelo próprio dono da conta não precisa de revisão; gerado por
  // um membro da equipe (ex.: estagiário) entra como pendente de aprovação antes
  // de poder ser marcado como enviado ao cliente.
  const isOwnerActing = user.userId === workspaceUserId;

  const document = await prisma.crmDocument.create({
    data: {
      clientId: id,
      templateId: template.id,
      title: template.title,
      content,
      createdBy: user.name || user.email,
      status: isOwnerActing ? "APPROVED" : "PENDING_APPROVAL",
      approvedAt: isOwnerActing ? new Date() : null,
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "DOCUMENT",
      description: isOwnerActing
        ? `Documento gerado: ${document.title}`
        : `Documento gerado (pendente de aprovação): ${document.title}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ document });
}
