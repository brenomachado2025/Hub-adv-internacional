"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TRIBUNAL_OPTIONS } from "@/lib/legal/datajud";

type Deadline = { id: string; title: string; dueDate: string; status: string; alertDays: string };
type TimeEntry = {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number | null;
  date: string;
  user: { name: string; email: string };
};
type CaseItem = {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  tribunalAlias: string;
  status: string;
  createdAt: string;
  deadlines: Deadline[];
  _count: { movements: number };
};

const TRIBUNAL_GROUPS = Array.from(new Set(TRIBUNAL_OPTIONS.map((t) => t.group)));

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Ativo", CLOSED: "Encerrado", ARCHIVED: "Arquivado" };

export function CasesTab({ clientId }: { clientId: string }) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState("");
  const [tribunalAlias, setTribunalAlias] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/clients/${clientId}/cases`);
    const data = await res.json();
    setCases(data.cases ?? []);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const createCase = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/crm/clients/${clientId}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, caseNumber, court, tribunalAlias }),
    });
    setTitle("");
    setCaseNumber("");
    setCourt("");
    setTribunalAlias("");
    setSaving(false);
    setShowNew(false);
    load();
  };

  const changeStatus = async (caseId: string, status: string) => {
    if (status !== "ACTIVE" && !confirm(`${status === "CLOSED" ? "Encerrar" : "Arquivar"} este processo?`)) return;
    await fetch(`/api/crm/clients/${clientId}/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Processos vinculados</h4>
          <button onClick={() => setShowNew((v) => !v)} className="text-xs text-blue-600 hover:underline">
            {showNew ? "Cancelar" : "+ Vincular processo"}
          </button>
        </div>
        {showNew && (
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do caso"
              className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="Número CNJ (opcional)"
              className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              placeholder="Vara/comarca (texto livre, opcional)"
              className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <select
              value={tribunalAlias}
              onChange={(e) => setTribunalAlias(e.target.value)}
              className="sm:col-span-3 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              <option value="">Tribunal (para consulta automática DataJud) — opcional</option>
              {TRIBUNAL_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {TRIBUNAL_OPTIONS.filter((t) => t.group === group).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              onClick={createCase}
              disabled={saving || !title.trim()}
              className="sm:col-span-3 px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50 w-fit"
            >
              Vincular
            </button>
          </div>
        )}
      </div>

      {cases.length === 0 && <p className="text-sm text-neutral-500">Nenhum processo vinculado ainda.</p>}

      {cases.map((c) => (
        <div key={c.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <button
            onClick={() => setExpanded((e) => (e === c.id ? null : c.id))}
            className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <div className="text-left">
              <p className="text-sm font-medium">
                {c.title} {c.caseNumber && <span className="text-neutral-400 font-normal">· {c.caseNumber}</span>}
              </p>
              <p className="text-xs text-neutral-500">
                {STATUS_LABEL[c.status]} · {c._count.movements} andamento(s)
                {c.deadlines.length > 0 && (
                  <span className="text-amber-600"> · {c.deadlines.length} prazo(s) pendente(s)</span>
                )}
              </p>
            </div>
            <ChevronDown size={18} className={`transition-transform ${expanded === c.id ? "rotate-180" : ""}`} />
          </button>
          {expanded === c.id && <CaseDetail clientId={clientId} legalCase={c} onChangeStatus={changeStatus} onReload={load} />}
        </div>
      ))}
    </div>
  );
}

function CaseDetail({
  clientId,
  legalCase,
  onChangeStatus,
  onReload,
}: {
  clientId: string;
  legalCase: CaseItem;
  onChangeStatus: (caseId: string, status: string) => void;
  onReload: () => void;
}) {
  const [movements, setMovements] = useState<{ id: string; type: string; description: string; occurredAt: string; source: string }[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [movementText, setMovementText] = useState("");
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryHours, setEntryHours] = useState("");
  const [entryRate, setEntryRate] = useState("");
  const [consultingDataJud, setConsultingDataJud] = useState(false);
  const [dataJudMessage, setDataJudMessage] = useState("");
  const [editingCaseInfo, setEditingCaseInfo] = useState(false);
  const [editCaseNumber, setEditCaseNumber] = useState(legalCase.caseNumber);
  const [editTribunalAlias, setEditTribunalAlias] = useState(legalCase.tribunalAlias);

  const load = useCallback(async () => {
    const [mRes, dRes, tRes] = await Promise.all([
      fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/movements`),
      fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/deadlines`),
      fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/time-entries`),
    ]);
    setMovements((await mRes.json()).movements ?? []);
    setDeadlines((await dRes.json()).deadlines ?? []);
    setTimeEntries((await tRes.json()).entries ?? []);
  }, [clientId, legalCase.id]);

  useEffect(() => {
    load();
  }, [load]);

  const addMovement = async () => {
    if (!movementText.trim()) return;
    await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: movementText }),
    });
    setMovementText("");
    load();
  };

  const addDeadline = async () => {
    if (!deadlineTitle.trim() || !deadlineDate) return;
    await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/deadlines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: deadlineTitle, dueDate: deadlineDate }),
    });
    setDeadlineTitle("");
    setDeadlineDate("");
    load();
    onReload();
  };

  const toggleDeadline = async (deadlineId: string, status: string) => {
    await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/deadlines/${deadlineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    onReload();
  };

  const consultarDataJud = async () => {
    setConsultingDataJud(true);
    setDataJudMessage("");
    const res = await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/consulta-datajud`, { method: "POST" });
    const data = await res.json();
    setDataJudMessage(
      res.ok
        ? data.message ?? `${data.imported} novo(s) andamento(s) importado(s).`
        : data.error ?? "Erro ao consultar."
    );
    setConsultingDataJud(false);
    load();
  };

  const addTimeEntry = async () => {
    const hours = parseFloat(entryHours.replace(",", "."));
    if (!hours || hours <= 0) return;
    await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: entryDescription,
        hours,
        hourlyRate: entryRate ? parseFloat(entryRate.replace(",", ".")) : undefined,
      }),
    });
    setEntryDescription("");
    setEntryHours("");
    setEntryRate("");
    load();
  };

  const removeTimeEntry = async (entryId: string) => {
    await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}/time-entries/${entryId}`, { method: "DELETE" });
    load();
  };

  const saveCaseInfo = async () => {
    await fetch(`/api/crm/clients/${clientId}/cases/${legalCase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseNumber: editCaseNumber, tribunalAlias: editTribunalAlias }),
    });
    setEditingCaseInfo(false);
    onReload();
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalValue = timeEntries.reduce((sum, e) => sum + (e.hourlyRate ? e.hours * e.hourlyRate : 0), 0);

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 space-y-5 bg-neutral-50 dark:bg-neutral-950">
      {legalCase.status === "ACTIVE" && (
        <div className="flex gap-2">
          <button
            onClick={() => onChangeStatus(legalCase.id, "CLOSED")}
            className="text-xs px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700"
          >
            Encerrar processo
          </button>
          <button
            onClick={() => onChangeStatus(legalCase.id, "ARCHIVED")}
            className="text-xs px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700"
          >
            Arquivar
          </button>
        </div>
      )}
      {legalCase.status !== "ACTIVE" && (
        <button
          onClick={() => onChangeStatus(legalCase.id, "ACTIVE")}
          className="text-xs px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700"
        >
          Reabrir processo
        </button>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <h5 className="text-xs font-semibold uppercase text-neutral-400">Número CNJ / Tribunal</h5>
          <button onClick={() => setEditingCaseInfo((v) => !v)} className="text-xs text-blue-600 hover:underline">
            {editingCaseInfo ? "Cancelar" : "Editar"}
          </button>
        </div>
        {editingCaseInfo ? (
          <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
            <input
              value={editCaseNumber}
              onChange={(e) => setEditCaseNumber(e.target.value)}
              placeholder="Número CNJ"
              className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <select
              value={editTribunalAlias}
              onChange={(e) => setEditTribunalAlias(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              <option value="">Sem tribunal selecionado</option>
              {TRIBUNAL_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {TRIBUNAL_OPTIONS.filter((t) => t.group === group).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button onClick={saveCaseInfo} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs">
              Salvar
            </button>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            {legalCase.caseNumber || "sem número"}
            {legalCase.tribunalAlias && ` · ${TRIBUNAL_OPTIONS.find((t) => t.value === legalCase.tribunalAlias)?.label ?? legalCase.tribunalAlias}`}
          </p>
        )}
      </div>

      <div>
        <h5 className="text-xs font-semibold uppercase text-neutral-400 mb-2">Prazos</h5>
        <div className="flex gap-2 mb-2">
          <input
            value={deadlineTitle}
            onChange={(e) => setDeadlineTitle(e.target.value)}
            placeholder="Ex.: Contestação"
            className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <button onClick={addDeadline} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs">
            Definir prazo
          </button>
        </div>
        <p className="text-xs text-neutral-400 mb-2">Alerta automático 5, 2 e 1 dia antes do vencimento.</p>
        <div className="space-y-1.5">
          {deadlines.length === 0 && <p className="text-xs text-neutral-500">Nenhum prazo cadastrado.</p>}
          {deadlines.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.status === "DONE"}
                  onChange={() => toggleDeadline(d.id, d.status === "DONE" ? "PENDING" : "DONE")}
                />
                <span className={d.status === "DONE" ? "line-through text-neutral-400" : d.status === "EXPIRED" ? "text-red-600" : ""}>
                  {d.title} — {new Date(d.dueDate).toLocaleDateString("pt-BR")}
                  {d.status === "EXPIRED" && " (vencido)"}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-semibold uppercase text-neutral-400">Andamentos</h5>
          {legalCase.caseNumber && legalCase.tribunalAlias && (
            <button
              onClick={consultarDataJud}
              disabled={consultingDataJud}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {consultingDataJud ? "Consultando..." : "Consultar tribunal (DataJud)"}
            </button>
          )}
        </div>
        {dataJudMessage && <p className="text-xs text-neutral-500 mb-2">{dataJudMessage}</p>}
        <div className="flex gap-2 mb-2">
          <input
            value={movementText}
            onChange={(e) => setMovementText(e.target.value)}
            placeholder="Nova movimentação, decisão ou despacho..."
            className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <button onClick={addMovement} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs">
            Adicionar
          </button>
        </div>
        <div className="space-y-1.5">
          {movements.length === 0 && <p className="text-xs text-neutral-500">Nenhum andamento registrado.</p>}
          {movements.map((m) => (
            <div key={m.id} className="text-sm bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2">
              <p>{m.description}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {new Date(m.occurredAt).toLocaleString("pt-BR")}
                {m.source === "DATAJUD" && " · via DataJud"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-xs font-semibold uppercase text-neutral-400 mb-2">Horas trabalhadas</h5>
        <div className="grid sm:grid-cols-[1fr_100px_120px_auto] gap-2 mb-2">
          <input
            value={entryDescription}
            onChange={(e) => setEntryDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <input
            value={entryHours}
            onChange={(e) => setEntryHours(e.target.value)}
            placeholder="Horas"
            inputMode="decimal"
            className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <input
            value={entryRate}
            onChange={(e) => setEntryRate(e.target.value)}
            placeholder="Valor/hora (opcional)"
            inputMode="decimal"
            className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <button onClick={addTimeEntry} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs">
            Registrar
          </button>
        </div>
        {timeEntries.length > 0 && (
          <p className="text-xs text-neutral-500 mb-2">
            Total: {totalHours.toFixed(1)}h{totalValue > 0 && ` · ${totalValue.toFixed(2)} (estimado pelo valor/hora informado)`}
          </p>
        )}
        <div className="space-y-1.5">
          {timeEntries.length === 0 && <p className="text-xs text-neutral-500">Nenhuma hora registrada.</p>}
          {timeEntries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between text-sm bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2"
            >
              <div>
                <p>
                  {e.hours}h {e.description && `— ${e.description}`}
                  {e.hourlyRate ? ` (${(e.hours * e.hourlyRate).toFixed(2)})` : ""}
                </p>
                <p className="text-xs text-neutral-400">
                  {e.user.name || e.user.email} · {new Date(e.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button onClick={() => removeTimeEntry(e.id)} className="text-xs text-red-600 hover:underline shrink-0">
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
