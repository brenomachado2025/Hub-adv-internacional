import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId, getWorkspaceUserIds } from "@/lib/team";
import { onlyDigits, crmStatusLabel } from "@/lib/data/crm";
import { runClientStatusChangedAutomations } from "@/lib/automations/engine";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({
    where: { id },
    include: { statusHistory: { orderBy: { changedAt: "asc" } }, assignee: { select: { id: true, name: true, email: true } } },
  });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const existing = await prisma.crmClient.findUnique({ where: { id } });
  if (!existing || existing.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const {
    fullName,
    documentType,
    documentNumber,
    legalArea,
    companyName,
    city,
    phone,
    email,
    status,
    assigneeId,
  } = body as {
    fullName?: string;
    documentType?: string;
    documentNumber?: string;
    legalArea?: string;
    companyName?: string;
    city?: string;
    phone?: string;
    email?: string;
    status?: string;
    assigneeId?: string | null;
  };

  const newStatus = status && status !== existing.status ? status : undefined;
  const newAssignee = assigneeId !== undefined && assigneeId !== existing.assigneeId;

  if (newAssignee && assigneeId) {
    const workspaceMemberIds = await getWorkspaceUserIds(workspaceUserId);
    if (!workspaceMemberIds.includes(assigneeId)) {
      return NextResponse.json({ error: "Responsável inválido" }, { status: 400 });
    }
  }

  const client = await prisma.crmClient.update({
    where: { id },
    data: {
      ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
      ...(documentType !== undefined ? { documentType: documentType === "CNPJ" ? "CNPJ" : "CPF" } : {}),
      ...(documentNumber !== undefined ? { documentNumber: onlyDigits(documentNumber) } : {}),
      ...(legalArea !== undefined ? { legalArea } : {}),
      ...(companyName !== undefined ? { companyName: companyName.trim() } : {}),
      ...(city !== undefined ? { city: city.trim() } : {}),
      ...(phone !== undefined ? { phone: onlyDigits(phone) } : {}),
      ...(email !== undefined ? { email: email.trim() } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(assigneeId !== undefined ? { assigneeId: assigneeId || null } : {}),
      ...(newStatus ? { statusHistory: { create: { status: newStatus } }, lastFollowUpAlertAt: null } : {}),
    },
  });

  if (newStatus) {
    await prisma.crmActivity.create({
      data: {
        clientId: id,
        type: "STATUS_CHANGE",
        description: `Status alterado para "${crmStatusLabel(newStatus)}"`,
        actor: user.name || user.email,
      },
    });
  }

  if (newAssignee) {
    const assigneeUser = assigneeId ? await prisma.user.findUnique({ where: { id: assigneeId } }) : null;
    await prisma.crmAssignmentHistory.create({
      data: { clientId: id, assigneeId: assigneeId || null, assigneeName: assigneeUser?.name || assigneeUser?.email || "" },
    });
    await prisma.crmActivity.create({
      data: {
        clientId: id,
        type: "ASSIGNMENT",
        description: assigneeUser
          ? `Cliente atribuído a ${assigneeUser.name || assigneeUser.email}`
          : "Atribuição removida",
        actor: user.name || user.email,
      },
    });
  }

  if (newStatus && client.phone) {
    const hasIncomingMessage = await prisma.whatsappMessage.findFirst({
      where: { crmClientId: client.id, direction: "IN" },
    });
    const notifConfig = await prisma.whatsappStatusNotification.findUnique({
      where: { userId_status: { userId: workspaceUserId, status: newStatus } },
    });
    if (hasIncomingMessage && notifConfig?.enabled && notifConfig.message.trim()) {
      const delaySeconds = Math.floor(Math.random() * 26) + 5; // 5 a 30s, mesma humanização do bot
      await prisma.whatsappMessage.create({
        data: {
          userId: workspaceUserId,
          crmClientId: client.id,
          phone: client.phone,
          direction: "OUT",
          body: notifConfig.message,
          status: "QUEUED",
          scheduledFor: new Date(Date.now() + delaySeconds * 1000),
        },
      });
    }
  }

  if (newStatus) {
    await runClientStatusChangedAutomations(workspaceUserId, client, newStatus);
  }

  return NextResponse.json({ client });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const existing = await prisma.crmClient.findUnique({ where: { id } });
  if (!existing || existing.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  await prisma.crmClient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
