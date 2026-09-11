"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type FunnelMessage = {
  key: string;
  label: string;
  help: string;
  text: string;
  isDefault: boolean;
};

export function FunnelTab() {
  const showToast = useToast();
  const [messages, setMessages] = useState<FunnelMessage[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/whatsapp/funnel");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      showToast("Não foi possível carregar as mensagens do funil.", "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (key: string, text: string) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/whatsapp/funnel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.key === key ? { ...m, text: data.text, isDefault: text.trim() === "" } : m)));
    } catch {
      showToast("Não foi possível salvar. Tente novamente.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Personalize o texto que o assistente automático envia em cada etapa da conversa. Deixe em branco para
        voltar ao texto padrão.
      </p>

      {messages.map((m) => (
        <div key={m.key} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">{m.label}</h4>
            {m.isDefault && <span className="text-xs text-neutral-400">padrão</span>}
          </div>
          {m.help && <p className="text-xs text-neutral-500 mb-2">{m.help}</p>}
          <textarea
            defaultValue={m.text}
            rows={3}
            onBlur={(e) => {
              if (e.target.value !== m.text) save(m.key, e.target.value);
            }}
            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          {savingKey === m.key && <p className="text-xs text-neutral-400 mt-1">salvando...</p>}
        </div>
      ))}
    </div>
  );
}
