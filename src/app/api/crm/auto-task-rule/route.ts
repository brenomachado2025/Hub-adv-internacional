import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const rule = await prisma.autoTaskRule.findUnique({ where: { userId: workspaceUserId } });
  return NextResponse.json({ rule: rule ?? { enabled: false, taskTitle: "Primeiro contato", daysUntilDue: 1 } });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { enabled, taskTitle, daysUntilDue } = (await req.json()) as {
    enabled?: boolean;
    taskTitle?: string;
    daysUntilDue?: number;
  };

  const cleanTitle = taskTitle?.trim() || "Primeiro contato";
  const cleanDays = Math.max(0, Math.min(30, daysUntilDue ?? 1));

  const rule = await prisma.autoTaskRule.upsert({
    where: { userId: workspaceUserId },
    create: { userId: workspaceUserId, enabled: !!enabled, taskTitle: cleanTitle, daysUntilDue: cleanDays },
    update: { enabled: !!enabled, taskTitle: cleanTitle, daysUntilDue: cleanDays },
  });

  return NextResponse.json({ rule });
}
