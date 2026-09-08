import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const cases = await prisma.legalCase.findMany({
    where: { userId: workspaceUserId },
    include: {
      client: { select: { id: true, fullName: true } },
      deadlines: { where: { status: "PENDING" }, orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cases });
}
