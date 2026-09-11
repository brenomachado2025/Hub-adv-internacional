import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId, hasFinanceAccess } from "@/lib/team";
import { generateInstallments } from "@/lib/finance/billing";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await hasFinanceAccess(user.userId))) {
    return NextResponse.json({ error: "Sem acesso a dados financeiros" }, { status: 403 });
  }
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const contracts = await prisma.feeContract.findMany({
    where: { clientId: id },
    include: { installments: { orderBy: { number: "asc" } }, case: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contracts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!(await hasFinanceAccess(user.userId))) {
    return NextResponse.json({ error: "Sem acesso a dados financeiros" }, { status: 403 });
  }
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({ where: { id } });
  if (!client || client.userId !== workspaceUserId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const { description, totalAmount, currency, installmentsCount, firstDueDate, caseId } = (await req.json()) as {
    description?: string;
    totalAmount?: number;
    currency?: string;
    installmentsCount?: number;
    firstDueDate?: string;
    caseId?: string;
  };

  if (!totalAmount || totalAmount <= 0 || !firstDueDate) {
    return NextResponse.json({ error: "Valor total e data da primeira parcela são obrigatórios" }, { status: 400 });
  }

  if (caseId) {
    const legalCase = await prisma.legalCase.findUnique({ where: { id: caseId } });
    if (!legalCase || legalCase.clientId !== id) {
      return NextResponse.json({ error: "Processo inválido" }, { status: 400 });
    }
  }

  const count = Math.max(1, Math.min(60, installmentsCount ?? 1));
  const installments = generateInstallments(totalAmount, count, new Date(firstDueDate));

  const contract = await prisma.feeContract.create({
    data: {
      userId: workspaceUserId,
      clientId: id,
      caseId: caseId || null,
      description: description?.trim() ?? "",
      totalAmount,
      currency: currency?.trim() || "BRL",
      installments: { create: installments },
    },
    include: { installments: { orderBy: { number: "asc" } } },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: id,
      type: "BILLING",
      description: `Contrato de honorários fechado: ${contract.currency} ${contract.totalAmount.toFixed(2)} em ${count}x`,
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ contract });
}
