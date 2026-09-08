import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const rule = await prisma.followUpRule.findUnique({ where: { userId: workspaceUserId } });
  return NextResponse.json({ rule: rule ?? { days: 7, enabled: false } });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { days, enabled } = (await req.json()) as { days?: number; enabled?: boolean };
  const cleanDays = Math.max(1, Math.min(90, days ?? 7));

  const rule = await prisma.followUpRule.upsert({
    where: { userId: workspaceUserId },
    create: { userId: workspaceUserId, days: cleanDays, enabled: !!enabled },
    update: { days: cleanDays, enabled: !!enabled },
  });

  return NextResponse.json({ rule });
}
