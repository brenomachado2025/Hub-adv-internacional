import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { clientId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id: clientId } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const messages = await prisma.whatsappMessage.findMany({
    where: { crmClientId: clientId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ client, messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { clientId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id: clientId } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  if (!client.phone) {
    return NextResponse.json({ error: "Cliente sem número de WhatsApp cadastrado" }, { status: 400 });
  }

  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  // Mensagem escrita por um humano no hub: sem o atraso de humanização do bot,
  // enviada assim que o worker rodar o próximo ciclo da fila (poucos segundos).
  const message = await prisma.whatsappMessage.create({
    data: {
      userId: workspaceUserId,
      crmClientId: clientId,
      phone: client.phone,
      direction: "OUT",
      body: text.trim(),
      source: "AGENT",
      status: "QUEUED",
      scheduledFor: new Date(),
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId,
      type: "WHATSAPP",
      description: `Mensagem enviada via WhatsApp: "${text.trim().slice(0, 100)}"`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ message });
}
