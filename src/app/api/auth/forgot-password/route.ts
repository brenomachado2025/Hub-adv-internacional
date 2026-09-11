import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailBatch } from "@/lib/email";

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
        html: `
          <p>Olá${user.name ? `, ${user.name}` : ""}!</p>
          <p>Recebemos um pedido para redefinir a senha da sua conta no Internacional Hub.</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${code}</p>
          <p>Esse código vale por 15 minutos. Se você não pediu essa redefinição, pode ignorar este e-mail.</p>
        `,
      },
    ]);
  } catch {
    // Falha no envio não deve revelar detalhes internos ao usuário - a mensagem
    // genérica já cobre o caso "não recebeu o e-mail, tente de novo mais tarde".
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
