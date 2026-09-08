"use client";

import { useEffect, useState } from "react";

const COLOR: Record<string, string> = {
  CONNECTED: "bg-emerald-500",
  CONNECTING: "bg-amber-500",
  DISCONNECTED: "bg-red-500",
};

export function WhatsappStatusDot() {
  const [status, setStatus] = useState("DISCONNECTED");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/whatsapp/status")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setStatus(data.session?.status ?? "DISCONNECTED");
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${COLOR[status] ?? COLOR.DISCONNECTED}`}
      title={`WhatsApp: ${status}`}
      aria-hidden
    />
  );
}
