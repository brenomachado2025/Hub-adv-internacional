import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

async function loadOwnedInstallment(
  clientId: string,
  contractId: string,
  installmentId: string,
  workspaceUserId: string
) {
  const client = await prisma.crmClient.findUnique({ where: { id: clientId } });
  if (!client || client.userId !== workspaceUserId) return null;
  const contract = await prisma.feeContract.findUnique({ where: { id: contractId } });
  if (!contract || contract.clientId !== clientId) return null;
  const installment = await prisma.feeInstallment.findUnique({ where: { id: installmentId } });
  if (!installment || installment.contractId !== contractId) return null;
  return { contract, installment };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string; installmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, contractId, installmentId } = await params;
  const loaded = await loadOwnedInstallment(id, contractId, installmentId, workspaceUserId);
  if (!loaded) return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });

  const { status, paidAmount } = (await req.json()) as { status?: string; paidAmount?: number };
  if (!["PENDING", "PAID", "OVERDUE", "CANCELLED"].includes(status ?? "")) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const installment = await prisma.feeInstallment.update({
    where: { id: installmentId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
      paidAmount: status === "PAID" ? paidAmount ?? loaded.installment.amount : null,
    },
  });

  if (status === "PAID") {
    await prisma.crmActivity.create({
      data: {
        clientId: id,
        type: "BILLING",
        description: `Pagamento registrado: parcela ${installment.number} (${loaded.contract.currency} ${(installment.paidAmount ?? installment.amount).toFixed(2)})`,
        actor: user.name || user.email,
      },
    });
  }

  return NextResponse.json({ installment });
}
