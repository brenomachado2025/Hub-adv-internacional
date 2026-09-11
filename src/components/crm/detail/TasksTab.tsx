"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";

type Task = {
  id: string;
  title: string;
  assignee: string;
  dueDate: string | null;
  status: string;
  createdAt: string;
};

export function TasksTab({ clientId }: { clientId: string }) {
  const showToast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/tasks`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, assignee, dueDate: dueDate || undefined }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setAssignee("");
      setDueDate("");
      await load();
    } catch {
      showToast("Não foi possível salvar a tarefa. Tente novamente.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (task: Task) => {
    const nextStatus = task.status === "DONE" ? "PENDING" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      showToast("Não foi possível atualizar a tarefa. Tente novamente.", "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta tarefa?")) return;
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(previous);
      showToast("Não foi possível remover a tarefa. Tente novamente.", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 grid sm:grid-cols-[1fr_160px_160px_auto] gap-2 items-end">
        <div>
          <label className="text-xs text-neutral-500">Tarefa</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Ex.: "aguardando assinatura"'
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Responsável</label>
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Opcional"
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Prazo</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>
        <button
          onClick={submit}
          disabled={saving || !title.trim()}
          className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      <div className="space-y-2">
        {loadError && <p className="text-sm text-red-600">Não foi possível carregar as tarefas.</p>}
        {!loadError && tasks.length === 0 && <p className="text-sm text-neutral-500">Nenhuma tarefa pendente.</p>}
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
          >
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <input type="checkbox" checked={t.status === "DONE"} onChange={() => toggle(t)} />
              <div>
                <p className={`text-sm ${t.status === "DONE" ? "line-through text-neutral-400" : ""}`}>{t.title}</p>
                <p className="text-xs text-neutral-400">
                  {t.assignee ? `${t.assignee} · ` : ""}
                  {t.dueDate ? `prazo ${new Date(t.dueDate).toLocaleDateString("pt-BR")}` : "sem prazo"}
                </p>
              </div>
            </label>
            <button onClick={() => remove(t.id)} className="text-neutral-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
