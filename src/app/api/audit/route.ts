import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceUserIds } from "@/lib/team";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserIds = await getWorkspaceUserIds(user.userId);

  const module_ = req.nextUrl.searchParams.get("module") ?? undefined;
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [{ userId: { in: workspaceUserIds } }, { userId: null }],
      ...(module_ ? { module: module_ } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ logs });
}
