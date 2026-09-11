"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/components/Toast";

type Props = {
  filters: { status: string; legalArea: string; city: string; q: string };
  audienceCount: number;
  onClose: () => void;
};

export function EmailBlastModal({ filters, audienceCount, onClose }: Props) {
  const showToast = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; failedCount: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Enviar este e-mail para até ${audienceCount} cliente(s)?`)) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, ...filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao enviar.");
        return;
      }
      setResult(data);
      showToast(`E-mail enviado: ${data.sentCount} de ${data.total}.`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold">E-mail em massa</h3>
          <button onClick={onClose} aria-label="Fechar" className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-500">
            Vai para os <strong>{audienceCount}</strong> cliente(s) com e-mail cadastrado que batem com os filtros
            aplicados na tela do CRM agora.
          </p>

          {result ? (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-4 text-sm">
              <p className="font-medium">Envio concluído</p>
              <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                {result.sentCount} enviado(s), {result.failedCount} falha(s) de {result.total} destinatário(s).
              </p>
              <button onClick={onClose} className="text-xs text-blue-600 mt-2 hover:underline">
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-neutral-500">Assunto</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex.: Novidades do seu processo"
                  className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500">Mensagem</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Escreva a mensagem..."
                  className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm">
                  Cancelar
                </button>
                <button
                  onClick={send}
                  disabled={sending || !subject.trim() || !body.trim() || audienceCount === 0}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
