"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function FollowUpSettings() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/crm/follow-up-rule")
      .then((res) => res.json())
      .then((data) => {
        setDays(data.rule?.days ?? 7);
        setEnabled(data.rule?.enabled ?? false);
      });
  }, []);

  const save = async (next: { days: number; enabled: boolean }) => {
    setSaving(true);
    await fetch("/api/crm/follow-up-rule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm"
      >
        <span className="font-medium">
          Follow-up automático do funil {enabled && <span className="text-emerald-600 text-xs">(ativo)</span>}
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-wrap items-center gap-3 text-sm border-t border-neutral-100 dark:border-neutral-900 pt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                save({ days, enabled: e.target.checked });
              }}
            />
            Notificar o responsável (ou o dono da conta, se ninguém estiver atribuído) quando um cliente ficar
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10) || 7;
              setDays(v);
              save({ days: v, enabled });
            }}
            className="w-16 px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <span>dias sem mudar de status.</span>
          {saving && <span className="text-xs text-neutral-400">salvando...</span>}
        </div>
      )}
    </div>
  );
}
