import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActorLabel } from "@/lib/auth/current-user";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ invoices });
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `INV-${year}-` } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export async function POST(req: NextRequest) {
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

  const number = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
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
      feeCalculationId: feeCalculationId || null,
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
      actor: await getActorLabel(),
      action: "EXPORT",
      module: "faturas",
      query: invoice.number,
      resultSummary: `Fatura criada para ${clientName} em ${currency}`,
    },
  });

  return NextResponse.json({ invoice });
}
