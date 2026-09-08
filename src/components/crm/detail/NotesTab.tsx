"use client";

import { useCallback, useEffect, useState } from "react";

type Note = { id: string; authorName: string; text: string; createdAt: string };

export function NotesTab({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/clients/${clientId}/notes`);
    const data = await res.json();
    setNotes(data.notes ?? []);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await fetch(`/api/crm/clients/${clientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draft }),
    });
    setDraft("");
    setSaving(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Registrar anotação ou observação sobre a conversa/andamento do caso..."
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={saving || !draft.trim()}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notes.length === 0 && <p className="text-sm text-neutral-500">Nenhuma anotação ainda.</p>}
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
            <p className="text-sm whitespace-pre-wrap">{n.text}</p>
            <p className="text-xs text-neutral-400 mt-1.5">
              {n.authorName} · {new Date(n.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
