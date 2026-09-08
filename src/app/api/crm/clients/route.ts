import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { onlyDigits } from "@/lib/data/crm";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const legalArea = req.nextUrl.searchParams.get("legalArea") ?? undefined;
  const city = req.nextUrl.searchParams.get("city") ?? undefined;
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const clients = await prisma.crmClient.findMany({
    where: {
      userId: workspaceUserId,
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
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const body = await req.json();
  const {
    fullName,
    documentType,
    documentNumber,
    legalArea,
    companyName,
    city,
    phone,
    email,
    status,
  } = body as {
    fullName: string;
    documentType?: string;
    documentNumber?: string;
    legalArea?: string;
    companyName?: string;
    city?: string;
    phone?: string;
    email?: string;
    status?: string;
  };

  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Nome completo é obrigatório" }, { status: 400 });
  }

  const initialStatus = status || "CONTACTED";

  const client = await prisma.crmClient.create({
    data: {
      userId: workspaceUserId,
      fullName: fullName.trim(),
      documentType: documentType === "CNPJ" ? "CNPJ" : "CPF",
      documentNumber: onlyDigits(documentNumber ?? ""),
      legalArea: legalArea ?? "Outro",
      companyName: companyName?.trim() ?? "",
      city: city?.trim() ?? "",
      phone: onlyDigits(phone ?? ""),
      email: email?.trim() ?? "",
      status: initialStatus,
      statusHistory: {
        create: { status: initialStatus },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "EXPORT",
      module: "crm",
      query: client.fullName,
      resultSummary: "Cliente cadastrado no CRM",
    },
  });

  await prisma.crmActivity.create({
    data: {
      clientId: client.id,
      type: "CREATED",
      description: "Cliente cadastrado no CRM",
      actor: user.name || user.email,
    },
  });

  return NextResponse.json({ client });
}
