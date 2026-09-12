import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailBatch, emailTemplate, escapeHtml } from "@/lib/email";

const GENERIC_MESSAGE = "Se esse e-mail existir na nossa base, um código de verificação foi enviado.";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: "Informe o e-mail" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Nunca revela se o e-mail existe ou não na base - evita que alguém use esse
  // formulário pra descobrir quais e-mails têm conta no Hub.
  if (!user || user.suspended) {
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }

  // Limite de 1 código a cada 60s por conta - evita "e-mail bombing" via pedidos
  // repetidos. Resposta continua genérica pra não vazar que a conta existe.
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recentToken) {
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  }

  // Só o código mais recente deve valer - invalida qualquer código anterior ainda
  // não usado pra não deixar códigos antigos "vivos" indefinidamente.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateCode();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  try {
    await sendEmailBatch([
      {
        to: user.email,
        subject: "Código para redefinir sua senha - Internacional Hub",
        html: emailTemplate(`
          <p>Olá${user.name ? `, ${escapeHtml(user.name)}` : ""}!</p>
          <p>Recebemos um pedido para redefinir a senha da sua conta no Internacional Hub.</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 24px 0; text-align: center;">${code}</p>
          <p>Esse código vale por 15 minutos. Se você não pediu essa redefinição, pode ignorar este e-mail.</p>
        `),
      },
    ]);
  } catch {
    // Falha no envio não deve revelar detalhes internos ao usuário - a mensagem
    // genérica já cobre o caso "não recebeu o e-mail, tente de novo mais tarde".
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
