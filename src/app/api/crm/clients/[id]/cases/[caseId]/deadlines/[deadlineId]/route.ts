import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string; deadlineId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, caseId, deadlineId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  const deadline = await prisma.legalCaseDeadline.findUnique({ where: { id: deadlineId } });
  if (!deadline || deadline.caseId !== caseId) {
    return NextResponse.json({ error: "Prazo não encontrado" }, { status: 404 });
  }

  const { status } = (await req.json()) as { status?: string };
  if (!["PENDING", "DONE", "EXPIRED"].includes(status ?? "")) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const updated = await prisma.legalCaseDeadline.update({
    where: { id: deadlineId },
    data: { status },
  });

  return NextResponse.json({ deadline: updated });
}
