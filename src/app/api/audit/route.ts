import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const module_ = req.nextUrl.searchParams.get("module") ?? undefined;
  const logs = await prisma.auditLog.findMany({
    where: module_ ? { module: module_ } : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ logs });
}
