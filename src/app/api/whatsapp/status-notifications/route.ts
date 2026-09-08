import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { CRM_STATUS_ORDER } from "@/lib/data/crm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const rows = await prisma.whatsappStatusNotification.findMany({ where: { userId: workspaceUserId } });
  const byStatus = new Map(rows.map((r) => [r.status, r]));

  const configs = CRM_STATUS_ORDER.map((status) => ({
    status,
    message: byStatus.get(status)?.message ?? "",
    enabled: byStatus.get(status)?.enabled ?? false,
  }));

  return NextResponse.json({ configs });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { status, message, enabled } = (await req.json()) as {
    status?: string;
    message?: string;
    enabled?: boolean;
  };

  if (!status || !CRM_STATUS_ORDER.includes(status as (typeof CRM_STATUS_ORDER)[number])) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  await prisma.whatsappStatusNotification.upsert({
    where: { userId_status: { userId: workspaceUserId, status } },
    create: { userId: workspaceUserId, status, message: message ?? "", enabled: !!enabled },
    update: { message: message ?? "", enabled: !!enabled },
  });

  return NextResponse.json({ ok: true });
}
