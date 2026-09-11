import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceOwnerId } from "@/lib/team";
import { buildClientWhere } from "@/lib/crm/filters";
import { sendEmailBatch, emailTemplate, MissingEmailKeyError } from "@/lib/email";

export const maxDuration = 120;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const campaigns = await prisma.emailCampaign.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const workspaceUserId = await getWorkspaceOwnerId(user.userId);

  const body = (await req.json()) as {
    subject?: string;
    body?: string;
    status?: string;
    legalArea?: string;
    city?: string;
    q?: string;
  };

  if (!body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "Assunto e mensagem são obrigatórios" }, { status: 400 });
  }

  const where = buildClientWhere(workspaceUserId, {
    status: body.status,
    legalArea: body.legalArea,
    city: body.city,
    q: body.q,
  });

  const recipients = await prisma.crmClient.findMany({
    where: { ...where, email: { not: "" } },
    select: { id: true, email: true, fullName: true },
  });

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Nenhum cliente com e-mail cadastrado nesse filtro" }, { status: 400 });
  }

  const html = emailTemplate(body.body.trim().replace(/\n/g, "<br>"));

  let sendResults: { to: string; ok: boolean; error?: string }[] = [];
  let campaignStatus = "SENT";
  let message = "";

  try {
    sendResults = await sendEmailBatch(
      recipients.map((r) => ({ to: r.email, subject: body.subject!.trim(), html }))
    );
  } catch (err) {
    campaignStatus = err instanceof MissingEmailKeyError ? "ERROR" : "ERROR";
    message = err instanceof Error ? err.message : "Falha ao enviar e-mails";
  }

  const sentCount = sendResults.filter((r) => r.ok).length;
  const failedCount = sendResults.filter((r) => !r.ok).length;
  if (message) campaignStatus = "ERROR";
  else if (failedCount > 0 && sentCount === 0) campaignStatus = "ERROR";

  const campaign = await prisma.emailCampaign.create({
    data: {
      userId: workspaceUserId,
      subject: body.subject.trim(),
      body: body.body.trim(),
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      status: campaignStatus,
      message,
      recipients: {
        create: recipients.map((r) => {
          const result = sendResults.find((s) => s.to === r.email);
          return {
            clientId: r.id,
            email: r.email,
            status: result ? (result.ok ? "SENT" : "FAILED") : "FAILED",
            error: result?.error ?? (message || ""),
          };
        }),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      actor: user.email,
      action: "SYNC",
      module: "crm",
      query: body.subject.trim(),
      resultSummary: `E-mail em massa: ${sentCount} enviado(s), ${failedCount} falha(s) de ${recipients.length}`,
    },
  });

  return NextResponse.json({ campaign, sentCount, failedCount, total: recipients.length });
}
