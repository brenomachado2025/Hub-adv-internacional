"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { crmStatusLabel } from "@/lib/data/crm";

type Conversation = {
  clientId: string;
  fullName: string;
  phone: string;
  status: string;
  lastMessage: { body: string; direction: string; createdAt: string } | null;
};

type Message = {
  id: string;
  direction: string;
  source: string;
  body: string;
  status: string;
  createdAt: string;
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ConversationsTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/whatsapp/conversations");
    const data = await res.json();
    setConversations(data.conversations ?? []);
  }, []);

  const loadThread = useCallback(async (clientId: string) => {
    const res = await fetch(`/api/whatsapp/conversations/${clientId}/messages`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selected) return;
    loadThread(selected.clientId);
    const interval = setInterval(() => loadThread(selected.clientId), 4000);
    return () => clearInterval(interval);
  }, [selected, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    const text = draft;
    setDraft("");
    await fetch(`/api/whatsapp/conversations/${selected.clientId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    await loadThread(selected.clientId);
    setSending(false);
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900">
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">Nenhuma conversa ainda.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.clientId}
            onClick={() => setSelected(c)}
            className={`w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
              selected?.clientId === c.clientId ? "bg-neutral-100 dark:bg-neutral-900" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{c.fullName}</span>
              {c.lastMessage && (
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {formatTime(c.lastMessage.createdAt)}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 truncate">{c.lastMessage?.body ?? "-"}</p>
            <span className="text-[10px] text-slate-500">{crmStatusLabel(c.status)}</span>
          </button>
        ))}
      </div>

      <div className="md:col-span-2 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">
            Selecione uma conversa para ver o histórico.
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium">{selected.fullName}</p>
              <p className="text-xs text-neutral-500">{selected.phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-neutral-50 dark:bg-neutral-950">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      m.direction === "OUT"
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-1 text-right ${m.direction === "OUT" ? "text-emerald-100" : "text-neutral-400"}`}>
                      {m.direction === "OUT" && m.source === "BOT" && "🤖 "}
                      {formatTime(m.createdAt)}
                      {m.status === "QUEUED" && " · enviando..."}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Escreva uma mensagem..."
                className="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
