import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { onlyDigits, LEGAL_AREAS } from "@/lib/data/crm";

type ImportRow = {
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  legalArea?: string;
  companyName?: string;
  city?: string;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { rows } = (await req.json()) as { rows: ImportRow[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Nenhuma linha para importar" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const toCreate = rows
    .map((row, index) => {
      const fullName = row.fullName?.trim();
      if (!fullName) {
        skipped++;
        errors.push(`Linha ${index + 2}: nome completo vazio, ignorada`);
        return null;
      }
      const documentType = row.documentType?.toUpperCase().includes("CNPJ") ? "CNPJ" : "CPF";
      const legalArea = LEGAL_AREAS.includes(row.legalArea as (typeof LEGAL_AREAS)[number])
        ? (row.legalArea as string)
        : "Outro";

      return {
        userId: user.userId,
        fullName,
        documentType,
        documentNumber: onlyDigits(row.documentNumber ?? ""),
        legalArea,
        companyName: row.companyName?.trim() ?? "",
        city: row.city?.trim() ?? "",
        status: "CONTACTED",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (toCreate.length > 0) {
    const created = await prisma.crmClient.createManyAndReturn({
      data: toCreate,
      select: { id: true },
    });
    imported = created.length;
    if (created.length > 0) {
      await prisma.crmStatusHistory.createMany({
        data: created.map((c) => ({ clientId: c.id, status: "CONTACTED" })),
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "EXPORT",
      module: "crm",
      query: `Importação em lote (${rows.length} linha(s))`,
      resultSummary: `${imported} cliente(s) importado(s), ${skipped} ignorado(s)`,
    },
  });

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) });
}
