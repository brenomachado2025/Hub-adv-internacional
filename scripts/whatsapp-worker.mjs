// Worker do módulo de WhatsApp - roda LOCALMENTE (não na Vercel), 24h enquanto
// este processo estiver ligado. Mantém a conexão não-oficial (tipo WhatsApp Web)
// via Baileys e conversa com o resto do hub só através do banco de dados
// compartilhado (Supabase) - sem precisar expor esse computador à internet.
//
// Uso: npm run whatsapp-worker
// Requer no .env: WHATSAPP_USER_EMAIL (conta do hub a que este WhatsApp pertence;
// se não definido, usa ADMIN_EMAIL).

import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import webpush from "web-push";
import {
  makeWASocket,
  initAuthCreds,
  BufferJSON,
  DisconnectReason,
  proto,
  jidDecode,
  isJidGroup,
} from "baileys";

const prisma = new PrismaClient();

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Mesma lógica de src/lib/push.ts, duplicada aqui porque este script roda fora do
// bundle do Next (node puro, sem alias @/) e não importa código de src/.
async function sendPush(userId, payload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}

// Falhas transitórias (ex.: instabilidade momentânea de rede/DB) não podem derrubar
// a conexão do WhatsApp inteira - loga e continua rodando em vez de crashar.
process.on("unhandledRejection", (err) => {
  console.error(`[whatsapp-worker ${new Date().toISOString()}] Erro não tratado (ignorado):`, err);
});
process.on("uncaughtException", (err) => {
  console.error(`[whatsapp-worker ${new Date().toISOString()}] Exceção não tratada (ignorado):`, err);
});

// Mantido em sincronia manualmente com src/lib/data/whatsapp-funnel.ts (usado pela
// tela de configuração do funil). O worker roda com node puro, sem TypeScript.
const DEFAULT_FUNNEL_MESSAGES = {
  WELCOME_MENU:
    "Olá! 👋 Bem-vindo(a). Sou o assistente virtual e posso te ajudar a dar o primeiro passo. Escolha uma opção:\n\n" +
    "1 - Falar sobre um novo caso\n" +
    "2 - Acompanhar processo em andamento\n" +
    "3 - Falar com um advogado",
  MENU_INVALID:
    "Desculpe, não entendi. Responda com o número da opção:\n\n" +
    "1 - Falar sobre um novo caso\n" +
    "2 - Acompanhar processo em andamento\n" +
    "3 - Falar com um advogado",
  HANDOFF_ACOMPANHAR: "Certo! Vou avisar um de nossos advogados para te passar uma atualização. Só um momento. 🙏",
  HANDOFF_ADVOGADO: "Combinado! Um de nossos advogados vai te atender em breve por aqui.",
  HANDOFF_ATTEMPTS: "Vou te encaminhar para um de nossos advogados para não perder tempo. Só um momento. 🙏",
  COLLECT_NAME: "Perfeito! Para começar, qual é o seu nome completo?",
  COLLECT_AREA:
    "Qual a área jurídica do seu caso? (Ex.: Direito Internacional, Societário, Contratos, Tributário, Trabalhista, Outro)",
  COLLECT_CITY: "Em qual cidade você está?",
  DONE: "Obrigado! Já registramos seus dados. Um de nossos advogados vai analisar seu caso e entrar em contato em breve. 🙏",
};

const LEGAL_AREAS = [
  "Direito Internacional",
  "Societário",
  "Contratos",
  "Tributário",
  "Trabalhista",
  "Outro",
];

const SEND_RATE_LIMIT_PER_HOUR = 30;
const SEND_LOOP_INTERVAL_MS = 5_000;
const MIN_DELAY_SECONDS = 5;
const MAX_DELAY_SECONDS = 30;

function randomDelaySeconds() {
  return Math.floor(Math.random() * (MAX_DELAY_SECONDS - MIN_DELAY_SECONDS + 1)) + MIN_DELAY_SECONDS;
}

function log(...args) {
  console.log(`[whatsapp-worker ${new Date().toISOString()}]`, ...args);
}

