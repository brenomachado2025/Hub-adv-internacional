"use client";

import { useCallback, useEffect, useState } from "react";

type Meeting = { id: string; title: string; scheduledFor: string; notes: string; createdAt: string };

export function MeetingsTab({ clientId }: { clientId: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/meetings`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    } catch {
      setError("Não foi possível carregar as reuniões. Tente recarregar a página.");
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!title.trim() || !scheduledFor) {
      setError("Título e data/hora são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, scheduledFor, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao agendar.");
      } else {
        setTitle("");
        setScheduledFor("");
        setNotes("");
        await load();
      }
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduledFor) >= now);
  const past = meetings.filter((m) => new Date(m.scheduledFor) < now);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <h4 className="text-sm font-semibold">Agendar reunião ou audiência</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Audiência de conciliação"
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Data e hora</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-neutral-500">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
          >
            Agendar
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Próximas</h4>
        <div className="space-y-2">
          {upcoming.length === 0 && <p className="text-sm text-neutral-500">Nenhuma reunião agendada.</p>}
          {upcoming.map((m) => (
            <MeetingRow key={m.id} meeting={m} />
          ))}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-neutral-400">Anteriores</h4>
          <div className="space-y-2 opacity-70">
            {past.map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
      <p className="text-sm font-medium">{meeting.title}</p>
      <p className="text-xs text-neutral-500">{new Date(meeting.scheduledFor).toLocaleString("pt-BR")}</p>
      {meeting.notes && <p className="text-xs text-neutral-400 mt-1">{meeting.notes}</p>}
    </div>
  );
}
