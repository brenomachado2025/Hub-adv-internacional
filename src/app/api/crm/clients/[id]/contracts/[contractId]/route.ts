import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId, hasFinanceAccess } from "@/lib/team";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; contractId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await hasFinanceAccess(user.userId))) {
    return NextResponse.json({ error: "Sem acesso a dados financeiros" }, { status: 403 });
  }
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, contractId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  const existing = await prisma.feeContract.findUnique({ where: { id: contractId } });
  if (!existing || existing.clientId !== id) {
    return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  }

  const { status } = (await req.json()) as { status?: string };
  if (!["ACTIVE", "CANCELLED", "COMPLETED"].includes(status ?? "")) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const contract = await prisma.feeContract.update({ where: { id: contractId }, data: { status } });

  if (status === "CANCELLED") {
    await prisma.feeInstallment.updateMany({
      where: { contractId, status: { in: ["PENDING", "OVERDUE"] } },
      data: { status: "CANCELLED" },
    });
  }

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "BILLING",
      description: `Contrato de honorários ${status === "CANCELLED" ? "cancelado" : status === "COMPLETED" ? "concluído" : "reativado"}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ contract });
}
