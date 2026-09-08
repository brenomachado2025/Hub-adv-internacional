import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const existing = await prisma.crmDocumentTemplate.findUnique({ where: { id } });
  if (!existing || existing.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
  }

  const { title, body } = (await req.json()) as { title?: string; body?: string };
  const template = await prisma.crmDocumentTemplate.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(body !== undefined ? { body } : {}),
    },
  });
  return NextResponse.json({ template });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const existing = await prisma.crmDocumentTemplate.findUnique({ where: { id } });
  if (!existing || existing.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
  }

  await prisma.crmDocumentTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
