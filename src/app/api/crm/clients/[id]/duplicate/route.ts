import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const original = await prisma.crmClient.findUnique({ where: { id } });
  if (!original || original.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const copy = await prisma.crmClient.create({
    data: {
      userId: workspaceUserId,
      fullName: `${original.fullName} (cópia)`,
      documentType: original.documentType,
      legalArea: original.legalArea,
      companyName: original.companyName,
      city: original.city,
      status: "CONTACTED",
      parentClientId: original.id,
      statusHistory: { create: { status: "CONTACTED" } },
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: copy.id,
      type: "DUPLICATE",
      description: `Cadastro duplicado a partir de ${original.fullName}`,
      actor: user.name || user.email,
    },
  });
  await prisma.crmActivity.create({
    data: {
      clientId: original.id,
      type: "DUPLICATE",
      description: `Cadastro duplicado: ${copy.fullName}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ client: copy });
}
