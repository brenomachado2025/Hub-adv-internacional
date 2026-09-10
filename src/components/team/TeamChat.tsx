"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = { id: string; authorId: string; authorName: string; text: string; createdAt: string };

function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function TeamChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selfId, setSelfId] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/team/chat");
    const data = await res.json();
    setMessages(data.messages ?? []);
    setSelfId(data.selfId ?? "");
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!draft.trim()) return;
    setSending(true);
    const text = draft;
    setDraft("");
    await fetch("/api/team/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    await load();
    setSending(false);
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-neutral-50 dark:bg-neutral-950">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500 text-center mt-4">
            Nenhuma mensagem ainda. Diga oi para a equipe!
          </p>
        )}
        {messages.map((m) => {
          const isSelf = m.authorId === selfId;
          return (
            <div key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  isSelf
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {!isSelf && <p className="text-xs font-semibold mb-0.5 text-blue-600 dark:text-blue-400">{m.authorName}</p>}
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className={`text-[10px] mt-1 text-right ${isSelf ? "text-blue-100" : "text-neutral-400"}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escreva uma mensagem para a equipe..."
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
    </div>
  );
}
