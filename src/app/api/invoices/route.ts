import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const invoices = await prisma.invoice.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ invoices });
}

async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { userId, number: { startsWith: `INV-${year}-` } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const body = await req.json();
  const {
    issuerName,
    issuerTaxId,
    issuerAddress,
    clientName,
    clientTaxId,
    clientAddress,
    currency,
    exchangeRate,
    taxRate,
    notes,
    issueDate,
    dueDate,
    feeCalculationId,
    items,
  } = body as {
    issuerName: string;
    issuerTaxId?: string;
    issuerAddress?: string;
    clientName: string;
    clientTaxId?: string;
    clientAddress?: string;
    currency: string;
    exchangeRate?: number;
    taxRate?: number;
    notes?: string;
    issueDate: string;
    dueDate?: string;
    feeCalculationId?: string;
    items: { description: string; quantity: number; unitPrice: number }[];
  };

  if (!issuerName || !clientName || !currency || !issueDate || !items?.length) {
    return NextResponse.json(
      { error: "issuerName, clientName, currency, issueDate e items são obrigatórios" },
      { status: 400 }
    );
  }

  // Se um cálculo de honorário foi referenciado, garante que pertence a este usuário.
  let linkedFeeCalculationId: string | null = null;
  if (feeCalculationId) {
    const calc = await prisma.feeCalculation.findUnique({ where: { id: feeCalculationId } });
    if (calc && calc.userId === workspaceUserId) {
      linkedFeeCalculationId = calc.id;
    }
  }

  const number = await generateInvoiceNumber(workspaceUserId);

  const invoice = await prisma.invoice.create({
    data: {
      userId: workspaceUserId,
      number,
      issuerName,
      issuerTaxId: issuerTaxId ?? "",
      issuerAddress: issuerAddress ?? "",
      clientName,
      clientTaxId: clientTaxId ?? "",
      clientAddress: clientAddress ?? "",
      currency,
      exchangeRate: exchangeRate ?? 1,
      taxRate: taxRate ?? 0,
      notes: notes ?? "",
      issueDate,
      dueDate: dueDate ?? "",
      feeCalculationId: linkedFeeCalculationId,
      status: "ISSUED",
      items: {
        create: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.notification.create({
    data: {
      userId: workspaceUserId,
      type: "INVOICE",
      sender: "Faturamento",
      subject: `Fatura ${invoice.number} emitida`,
      body: `A fatura ${invoice.number} para ${clientName} foi emitida no valor de ${currency} ${items
        .reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
        .toFixed(2)}.`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "EXPORT",
      module: "faturas",
      query: invoice.number,
      resultSummary: `Fatura criada para ${clientName} em ${currency}`,
    },
  });

  return NextResponse.json({ invoice });
}
