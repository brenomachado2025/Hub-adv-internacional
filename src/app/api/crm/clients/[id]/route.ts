import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { onlyDigits } from "@/lib/data/crm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({
    where: { id },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } },
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
    status,
  } = body as {
    fullName?: string;
    documentType?: string;
    documentNumber?: string;
    legalArea?: string;
    companyName?: string;
    city?: string;
    phone?: string;
    status?: string;
  };

  const newStatus = status && status !== existing.status ? status : undefined;

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
      ...(status !== undefined ? { status } : {}),
      ...(newStatus ? { statusHistory: { create: { status: newStatus } } } : {}),
    },
  });

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
