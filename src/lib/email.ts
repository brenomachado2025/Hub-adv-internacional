// Envio de e-mail via Resend (resend.com) - API simples via fetch, sem SDK.
// Chave gratuita self-service, sem aprovação comercial (diferente do Escavador/Judit).
export class MissingEmailKeyError extends Error {}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Internacional Hub <onboarding@resend.dev>";

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
