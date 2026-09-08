import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRate } from "@/lib/fx";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const calculations = await prisma.feeCalculation.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ calculations });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const body = await req.json();
  const {
    description,
    baseAmount,
    baseCurrency,
    targetCurrency,
    jurisdictionCountry,
    jurisdictionState,
  } = body as {
    description?: string;
    baseAmount: number;
    baseCurrency: string;
    targetCurrency: string;
    jurisdictionCountry?: string;
    jurisdictionState?: string;
  };

  if (!baseAmount || !baseCurrency || !targetCurrency) {
    return NextResponse.json(
      { error: "baseAmount, baseCurrency e targetCurrency são obrigatórios" },
      { status: 400 }
    );
  }

  const { rate, date } = await getExchangeRate(baseCurrency, targetCurrency);
  const convertedAmount = baseAmount * rate;

  const calculation = await prisma.feeCalculation.create({
    data: {
      userId: workspaceUserId,
      description: description ?? "",
      baseAmount,
      baseCurrency,
      targetCurrency,
      rate,
      convertedAmount,
      rateDate: date,
      jurisdictionCountry: jurisdictionCountry ?? "",
      jurisdictionState: jurisdictionState ?? "",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "VIEW",
      module: "honorarios",
      query: `${baseAmount} ${baseCurrency} -> ${targetCurrency}`,
      resultSummary: `Convertido para ${convertedAmount.toFixed(2)} ${targetCurrency} @ taxa ${rate} (${date})`,
    },
  });

  return NextResponse.json({ calculation });
}
