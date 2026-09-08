import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const calculation = await prisma.feeCalculation.findUnique({ where: { id } });
  if (!calculation || calculation.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cálculo não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ calculation });
}
