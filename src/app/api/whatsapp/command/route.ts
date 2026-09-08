import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { type } = (await req.json()) as { type?: string };
  if (type !== "DISCONNECT" && type !== "NEW_QR") {
    return NextResponse.json({ error: "Comando inválido" }, { status: 400 });
  }

  await prisma.whatsappCommand.create({ data: { userId: workspaceUserId, type } });

  return NextResponse.json({ ok: true });
}
