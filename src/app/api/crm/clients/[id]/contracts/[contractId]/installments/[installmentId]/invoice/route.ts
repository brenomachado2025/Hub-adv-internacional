import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { userId, number: { startsWith: `INV-${year}-` } } });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; contractId: string; installmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id, contractId, installmentId } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  const contract = await prisma.feeContract.findUnique({ where: { id: contractId } });
  if (!contract || contract.clientId !== id) {
    return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  }
  const installment = await prisma.feeInstallment.findUnique({ where: { id: installmentId } });
  if (!installment || installment.contractId !== contractId) {
    return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });
  }

  const owner = await prisma.user.findUnique({ where: { id: workspaceUserId } });
  const number = await generateInvoiceNumber(workspaceUserId);
  const today = new Date().toISOString().slice(0, 10);

  const invoice = await prisma.invoice.create({
    data: {
      userId: workspaceUserId,
      number,
      issuerName: owner?.name || owner?.email || "Escritório",
      clientName: client.fullName,
      clientId: id,
      caseId: contract.caseId,
      installmentId: installment.id,
      currency: contract.currency,
      status: "ISSUED",
      issueDate: today,
      dueDate: installment.dueDate.toISOString().slice(0, 10),
      items: {
        create: [
          {
            description: `${contract.description || "Honorários advocatícios"} — parcela ${installment.number}`,
            quantity: 1,
            unitPrice: installment.amount,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "BILLING",
      description: `Fatura ${invoice.number} gerada para a parcela ${installment.number}`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ invoice });
}
