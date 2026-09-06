import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { crmStatusLabel, formatDocument, onlyDigits } from "@/lib/data/crm";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const legalArea = req.nextUrl.searchParams.get("legalArea") ?? undefined;
  const city = req.nextUrl.searchParams.get("city") ?? undefined;
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const clients = await prisma.crmClient.findMany({
    where: {
      userId: user.userId,
      ...(status ? { status } : {}),
      ...(legalArea ? { legalArea } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { documentNumber: { contains: onlyDigits(q) || q } },
              { companyName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "nome_completo",
    "tipo_documento",
    "numero_documento",
    "area_juridica",
    "nome_empresa",
    "cidade",
    "status",
    "data_cadastro",
  ];

  const rows = clients.map((c) =>
    [
      c.fullName,
      c.documentType,
      formatDocument(c.documentType, c.documentNumber),
      c.legalArea,
      c.companyName,
      c.city,
      crmStatusLabel(c.status),
      c.createdAt.toISOString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-crm.csv"`,
    },
  });
}
