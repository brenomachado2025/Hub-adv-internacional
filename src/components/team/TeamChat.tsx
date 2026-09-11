"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { useToast } from "@/components/Toast";

type Message = { id: string; authorId: string; authorName: string; text: string; createdAt: string };
type Person = { id: string; name: string; email: string };

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
  const showToast = useToast();
  const [selfId, setSelfId] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // null = chat da equipe (grupo)
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        const all: Person[] = [
          data.owner ? { id: data.owner.id, name: data.owner.name, email: data.owner.email } : null,
          ...(data.members ?? []),
        ].filter((p): p is Person => !!p);
        setPeople(all);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const url = selected ? `/api/team/chat?with=${selected}` : "/api/team/chat";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setSelfId(data.selfId ?? "");
    } catch {
      // Falha pontual numa consulta de polling a cada 4s se autocorrige na próxima
      // tentativa - não vale interromper o usuário com um toast a cada rodada.
    }
  }, [selected]);

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
    try {
      const res = await fetch("/api/team/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, recipientId: selected ?? undefined }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setDraft(text);
      showToast("Não foi possível enviar a mensagem. Tente novamente.", "error");
    } finally {
      setSending(false);
    }
  };

  const others = people.filter((p) => p.id !== selfId);
  const selectedPerson = others.find((p) => p.id === selected);

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900">
        <button
          onClick={() => setSelected(null)}
          className={`w-full text-left p-3 flex items-center gap-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
            selected === null ? "bg-neutral-100 dark:bg-neutral-900" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Chat da Equipe</p>
            <p className="text-xs text-neutral-500 truncate">Conversa em grupo, todos veem</p>
          </div>
        </button>

        {others.length === 0 && (
          <p className="p-3 text-xs text-neutral-400">
            Convide colegas em Configurações para conversar em particular.
          </p>
        )}
        {others.map((p) => {
          const label = p.name || p.email;
          const initial = label.charAt(0).toUpperCase();
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left p-3 flex items-center gap-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                selected === p.id ? "bg-neutral-100 dark:bg-neutral-900" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{label}</p>
                <p className="text-xs text-neutral-500 truncate">Conversa particular</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="md:col-span-2 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-medium">
            {selected ? selectedPerson?.name || selectedPerson?.email || "Conversa particular" : "Chat da Equipe"}
          </p>
          <p className="text-xs text-neutral-500">
            {selected ? "Só você e essa pessoa veem essa conversa" : "Visível para toda a equipe"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-neutral-50 dark:bg-neutral-950">
          {messages.length === 0 && (
            <p className="text-sm text-neutral-500 text-center mt-4">
              {selected ? "Nenhuma mensagem ainda. Diga oi!" : "Nenhuma mensagem ainda. Diga oi para a equipe!"}
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
                  {!isSelf && !selected && (
                    <p className="text-xs font-semibold mb-0.5 text-blue-600 dark:text-blue-400">{m.authorName}</p>
                  )}
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
            placeholder={selected ? "Escreva uma mensagem particular..." : "Escreva uma mensagem para a equipe..."}
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
    </div>
  );
}
