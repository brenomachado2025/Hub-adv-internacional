import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

const TRIGGER_TYPES = ["CLIENT_CREATED", "CLIENT_STATUS_CHANGED"];
const ACTION_TYPES = ["CREATE_TASK", "SEND_NOTIFICATION", "SEND_WHATSAPP"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const rules = await prisma.automationRule.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const body = (await req.json()) as {
    name?: string;
    triggerType?: string;
    triggerStatus?: string;
    actionType?: string;
    actionText?: string;
    actionDays?: number;
  };

  if (!body.triggerType || !TRIGGER_TYPES.includes(body.triggerType)) {
    return NextResponse.json({ error: "Gatilho inválido" }, { status: 400 });
  }
  if (!body.actionType || !ACTION_TYPES.includes(body.actionType)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }
  if (!body.actionText?.trim()) {
    return NextResponse.json({ error: "Preencha o texto da ação" }, { status: 400 });
  }

  const rule = await prisma.automationRule.create({
    data: {
      userId: workspaceUserId,
      name: body.name?.trim() ?? "",
      triggerType: body.triggerType,
      triggerStatus: body.triggerStatus ?? "",
      actionType: body.actionType,
      actionText: body.actionText.trim(),
      actionDays: Math.max(0, Math.min(60, body.actionDays ?? 1)),
    },
  });

  return NextResponse.json({ rule });
}