async function logError(userId, message) {
  console.error(`[whatsapp-worker ERROR]`, message);
  try {
    await prisma.whatsappErrorLog.create({ data: { userId, message: String(message).slice(0, 2000) } });
  } catch (e) {
    console.error("Falha ao gravar log de erro:", e);
  }
}

async function loadFunnelMessages(userId) {
  const rows = await prisma.whatsappFunnelMessage.findMany({ where: { userId } });
  const byKey = new Map(rows.map((r) => [r.key, r.text]));
  const messages = {};
  for (const key of Object.keys(DEFAULT_FUNNEL_MESSAGES)) {
    messages[key] = byKey.get(key) ?? DEFAULT_FUNNEL_MESSAGES[key];
  }
  return messages;
}

// ---------- Auth state persistido no Postgres (substitui useMultiFileAuthState) ----------

async function usePostgresAuthState(userId) {
  const existing = await prisma.whatsappSession.findUnique({ where: { userId } });
  const store = existing?.authState ? JSON.parse(existing.authState, BufferJSON.reviver) : {};
  const creds = store["creds.json"] || initAuthCreds();
  store["creds.json"] = creds;

  const persist = async () => {
    await prisma.whatsappSession.update({
      where: { userId },
      data: { authState: JSON.stringify(store, BufferJSON.replacer) },
    });
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          for (const id of ids) {
            let value = store[`${type}-${id}.json`];
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            result[id] = value;
          }
          return result;
        },
        set: async (updates) => {
          for (const category of Object.keys(updates)) {
            for (const id of Object.keys(updates[category])) {
              const value = updates[category][id];
              const key = `${category}-${id}.json`;
              if (value) store[key] = value;
              else delete store[key];
            }
          }
          await persist();
        },
      },
    },
    saveCreds: async () => {
      store["creds.json"] = creds;
      await persist();
    },
    clear: async () => {
      await prisma.whatsappSession.update({ where: { userId }, data: { authState: "" } });
    },
  };
}

// ---------- Chatbot reativo ----------

async function findOrCreateClient(userId, phone, pushName) {
  let client = await prisma.crmClient.findFirst({ where: { userId, phone } });
  if (!client) {
    client = await prisma.crmClient.create({
      data: {
        userId,
        fullName: pushName || phone,
        phone,
        status: "CONTACTED",
        statusHistory: { create: { status: "CONTACTED" } },
      },
    });
    log(`Novo cliente criado a partir do WhatsApp: ${client.fullName} (${phone})`);
  }
  return client;
}

async function notifyHuman(userId, subject, body) {
  await prisma.notification.create({
    data: { userId, type: "SYSTEM", sender: "WhatsApp", subject, body },
  });
}

