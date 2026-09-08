"use client";

import { useCallback, useEffect, useState } from "react";
import { DOCUMENT_PLACEHOLDERS } from "@/lib/data/documents";

type Template = { id: string; title: string; body: string };
type GeneratedDoc = { id: string; title: string; createdAt: string };

export function DocumentsTab({ clientId }: { clientId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<GeneratedDoc[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadTemplates = useCallback(async () => {
    const res = await fetch("/api/crm/document-templates");
    const data = await res.json();
    setTemplates(data.templates ?? []);
  }, []);

  const loadDocuments = useCallback(async () => {
    const res = await fetch(`/api/crm/clients/${clientId}/documents`);
    const data = await res.json();
    setDocuments(data.documents ?? []);
  }, [clientId]);

  useEffect(() => {
    loadTemplates();
    loadDocuments();
  }, [loadTemplates, loadDocuments]);

  const generate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    await fetch(`/api/crm/clients/${clientId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selectedTemplate }),
    });
    setGenerating(false);
    loadDocuments();
  };

  const saveTemplate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSavingTemplate(true);
    await fetch("/api/crm/document-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, body: newBody }),
    });
    setNewTitle("");
    setNewBody("");
    setSavingTemplate(false);
    setShowNewTemplate(false);
    loadTemplates();
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
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
            >
              <div>
                <p className="text-sm font-medium">{d.title}</p>
                <p className="text-xs text-neutral-400">{new Date(d.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <a
                href={`/api/crm/clients/${clientId}/documents/${d.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Abrir PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
