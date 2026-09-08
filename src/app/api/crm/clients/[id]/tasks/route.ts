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

  const tasks = await prisma.crmTask.findMany({ where: { clientId: id }, orderBy: [{ status: "asc" }, { dueDate: "asc" }] });
  return NextResponse.json({ tasks });
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

  const { title, assignee, dueDate } = (await req.json()) as { title?: string; assignee?: string; dueDate?: string };
  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const task = await prisma.crmTask.create({
    data: {
      clientId: id,
      title: title.trim(),
      assignee: assignee?.trim() ?? "",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "TASK",
      description: `Tarefa criada: ${task.title}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ task });
}
