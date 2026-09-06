import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { onlyDigits } from "@/lib/data/crm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const client = await prisma.crmClient.findUnique({
    where: { id },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } },
  });
  if (!client || client.userId !== user.userId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.crmClient.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const {
    fullName,
    documentType,
    documentNumber,
    legalArea,
    companyName,
    city,
    status,
  } = body as {
    fullName?: string;
    documentType?: string;
    documentNumber?: string;
    legalArea?: string;
    companyName?: string;
    city?: string;
    status?: string;
  };

  const newStatus = status && status !== existing.status ? status : undefined;

  const client = await prisma.crmClient.update({
    where: { id },
    data: {
      ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
      ...(documentType !== undefined ? { documentType: documentType === "CNPJ" ? "CNPJ" : "CPF" } : {}),
      ...(documentNumber !== undefined ? { documentNumber: onlyDigits(documentNumber) } : {}),
      ...(legalArea !== undefined ? { legalArea } : {}),
      ...(companyName !== undefined ? { companyName: companyName.trim() } : {}),
      ...(city !== undefined ? { city: city.trim() } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(newStatus ? { statusHistory: { create: { status: newStatus } } } : {}),
    },
  });

  return NextResponse.json({ client });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.crmClient.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.userId) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  await prisma.crmClient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
