import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== user.userId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const messages = await prisma.whatsappMessage.findMany({
    where: { crmClientId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}
