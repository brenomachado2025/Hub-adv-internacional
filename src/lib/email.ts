// Envio de e-mail via Resend (resend.com) - API simples via fetch, sem SDK.
// Chave gratuita self-service, sem aprovação comercial (diferente do Escavador/Judit).
export class MissingEmailKeyError extends Error {}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Internacional Hub <onboarding@resend.dev>";

// Clientes de e-mail não carregam /public direto - precisa ser uma URL http(s)
// pública. Usa o domínio de produção do próprio Hub, que já serve essa imagem.
const LOGO_URL = "https://hubadvinternacional2027.vercel.app/logo.png";

// Escapa texto vindo de usuário (nome, mensagem de campanha) antes de interpolar
// em HTML de e-mail - evita que alguém injete tags/scripts no corpo enviado.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Cabeçalho/rodapé padrão com o logo do Hub, reaproveitado em todo e-mail
// transacional (recuperação de senha, e-mail em massa, etc.) para manter a
// identidade visual consistente.
export function emailTemplate(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="text-align: center; padding: 24px 0 8px;">
        <img src="${LOGO_URL}" alt="Internacional Hub" width="56" height="56" style="border-radius: 8px;" />
        <p style="font-weight: bold; letter-spacing: 0.5px; color: #0e1b30; margin: 8px 0 0;">INTERNACIONAL HUB</p>
      </div>
      <div style="color: #1f2937; font-size: 14px; line-height: 1.6; padding: 8px 24px 24px;">
        ${bodyHtml}
      </div>
      <div style="text-align: center; color: #9ca3af; font-size: 11px; padding: 16px 0; border-top: 1px solid #e5e7eb;">
        Internacional Hub — sanções internacionais &amp; due diligence
      </div>
    </div>
  `;
}

export async function sendEmailBatch(
  emails: { to: string; subject: string; html: string }[]
): Promise<{ to: string; ok: boolean; error?: string }[]> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new MissingEmailKeyError("RESEND_API_KEY não configurada");
  if (emails.length === 0) return [];

  const results: { to: string; ok: boolean; error?: string }[] = [];

  // API de lote do Resend aceita até 100 e-mails por chamada.
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        chunk.map((e) => ({ from: FROM_ADDRESS, to: e.to, subject: e.subject, html: e.html }))
      ),
    });

    if (res.ok) {
      chunk.forEach((e) => results.push({ to: e.to, ok: true }));
    } else {
      const text = await res.text().catch(() => "");
      chunk.forEach((e) => results.push({ to: e.to, ok: false, error: text || `HTTP ${res.status}` }));
    }
  }

  return results;
}
