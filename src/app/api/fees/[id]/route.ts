import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const calculation = await prisma.feeCalculation.findUnique({ where: { id } });
  if (!calculation) {
    return NextResponse.json({ error: "Cálculo não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ calculation });
}