async function handleIncomingMessage(userId, phone, text, pushName, funnel) {
  const client = await findOrCreateClient(userId, phone, pushName);

  let convo = await prisma.whatsappConversationState.findUnique({
    where: { userId_phone: { userId, phone } },
  });

  const normalized = text.trim().toLowerCase();

  if (!convo) {
    try {
      convo = await prisma.whatsappConversationState.create({
        data: { userId, phone, crmClientId: client.id, step: "MENU", attempts: 0 },
      });
      return funnel.WELCOME_MENU;
    } catch (err) {
      // Corrida: mensagens em lote (ex.: histórico entregue após reconectar) podem
      // chegar quase juntas para o mesmo número. Se outra já criou o estado nesse
      // meio-tempo, só recarrega e segue o fluxo normal (não repete boas-vindas).
      convo = await prisma.whatsappConversationState.findUnique({
        where: { userId_phone: { userId, phone } },
      });
      if (!convo) throw err;
    }
  }

  const advance = (data) =>
    prisma.whatsappConversationState.update({ where: { id: convo.id }, data });

  switch (convo.step) {
    case "MENU": {
      if (normalized === "1" || normalized.includes("novo caso")) {
        await advance({ step: "COLLECT_NAME", attempts: 0 });
        return funnel.COLLECT_NAME;
      }
      if (normalized === "2" || normalized.includes("acompanhar")) {
        await advance({ step: "HUMAN_HANDOFF" });
        await notifyHuman(
          userId,
          `${client.fullName} quer acompanhar um processo`,
          `O cliente ${client.fullName} (${phone}) pediu para acompanhar um processo em andamento pelo WhatsApp.`
        );
        return funnel.HANDOFF_ACOMPANHAR;
      }
      if (normalized === "3" || normalized.includes("advogado")) {
        await advance({ step: "HUMAN_HANDOFF" });
        await notifyHuman(
          userId,
          `${client.fullName} quer falar com um advogado`,
          `O cliente ${client.fullName} (${phone}) pediu para falar com um advogado pelo WhatsApp.`
        );
        return funnel.HANDOFF_ADVOGADO;
      }
      const attempts = convo.attempts + 1;
      if (attempts >= 2) {
        await advance({ step: "HUMAN_HANDOFF", attempts });
        await notifyHuman(
          userId,
          `${client.fullName} precisa de atendimento humano`,
          `O assistente automático não entendeu a mensagem do cliente ${client.fullName} (${phone}) após 2 tentativas.`
        );
        return funnel.HANDOFF_ATTEMPTS;
      }
      await advance({ attempts });
      return funnel.MENU_INVALID;
    }

    case "COLLECT_NAME": {
      await prisma.crmClient.update({ where: { id: client.id }, data: { fullName: text.trim() } });
      await advance({ step: "COLLECT_AREA" });
      return funnel.COLLECT_AREA;
    }

    case "COLLECT_AREA": {
      const match = LEGAL_AREAS.find((a) => normalized.includes(a.toLowerCase()));
      await prisma.crmClient.update({
        where: { id: client.id },
        data: { legalArea: match || "Outro" },
      });
      await advance({ step: "COLLECT_CITY" });
      return funnel.COLLECT_CITY;
    }

    case "COLLECT_CITY": {
      await prisma.crmClient.update({
        where: { id: client.id },
        data: {
          city: text.trim(),
          status: "INITIALIZED",
          statusHistory: { create: { status: "INITIALIZED" } },
        },
      });
      await advance({ step: "DONE" });
      return funnel.DONE;
    }

    case "DONE":
    case "HUMAN_HANDOFF":
    default:
      return null; // já concluído ou aguardando humano - não fica insistindo
  }
}

// ---------- Fila de envio (humanização + limite por hora) ----------

async function queueBotReply(userId, crmClientId, phone, body) {
  const delay = randomDelaySeconds();
  await prisma.whatsappMessage.create({
    data: {
      userId,
      crmClientId,
      phone,
      direction: "OUT",
      body,
      source: "BOT",
      status: "QUEUED",
      scheduledFor: new Date(Date.now() + delay * 1000),
    },
  });
}

