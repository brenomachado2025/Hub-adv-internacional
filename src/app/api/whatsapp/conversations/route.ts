import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const clients = await prisma.crmClient.findMany({
    where: { userId: user.userId, phone: { not: "" } },
    include: {
      whatsappMessages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const conversations = clients
    .map((c) => ({
      clientId: c.id,
      fullName: c.fullName,
      phone: c.phone,
      status: c.status,
      lastMessage: c.whatsappMessages[0]
        ? { body: c.whatsappMessages[0].body, direction: c.whatsappMessages[0].direction, createdAt: c.whatsappMessages[0].createdAt }
        : null,
    }))
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt.getTime() ?? 0;
      const bTime = b.lastMessage?.createdAt.getTime() ?? 0;
      return bTime - aTime;
    });

  return NextResponse.json({ conversations });
}
