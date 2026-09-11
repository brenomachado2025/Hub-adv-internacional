import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId, hasFinanceAccess } from "@/lib/team";
import { ReceiptPdf } from "@/lib/pdf/ReceiptPdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string; installmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await hasFinanceAccess(user.userId))) {
    return NextResponse.json({ error: "Sem acesso a dados financeiros" }, { status: 403 });
  }
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
  if (!installment || installment.contractId !== contractId || installment.status !== "PAID") {
    return NextResponse.json({ error: "Parcela não encontrada ou ainda não paga" }, { status: 404 });
  }

  const owner = await prisma.user.findUnique({ where: { id: workspaceUserId } });

  const buffer = await renderToBuffer(
    <ReceiptPdf
      issuerName={owner?.name || owner?.email || "Escritório"}
      clientName={client.fullName}
      amount={installment.paidAmount ?? installment.amount}
      currency={contract.currency}
      description={contract.description || "Honorários advocatícios"}
      paidAt={(installment.paidAt ?? new Date()).toLocaleDateString("pt-BR")}
      installmentNumber={installment.number}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${client.fullName}-parcela-${installment.number}.pdf"`,
    },
  });
}
