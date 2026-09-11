"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  sender: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  SANCTIONS: "Sanções",
  FX: "Câmbio",
  INVOICE: "Faturamento",
  MEETING: "Reunião",
  SYSTEM: "Sistema",
};

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setError(null);
    } catch {
      setError("Não foi possível carregar as notificações. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNotification = async (n: Notification) => {
    setSelected(n);
    if (!n.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id, isRead: true }),
      });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notificações</h2>
          <p className="text-neutral-500 text-sm mt-1">
            Central de novidades do hub — mudanças de sanções, faturas emitidas e mais.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="text-sm px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-900 max-h-[70vh] overflow-y-auto">
          {loading && <p className="p-4 text-sm text-neutral-500">Carregando...</p>}
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {!loading && !error && notifications.length === 0 && (
            <p className="p-4 text-sm text-neutral-500">Nenhuma notificação ainda.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => openNotification(n)}
              className={`w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                selected?.id === n.id ? "bg-neutral-100 dark:bg-neutral-900" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {TYPE_LABEL[n.type] ?? n.type} · {n.sender}
                </span>
                <span className="text-xs text-neutral-400">{new Date(n.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <div className={`text-sm mt-1 ${n.isRead ? "text-neutral-500" : "font-semibold"}`}>
                {!n.isRead && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2" />}
                {n.subject}
              </div>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{n.body}</p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
          {!selected ? (
            <p className="text-sm text-neutral-500">Selecione uma notificação para ler.</p>
          ) : (
            <div>
              <div className="text-xs text-neutral-400">
                De: {selected.sender} · {TYPE_LABEL[selected.type] ?? selected.type}
              </div>
              <h3 className="text-lg font-semibold mt-1">{selected.subject}</h3>
              <p className="text-xs text-neutral-400 mt-1">
                {new Date(selected.createdAt).toLocaleString("pt-BR")}
              </p>
              <p className="text-sm mt-4 whitespace-pre-wrap">{selected.body}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
