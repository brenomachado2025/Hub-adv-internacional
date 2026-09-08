"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, GitBranch, Clock, MessageCircle, CircleDollarSign, ArrowRight } from "lucide-react";

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
    </div>
  );
}
