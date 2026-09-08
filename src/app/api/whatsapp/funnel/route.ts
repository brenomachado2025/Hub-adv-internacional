import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { DEFAULT_FUNNEL_MESSAGES, FUNNEL_MESSAGE_FIELDS, type FunnelKey } from "@/lib/data/whatsapp-funnel";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const rows = await prisma.whatsappFunnelMessage.findMany({ where: { userId: workspaceUserId } });
  const byKey = new Map(rows.map((r) => [r.key, r.text]));

  const messages = FUNNEL_MESSAGE_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    help: f.help,
    text: byKey.get(f.key) ?? DEFAULT_FUNNEL_MESSAGES[f.key],
    isDefault: !byKey.has(f.key),
  }));

  return NextResponse.json({ messages });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const { key, text } = (await req.json()) as { key?: FunnelKey; text?: string };
  if (!key || !(key in DEFAULT_FUNNEL_MESSAGES)) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 400 });
  }

  if (text === undefined || text.trim() === "") {
    // Texto vazio = restaurar o padrão (remove a customização).
    await prisma.whatsappFunnelMessage.deleteMany({ where: { userId: workspaceUserId, key } });
    return NextResponse.json({ ok: true, text: DEFAULT_FUNNEL_MESSAGES[key] });
  }

  await prisma.whatsappFunnelMessage.upsert({
    where: { userId_key: { userId: workspaceUserId, key } },
    create: { userId: workspaceUserId, key, text },
    update: { text },
  });

  return NextResponse.json({ ok: true, text });
}
