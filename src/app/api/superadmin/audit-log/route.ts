import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSuperadmin } from "@/lib/auth/superadmin-session";

export async function GET() {
  const superadmin = await getCurrentSuperadmin();
  if (!superadmin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const logs = await prisma.superadminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({ logs });
}
