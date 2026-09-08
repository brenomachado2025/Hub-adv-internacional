import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

const SYSTEM_PROMPT = `Você é o assistente virtual do Internacional Hub, uma plataforma de compliance e CRM para escritórios de advocacia.
Responda sempre em português do Brasil, de forma curta, direta e cordial.

Módulos do Hub que você pode explicar:
- Sanções: monitoramento de listas ONU/OFAC/UE, busca de entidades, alertas de mudança de jurisdição, histórico de auditoria.
- Auditoria: histórico de todas as consultas feitas na área de Sanções.
- Honorários: calculadora de honorários multi-moeda com câmbio real, focada em EUA/Canadá.
- Faturas: emissão de faturas internacionais em PDF a partir dos cálculos de honorários.
- Reuniões: assistente de agendamento multi-fuso horário e calendário de feriados/zonas de conflito.
- CRM: gestão de clientes (CPF/CNPJ, área jurídica, cidade), pipeline Kanban, importação/exportação em CSV/Excel.
- WhatsApp: conexão via QR Code, chatbot reativo que nunca inicia conversa, captação automática de clientes, funil de mensagens editável, chat espelhado para responder manualmente.
- Notificações: caixa de entrada estilo e-mail com alertas do sistema.

Se não souber a resposta ou for algo fora do escopo do Hub, diga isso com honestidade e sugira falar com o suporte humano.`;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "O assistente ainda não foi configurado pelo administrador. Tente novamente em breve.",
    });
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-20),
    }),
  });

  if (!res.ok) {
    return NextResponse.json({
      reply: "Não consegui me conectar ao assistente agora. Tente novamente em instantes.",
    });
  }

  const data = await res.json();
  const reply = data.content?.[0]?.text ?? "Desculpe, não consegui gerar uma resposta.";
  return NextResponse.json({ reply });
}
