"use client";

import { useCallback, useEffect, useState } from "react";
import { DOCUMENT_PLACEHOLDERS } from "@/lib/data/documents";
import { useToast } from "@/components/Toast";

type Template = { id: string; title: string; body: string };
type GeneratedDoc = { id: string; title: string; createdAt: string; createdBy: string; status: string };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: "Pendente de aprovação", color: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" },
  APPROVED: { label: "Aprovado", color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" },
  SENT: { label: "Enviado", color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
};

export function DocumentsTab({ clientId }: { clientId: string }) {
  const showToast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<GeneratedDoc[]>([]);
  const [isOwner, setIsOwner] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/document-templates");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      showToast("Não foi possível carregar os modelos de documento.", "error");
    }
  }, [showToast]);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/documents`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      showToast("Não foi possível carregar os documentos.", "error");
    }
  }, [clientId, showToast]);

  useEffect(() => {
    loadTemplates();
    loadDocuments();
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => setIsOwner(!!data.isOwner))
      .catch(() => {});
  }, [loadTemplates, loadDocuments]);

  const setDocStatus = async (docId: string, status: string) => {
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await loadDocuments();
    } catch {
      showToast("Não foi possível atualizar o documento. Tente novamente.", "error");
    }
  };

  const generate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/crm/clients/${clientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate }),
      });
      if (!res.ok) throw new Error();
      await loadDocuments();
      showToast("Documento gerado.");
    } catch {
      showToast("Não foi possível gerar o documento. Tente novamente.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/crm/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, body: newBody }),
      });
      if (!res.ok) throw new Error();
      setNewTitle("");
      setNewBody("");
      setShowNewTemplate(false);
      await loadTemplates();
    } catch {
      showToast("Não foi possível salvar o modelo. Tente novamente.", "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <h4 className="text-sm font-semibold">Gerar documento</h4>
        {templates.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum modelo cadastrado ainda. Crie um modelo de contrato, procuração etc. com campos automáticos.
          </p>
        ) : (
          <div className="flex gap-2">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              <option value="">Selecione um modelo...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <button
              onClick={generate}
              disabled={!selectedTemplate || generating}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
            >
              {generating ? "Gerando..." : "Gerar"}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowNewTemplate((v) => !v)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showNewTemplate ? "Cancelar" : "+ Novo modelo de documento"}
        </button>

        {showNewTemplate && (
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-900">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nome do modelo (ex.: Procuração ad judicia)"
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Texto do documento, use campos entre chaves duplas para preencher automaticamente."
              rows={6}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm font-mono"
            />
            <p className="text-xs text-neutral-400">
              Campos disponíveis: {DOCUMENT_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}
            </p>
            <button
              onClick={saveTemplate}
              disabled={savingTemplate}
              className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
            >
              Salvar modelo
            </button>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Documentos gerados</h4>
        <div className="space-y-2">
          {documents.length === 0 && <p className="text-sm text-neutral-500">Nenhum documento gerado ainda.</p>}
          {documents.map((d) => {
            const s = STATUS_LABEL[d.status] ?? STATUS_LABEL.APPROVED;
            return (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-neutral-400">
                    {d.createdBy && `${d.createdBy} · `}
                    {new Date(d.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {d.status === "PENDING_APPROVAL" && isOwner && (
                    <button onClick={() => setDocStatus(d.id, "APPROVED")} className="text-xs text-blue-600 hover:underline">
                      Aprovar
                    </button>
                  )}
                  {d.status === "APPROVED" && (
                    <button onClick={() => setDocStatus(d.id, "SENT")} className="text-xs text-emerald-600 hover:underline">
                      Marcar como enviado
                    </button>
                  )}
                  <a
                    href={`/api/crm/clients/${clientId}/documents/${d.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Abrir PDF
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
