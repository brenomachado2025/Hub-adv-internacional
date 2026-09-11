"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, GitBranch, Clock, MessageCircle, CircleDollarSign, ArrowRight, Trash2, Zap } from "lucide-react";
import { CRM_STATUSES } from "@/lib/data/crm";
import { useToast } from "@/components/Toast";

type AutoTaskRule = { enabled: boolean; taskTitle: string; daysUntilDue: number };
type FollowUpRule = { enabled: boolean; days: number };
type WhatsappConfig = { status: string; message: string; enabled: boolean };

function RuleCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserPlus;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AutomationsView() {
  const [autoTask, setAutoTask] = useState<AutoTaskRule>({ enabled: false, taskTitle: "Primeiro contato", daysUntilDue: 1 });
  const [savingAutoTask, setSavingAutoTask] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUpRule | null>(null);
  const [whatsappConfigs, setWhatsappConfigs] = useState<WhatsappConfig[]>([]);

  useEffect(() => {
    fetch("/api/crm/auto-task-rule")
      .then((res) => res.json())
      .then((data) => setAutoTask(data.rule));
    fetch("/api/crm/follow-up-rule")
      .then((res) => res.json())
      .then((data) => setFollowUp(data.rule));
    fetch("/api/whatsapp/status-notifications")
      .then((res) => res.json())
      .then((data) => setWhatsappConfigs(data.configs ?? []));
  }, []);

  const saveAutoTask = async (next: AutoTaskRule) => {
    setAutoTask(next);
    setSavingAutoTask(true);
    await fetch("/api/crm/auto-task-rule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSavingAutoTask(false);
  };

  const activeWhatsappRules = whatsappConfigs.filter((c) => c.enabled && c.message.trim());

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <RuleCard
        icon={UserPlus}
        title="Novo cliente cadastrado → cria tarefa"
        description="Ao cadastrar um cliente no CRM, cria automaticamente uma tarefa pendente vinculada a ele."
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoTask.enabled}
              onChange={(e) => saveAutoTask({ ...autoTask, enabled: e.target.checked })}
            />
            Ativado
          </label>
          <div className="flex gap-2">
            <input
              value={autoTask.taskTitle}
              onChange={(e) => setAutoTask((a) => ({ ...a, taskTitle: e.target.value }))}
              onBlur={() => saveAutoTask(autoTask)}
              placeholder="Título da tarefa"
              className="flex-1 px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <input
              type="number"
              min={0}
              max={30}
              value={autoTask.daysUntilDue}
              onChange={(e) => setAutoTask((a) => ({ ...a, daysUntilDue: parseInt(e.target.value, 10) || 0 }))}
              onBlur={() => saveAutoTask(autoTask)}
              className="w-16 px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              title="Prazo em dias"
            />
          </div>
          <p className="text-xs text-neutral-400">Prazo da tarefa: {autoTask.daysUntilDue} dia(s) após o cadastro.</p>
          {savingAutoTask && <p className="text-xs text-neutral-400">salvando...</p>}
        </div>
      </RuleCard>

      <RuleCard
        icon={GitBranch}
        title="Funil parado → notifica responsável"
        description='"Se o cliente não mudar de status em N dias, notifica o responsável (ou o dono da conta)."'
      >
        {followUp ? (
          <p className="text-sm">
            {followUp.enabled ? (
              <span className="text-emerald-600 font-medium">Ativado</span>
            ) : (
              <span className="text-neutral-400">Desativado</span>
            )}{" "}
            · {followUp.days} dia(s)
          </p>
        ) : (
          <p className="text-sm text-neutral-400">Carregando...</p>
        )}
        <Link href="/crm" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
          Configurar no CRM <ArrowRight size={12} />
        </Link>
      </RuleCard>

      <RuleCard
        icon={MessageCircle}
        title="Cliente muda de status → WhatsApp automático"
        description="Envia uma mensagem automática quando um cliente muda de etapa no funil — só para quem já escreveu antes."
      >
        {activeWhatsappRules.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhuma etapa com mensagem automática ativada.</p>
        ) : (
          <p className="text-sm text-emerald-600 font-medium">{activeWhatsappRules.length} etapa(s) com envio automático ativo</p>
        )}
        <Link href="/whatsapp" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
          Configurar no WhatsApp <ArrowRight size={12} />
        </Link>
      </RuleCard>

      <RuleCard
        icon={Clock}
        title="Prazo processual vencendo → alerta"
        description='"Se um prazo vence em X dias, notifica o responsável." Automático para todo prazo cadastrado em um processo (padrão: 5, 2 e 1 dia antes).'
      >
        <p className="text-sm text-emerald-600 font-medium">Sempre ativo, por prazo cadastrado</p>
        <Link href="/processos" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
          Ver processos <ArrowRight size={12} />
        </Link>
      </RuleCard>

      <RuleCard
        icon={CircleDollarSign}
        title="Parcela em atraso → cobrança"
        description="Quando uma parcela de honorários vence sem pagamento, notifica o escritório e avisa o cliente por WhatsApp (se ele já tiver escrito antes)."
      >
        <p className="text-sm text-emerald-600 font-medium">Sempre ativo, por contrato de honorários</p>
        <Link href="/crm" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
          Ver clientes <ArrowRight size={12} />
        </Link>
      </RuleCard>

      <div className="md:col-span-2">
        <CustomAutomations />
      </div>
    </div>
  );
}

