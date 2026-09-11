"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { useToast } from "@/components/Toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationsPanel() {
  const showToast = useToast();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const enable = async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      showToast("Notificações push não estão configuradas no servidor.", "error");
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        showToast("Permissão de notificação negada.", "error");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      showToast("Notificações ativadas neste aparelho.");
    } catch {
      showToast("Não foi possível ativar as notificações. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      showToast("Notificações desativadas neste aparelho.");
    } catch {
      showToast("Não foi possível desativar. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Notificações push</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Receba avisos no navegador/celular mesmo com o Hub fechado — mensagens novas do WhatsApp e prazos
          processuais vencendo.
        </p>
      </div>

      {!supported && (
        <p className="text-sm text-amber-600">
          Este navegador não suporta notificações push, ou o Hub não foi instalado como app.
        </p>
      )}

      {supported && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
              <BellRing size={18} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {subscribed ? "Ativadas neste aparelho" : "Desativadas neste aparelho"}
              </p>
              {permission === "denied" && (
                <p className="text-xs text-red-600 mt-0.5">
                  Bloqueado nas configurações do navegador — permita notificações para este site pra ativar.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={subscribed ? disable : enable}
            disabled={loading || permission === "denied"}
            className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 shrink-0 ${
              subscribed
                ? "border border-neutral-300 dark:border-neutral-700"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {loading ? "..." : subscribed ? "Desativar" : "Ativar"}
          </button>
        </div>
      )}
    </div>
  );
}
