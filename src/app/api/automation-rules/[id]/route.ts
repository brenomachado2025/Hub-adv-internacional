import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const existing = await prisma.automationRule.findUnique({ where: { id } });
  if (!existing || existing.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  }

  const { enabled } = (await req.json()) as { enabled?: boolean };
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled deve ser booleano" }, { status: 400 });
  }

  const rule = await prisma.automationRule.update({ where: { id }, data: { enabled } });
  return NextResponse.json({ rule });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const existing = await prisma.automationRule.findUnique({ where: { id } });
  if (!existing || existing.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  }

  await prisma.automationRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
