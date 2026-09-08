"use client";

import { useEffect, useState } from "react";
import { LEGAL_AREAS, formatDocument, onlyDigits } from "@/lib/data/crm";
import type { CrmClient } from "./types";

type Props = {
  client: CrmClient | null;
  onClose: () => void;
  onSaved: () => void;
};

type WhatsappMessage = {
  id: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
};

export function ClientFormModal({ client, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [documentType, setDocumentType] = useState(client?.documentType ?? "CPF");
  const [documentNumber, setDocumentNumber] = useState(
    client ? formatDocument(client.documentType, client.documentNumber) : ""
  );
  const [legalArea, setLegalArea] = useState(client?.legalArea ?? LEGAL_AREAS[0]);
  const [linkedToCompany, setLinkedToCompany] = useState(!!client?.companyName);
  const [companyName, setCompanyName] = useState(client?.companyName ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[] | null>(null);

  useEffect(() => {
    setDocumentNumber((prev) => formatDocument(documentType, prev));
  }, [documentType]);

  useEffect(() => {
    if (!client) return;
    fetch(`/api/crm/clients/${client.id}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []));
  }, [client]);

  const showCompanyField = documentType === "CNPJ" || linkedToCompany;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        fullName,
        documentType,
        documentNumber,
        legalArea,
        companyName: showCompanyField ? companyName : "",
        city,
        phone: onlyDigits(phone),
      };
      const res = await fetch(client ? `/api/crm/clients/${client.id}` : "/api/crm/clients", {
        method: client ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao salvar cliente");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {client ? "Editar cliente" : "Novo cliente"}
        </h3>

        <div>
          <label className="text-xs text-neutral-500">Nome completo</label>
          <input
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Tipo de documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            >
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500">Número do documento</label>
            <input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(formatDocument(documentType, e.target.value))}
              placeholder={documentType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500">Área jurídica</label>
          <select
            value={legalArea}
            onChange={(e) => setLegalArea(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          >
            {LEGAL_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {documentType === "CPF" && (
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={linkedToCompany}
              onChange={(e) => setLinkedToCompany(e.target.checked)}
            />
            Cliente pessoa física vinculado a uma empresa
          </label>
        )}

        {showCompanyField && (
          <div>
            <label className="text-xs text-neutral-500">Nome da empresa</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-500">Cidade</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">WhatsApp (com DDI/DDD)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5511999999999"
              className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
          </div>
        </div>

        {client && messages && messages.length > 0 && (
          <div>
            <label className="text-xs text-neutral-500">Histórico de mensagens (WhatsApp)</label>
            <div className="mt-1 max-h-56 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800 p-2 space-y-1.5 bg-neutral-50 dark:bg-neutral-950">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-2.5 py-1.5 text-xs ${
                      m.direction === "OUT"
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-0.5 ${m.direction === "OUT" ? "text-emerald-100" : "text-neutral-400"}`}>
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                      {m.direction === "OUT" && m.status === "QUEUED" && " · na fila"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