function startSendLoop(userId, getSock) {
  setInterval(async () => {
    const sock = getSock();
    if (!sock) return;
    try {
      // Comandos pendentes vindos da tela do hub.
      const commands = await prisma.whatsappCommand.findMany({
        where: { userId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });
      for (const cmd of commands) {
        await prisma.whatsappCommand.update({ where: { id: cmd.id }, data: { status: "DONE" } });
        if (cmd.type === "DISCONNECT") {
          log("Comando de desconexão recebido, encerrando sessão...");
          await sock.logout().catch(() => {});
          process.exit(0);
        }
        if (cmd.type === "NEW_QR") {
          log("Comando para gerar novo QR Code recebido...");
          sock.ws.close();
        }
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const sentLastHour = await prisma.whatsappMessage.count({
        where: { userId, direction: "OUT", status: "SENT", sentAt: { gte: oneHourAgo } },
      });
      if (sentLastHour >= SEND_RATE_LIMIT_PER_HOUR) {
        return; // limite atingido - mensagens ficam na fila (QUEUED) até a próxima janela
      }

      const due = await prisma.whatsappMessage.findMany({
        where: { userId, direction: "OUT", status: "QUEUED", scheduledFor: { lte: new Date() } },
        orderBy: { scheduledFor: "asc" },
        take: SEND_RATE_LIMIT_PER_HOUR - sentLastHour,
      });

      for (const msg of due) {
        try {
          await sock.sendMessage(`${msg.phone}@s.whatsapp.net`, { text: msg.body });
          await prisma.whatsappMessage.update({
            where: { id: msg.id },
            data: { status: "SENT", sentAt: new Date() },
          });
        } catch (err) {
          await prisma.whatsappMessage.update({ where: { id: msg.id }, data: { status: "FAILED" } });
          await logError(userId, `Falha ao enviar mensagem para ${msg.phone}: ${err}`);
        }
      }
    } catch (err) {
      await logError(userId, `Erro no loop de envio: ${err}`);
    }
  }, SEND_LOOP_INTERVAL_MS);
}

// ---------- Conexão ----------

let currentSock = null;

async function main() {
  const email = process.env.WHATSAPP_USER_EMAIL || process.env.ADMIN_EMAIL;
  if (!email) throw new Error("Defina WHATSAPP_USER_EMAIL ou ADMIN_EMAIL no .env");

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new Error(`Usuário não encontrado: ${email}`);
  const userId = user.id;

  await prisma.whatsappSession.upsert({
    where: { userId },
    create: { userId, status: "CONNECTING" },
    update: { status: "CONNECTING" },
  });

  const { state, saveCreds, clear } = await usePostgresAuthState(userId);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Internacional Hub", "Chrome", "1.0"],
  });
  currentSock = sock;

  if (!globalThis.__whatsappSendLoopStarted) {
    globalThis.__whatsappSendLoopStarted = true;
    startSendLoop(userId, () => currentSock);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      await prisma.whatsappSession.update({
        where: { userId },
        data: { status: "CONNECTING", qrCode: qrDataUrl },
      });
      log("Novo QR Code gerado.");
    }

    if (connection === "open") {
      const phoneNumber = jidDecode(sock.user?.id)?.user || "";
      await prisma.whatsappSession.update({
        where: { userId },
        data: {
          status: "CONNECTED",
          qrCode: "",
          phoneNumber,
          lastConnectedAt: new Date(),
          lastError: "",
        },
      });
      log(`Conectado ao WhatsApp: ${phoneNumber}`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        log("Sessão desconectada pelo próprio WhatsApp (logout). Será necessário um novo QR Code.");
        await clear();
        await prisma.whatsappSession.update({
          where: { userId },
          data: { status: "DISCONNECTED", qrCode: "" },
        });
      } else {
        // Mantém status "CONNECTING" durante o ciclo natural de renovação do QR
        // (o código expira sozinho a cada ~20s e é normal reconectar) - assim a
        // tela nunca pisca para "desconectado"/erro nesses casos comuns.
        await prisma.whatsappSession.update({ where: { userId }, data: { status: "CONNECTING" } });
        setTimeout(main, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const funnel = await loadFunnelMessages(userId);
    for (const msg of messages) {
      try {
        if (msg.key.fromMe) continue;
        if (isJidGroup(msg.key.remoteJid)) continue; // sem grupos, só conversas 1:1
        const decoded = jidDecode(msg.key.remoteJid);
        const phone = decoded?.user;
        if (!phone) continue;

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.buttonsResponseMessage?.selectedDisplayText ||
          "";
        if (!text) continue; // ignora mídia sem legenda, por ora

        const client = await findOrCreateClient(userId, phone, msg.pushName);

        await prisma.whatsappMessage.create({
          data: {
            userId,
            crmClientId: client.id,
            phone,
            direction: "IN",
            body: text,
            source: "CLIENT",
            status: "RECEIVED",
          },
        });

        await sendPush(userId, {
          title: `WhatsApp: ${client.fullName || phone}`,
          body: text.slice(0, 120),
          url: "/whatsapp",
        });

        const reply = await handleIncomingMessage(userId, phone, text, msg.pushName, funnel);
        if (reply) await queueBotReply(userId, client.id, phone, reply);
      } catch (err) {
        await logError(userId, `Erro ao processar mensagem recebida: ${err}`);
      }
    }
  });
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
