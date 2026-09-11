import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasFinanceAccess } from "@/lib/team";

// Limite generoso o bastante pra uma foto de perfil pequena já comprimida no
// navegador (data-URL base64), sem precisar de storage externo.
const MAX_AVATAR_LENGTH = 400_000;

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  // Busca os dados atuais no banco em vez de confiar só no que foi gravado no
  // cookie de sessão no momento do login (evita nome/tratamento desatualizados
  // até o usuário sair e entrar de novo).
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true, title: true, role: true, theme: true, avatarUrl: true },
  });

  if (!dbUser) return NextResponse.json({ user: null }, { status: 200 });

  const canViewFinance = await hasFinanceAccess(session.userId);

  return NextResponse.json({ user: { ...dbUser, canViewFinance } });
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, title, theme, avatarUrl } = (await req.json()) as {
    name?: string;
    title?: string;
    theme?: string;
    avatarUrl?: string | null;
  };
  const data: { name?: string; title?: string; theme?: string; avatarUrl?: string } = {};
  if (typeof name === "string") data.name = name.trim();
  if (typeof title === "string" && ["", "Sr.", "Sra."].includes(title)) data.title = title;
  if (typeof theme === "string" && ["light", "dark", "system"].includes(theme)) data.theme = theme;
  if (avatarUrl === null) data.avatarUrl = "";
  if (typeof avatarUrl === "string" && avatarUrl) {
    if (avatarUrl.length > MAX_AVATAR_LENGTH || !avatarUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagem inválida ou muito grande" }, { status: 400 });
    }
    data.avatarUrl = avatarUrl;
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { email: true, name: true, title: true, role: true, theme: true, avatarUrl: true },
  });

  return NextResponse.json({ user: updated });
}
