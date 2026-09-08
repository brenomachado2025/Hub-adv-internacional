"use client";

import { useState } from "react";
import { StatusTab } from "@/components/whatsapp/StatusTab";
import { FunnelTab } from "@/components/whatsapp/FunnelTab";
import { ConversationsTab } from "@/components/whatsapp/ConversationsTab";

const TABS = [
  { key: "status", label: "Status" },
  { key: "conversas", label: "Conversas" },
  { key: "funil", label: "Funil de Mensagens" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function WhatsappPage() {
  const [tab, setTab] = useState<TabKey>("status");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">WhatsApp</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Atendimento e captação automática de clientes direto pelo WhatsApp.
        </p>
      </div>

      <div className="flex rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden text-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 ${tab === t.key ? "bg-slate-800 text-white" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "status" && <StatusTab />}
      {tab === "conversas" && <ConversationsTab />}
      {tab === "funil" && <FunnelTab />}
    </div>
  );
}
