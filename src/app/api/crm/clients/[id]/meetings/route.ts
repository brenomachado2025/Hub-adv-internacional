import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const meetings = await prisma.crmMeeting.findMany({ where: { clientId: id }, orderBy: { scheduledFor: "asc" } });
  return NextResponse.json({ meetings });
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

  const { title, scheduledFor, notes } = (await req.json()) as {
    title?: string;
    scheduledFor?: string;
    notes?: string;
  };
  if (!title?.trim() || !scheduledFor) {
    return NextResponse.json({ error: "Título e data/hora são obrigatórios" }, { status: 400 });
  }

  const meeting = await prisma.crmMeeting.create({
    data: {
      clientId: id,
      title: title.trim(),
      scheduledFor: new Date(scheduledFor),
      notes: notes?.trim() ?? "",
    },
  });

  await prisma.notification.create({
    data: {
      userId: workspaceUserId,
      type: "MEETING",
      sender: "Agenda",
      subject: `Reunião agendada com ${client.fullName}`,
      body: `"${meeting.title}" em ${meeting.scheduledFor.toLocaleString("pt-BR")}. Contato: ${client.phone || client.email || "sem contato cadastrado"}.`,
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "MEETING",
      description: `Reunião agendada: ${meeting.title} em ${meeting.scheduledFor.toLocaleString("pt-BR")}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ meeting });
}
