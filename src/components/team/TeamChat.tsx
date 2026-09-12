"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, Send } from "lucide-react";
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

// Paleta de cores para o avatar de cada contato - so pra diferenciar as pessoas
// de relance na lista, igual um app de mensagens de verdade.
const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-sky-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-fuchsia-600",
  "bg-lime-600",
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
    <div className="grid md:grid-cols-3 h-[75vh] rounded-2xl overflow-hidden border border-neutral-200 dark:border-[#2a3942] shadow-sm">
      {/* Lista de conversas */}
      <div className="flex flex-col bg-white dark:bg-[#111b21] border-r border-neutral-200 dark:border-[#2a3942]">
        <div className="px-4 py-3.5 bg-neutral-100 dark:bg-[#202c33] border-b border-neutral-200 dark:border-[#2a3942]">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Conversas</h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-[#2a3942]">
          <button
            onClick={() => setSelected(null)}
            className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors ${
              selected === null
                ? "bg-neutral-100 dark:bg-[#2a3942]"
                : "hover:bg-neutral-50 dark:hover:bg-[#182229]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
              <Users size={22} className="text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Chat da Equipe</p>
              <p className="text-sm text-neutral-500 dark:text-[#8696a0] truncate">Conversa em grupo, todos veem</p>
            </div>
          </button>

          {others.length === 0 && (
            <p className="p-4 text-sm text-neutral-400 dark:text-[#8696a0]">
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
                className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors ${
                  selected === p.id
                    ? "bg-neutral-100 dark:bg-[#2a3942]"
                    : "hover:bg-neutral-50 dark:hover:bg-[#182229]"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full ${avatarColor(p.id)} flex items-center justify-center shrink-0 text-base font-semibold text-white`}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 truncate">{label}</p>
                  <p className="text-sm text-neutral-500 dark:text-[#8696a0] truncate">Conversa particular</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversa selecionada */}
      <div className="md:col-span-2 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
        <div className="px-4 py-2.5 bg-neutral-100 dark:bg-[#202c33] border-b border-neutral-200 dark:border-[#2a3942] flex items-center gap-3">
          {selected ? (
            <div
              className={`w-10 h-10 rounded-full ${avatarColor(selected)} flex items-center justify-center shrink-0 text-sm font-semibold text-white`}
            >
              {(selectedPerson?.name || selectedPerson?.email || "?").charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
              <Users size={18} className="text-white" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {selected ? selectedPerson?.name || selectedPerson?.email || "Conversa particular" : "Chat da Equipe"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-[#8696a0]">
              {selected ? "Só você e essa pessoa veem essa conversa" : "Visível para toda a equipe"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-4 space-y-1.5">
          {messages.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-[#8696a0] text-center mt-6">
              {selected ? "Nenhuma mensagem ainda. Diga oi!" : "Nenhuma mensagem ainda. Diga oi para a equipe!"}
            </p>
          )}
          {messages.map((m) => {
            const isSelf = m.authorId === selfId;
            return (
              <div key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] sm:max-w-[65%] px-3 py-2 text-[14.5px] shadow-sm ${
                    isSelf
                      ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-neutral-900 dark:text-neutral-50 rounded-2xl rounded-tr-sm"
                      : "bg-white dark:bg-[#202c33] text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {!isSelf && !selected && (
                    <p className={`text-xs font-semibold mb-0.5 ${avatarColor(m.authorId).replace("bg-", "text-")}`}>
                      {m.authorName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p
                    className={`text-[11px] mt-0.5 flex items-center justify-end gap-1 ${
                      isSelf ? "text-emerald-800/70 dark:text-emerald-100/60" : "text-neutral-400 dark:text-[#8696a0]"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                    {isSelf && <span aria-hidden>✓✓</span>}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 sm:px-4 py-3 bg-neutral-100 dark:bg-[#202c33] flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={selected ? "Escreva uma mensagem particular..." : "Escreva uma mensagem para a equipe..."}
            className="flex-1 px-4 py-2.5 rounded-full border-none bg-white dark:bg-[#2a3942] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-[#8696a0] text-sm outline-none"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label="Enviar mensagem"
            title="Enviar mensagem"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#029273] text-white shrink-0 disabled:opacity-50 transition-colors"
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
