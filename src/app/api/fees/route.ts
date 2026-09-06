import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRate } from "@/lib/fx";
import { getActorLabel } from "@/lib/auth/current-user";

export async function GET() {
  const calculations = await prisma.feeCalculation.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ calculations });
}

export async function POST(req: NextRequest) {
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
      actor: await getActorLabel(),
      action: "VIEW",
      module: "honorarios",
      query: `${baseAmount} ${baseCurrency} -> ${targetCurrency}`,
      resultSummary: `Convertido para ${convertedAmount.toFixed(2)} ${targetCurrency} @ taxa ${rate} (${date})`,
    },
  });

  return NextResponse.json({ calculation });
}