type CustomRule = {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerStatus: string;
  actionType: string;
  actionText: string;
  actionDays: number;
};

const TRIGGER_LABEL: Record<string, string> = {
  CLIENT_CREATED: "Novo cliente cadastrado",
  CLIENT_STATUS_CHANGED: "Cliente muda de status",
};

const ACTION_LABEL: Record<string, string> = {
  CREATE_TASK: "Criar tarefa",
  SEND_NOTIFICATION: "Enviar notificação interna",
  SEND_WHATSAPP: "Enviar WhatsApp (só quem já escreveu)",
};

function CustomAutomations() {
  const showToast = useToast();
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("CLIENT_CREATED");
  const [triggerStatus, setTriggerStatus] = useState("");
  const [actionType, setActionType] = useState("CREATE_TASK");
  const [actionText, setActionText] = useState("");
  const [actionDays, setActionDays] = useState("1");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/automation-rules");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch {
      showToast("Não foi possível carregar as automações personalizadas.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!actionText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          triggerType,
          triggerStatus: triggerType === "CLIENT_STATUS_CHANGED" ? triggerStatus : "",
          actionType,
          actionText,
          actionDays: parseInt(actionDays, 10) || 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setName("");
      setActionText("");
      setActionDays("1");
      setShowNew(false);
      await load();
      showToast("Automação criada.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível criar a automação.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (rule: CustomRule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    try {
      const res = await fetch(`/api/automation-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)));
      showToast("Não foi possível atualizar a automação.", "error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta automação?")) return;
    const previous = rules;
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/automation-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setRules(previous);
      showToast("Não foi possível remover a automação.", "error");
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
          <Zap size={18} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Automações personalizadas</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Monte suas próprias regras "se isso, então aquilo" combinando gatilho e ação.
              </p>
            </div>
            <button onClick={() => setShowNew((v) => !v)} className="text-xs text-blue-600 hover:underline shrink-0">
              {showNew ? "Cancelar" : "+ Nova regra"}
            </button>
          </div>

          {showNew && (
            <div className="mt-3 space-y-2 rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da regra (opcional)"
                className="w-full px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <div className="grid sm:grid-cols-2 gap-2">
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                >
                  {Object.entries(TRIGGER_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                {triggerType === "CLIENT_STATUS_CHANGED" && (
                  <select
                    value={triggerStatus}
                    onChange={(e) => setTriggerStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  >
                    <option value="">Qualquer status</option>
                    {CRM_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              >
                {Object.entries(ACTION_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder={actionType === "CREATE_TASK" ? "Título da tarefa" : "Texto da mensagem"}
                  className="flex-1 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
                {actionType === "CREATE_TASK" && (
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={actionDays}
                    onChange={(e) => setActionDays(e.target.value)}
                    title="Prazo em dias"
                    className="w-20 px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                )}
              </div>

              <button
                onClick={create}
                disabled={saving || !actionText.trim()}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
              >
                Criar regra
              </button>
            </div>
          )}

          <div className="mt-3 space-y-2">
            {rules.length === 0 && !showNew && (
              <p className="text-xs text-neutral-400">Nenhuma automação personalizada ainda.</p>
            )}
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {r.name || `${TRIGGER_LABEL[r.triggerType]} → ${ACTION_LABEL[r.actionType]}`}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {TRIGGER_LABEL[r.triggerType]}
                    {r.triggerStatus && ` (${CRM_STATUSES.find((s) => s.value === r.triggerStatus)?.label ?? r.triggerStatus})`}
                    {" → "}
                    {ACTION_LABEL[r.actionType]}: {r.actionText}
                    {r.actionType === "CREATE_TASK" && ` (${r.actionDays}d)`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                    <input type="checkbox" checked={r.enabled} onChange={() => toggle(r)} />
                    Ativa
                  </label>
                  <button onClick={() => remove(r.id)} className="text-neutral-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
