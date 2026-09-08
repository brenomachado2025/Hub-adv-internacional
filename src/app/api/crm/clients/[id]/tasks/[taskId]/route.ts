import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

async function loadOwnedTask(clientId: string, taskId: string, workspaceUserId: string) {
  const client = await prisma.crmClient.findUnique({ where: { id: clientId } });
  if (!client || client.userId !== workspaceUserId) return null;
  const task = await prisma.crmTask.findUnique({ where: { id: taskId } });
  if (!task || task.clientId !== clientId) return null;
  return task;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, taskId } = await params;
  const existing = await loadOwnedTask(id, taskId, workspaceUserId);
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });

  const { status } = (await req.json()) as { status?: string };
  if (status !== "PENDING" && status !== "DONE") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const task = await prisma.crmTask.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "TASK",
      description: status === "DONE" ? `Tarefa concluída: ${task.title}` : `Tarefa reaberta: ${task.title}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, taskId } = await params;
  const existing = await loadOwnedTask(id, taskId, workspaceUserId);
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });

  await prisma.crmTask.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
