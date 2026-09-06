"use client";

import { useMemo, useState } from "react";
import { LEGAL_AREAS, onlyDigits } from "@/lib/data/crm";

type Props = {
  onClose: () => void;
  onImported: () => void;
};

type FieldKey = "fullName" | "documentType" | "documentNumber" | "legalArea" | "companyName" | "city";

const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "fullName", label: "Nome completo", required: true },
  { key: "documentType", label: "Tipo de documento (CPF/CNPJ)" },
  { key: "documentNumber", label: "Número do documento" },
  { key: "legalArea", label: "Área jurídica" },
  { key: "companyName", label: "Nome da empresa" },
  { key: "city", label: "Cidade" },
];

const SYNONYMS: Record<FieldKey, string[]> = {
  fullName: ["nome completo", "nome", "cliente", "name", "full name"],
  documentType: ["tipo de documento", "tipo documento", "tipo", "document type"],
  documentNumber: ["cpf/cnpj", "cpf", "cnpj", "documento", "numero do documento", "document number", "número do documento"],
  legalArea: ["area juridica", "área jurídica", "area", "área", "practice area"],
  companyName: ["empresa", "nome da empresa", "company", "company name"],
  city: ["cidade", "city"],
};

function guessMapping(headers: string[]): Record<FieldKey, number | null> {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const mapping = {} as Record<FieldKey, number | null>;
  for (const field of FIELDS) {
    const synonyms = SYNONYMS[field.key];
    const idx = normalized.findIndex((h) => synonyms.some((s) => h === s || h.includes(s)));
    mapping[field.key] = idx >= 0 ? idx : null;
  }
  return mapping;
}

export function ImportModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<"upload" | "mapping" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, number | null>>({
    fullName: null,
    documentType: null,
    documentNumber: null,
    legalArea: null,
    companyName: null,
    city: null,
  });
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/crm/clients/import/parse", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao ler arquivo");
      }
      const data = await res.json();
      setHeaders(data.headers);
      setRows(data.rows);
      setMapping(guessMapping(data.headers));
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const mappedRows = useMemo(() => {
    return rows.map((row) => {
      const get = (field: FieldKey) => {
        const idx = mapping[field];
        return idx !== null && idx !== undefined ? (row[idx] ?? "") : "";
      };
      const rawDocType = get("documentType").toUpperCase();
      const docNumberDigits = onlyDigits(get("documentNumber"));
      const documentType = rawDocType.includes("CNPJ")
        ? "CNPJ"
        : rawDocType.includes("CPF")
          ? "CPF"
          : docNumberDigits.length > 11
            ? "CNPJ"
            : "CPF";

      return {
        fullName: get("fullName").trim(),
        documentType,
        documentNumber: docNumberDigits,
        legalArea: LEGAL_AREAS.includes(get("legalArea") as (typeof LEGAL_AREAS)[number])
          ? get("legalArea")
          : "Outro",
        companyName: get("companyName").trim(),
        city: get("city").trim(),
      };
    });
  }, [rows, mapping]);

  const confirmImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mappedRows }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao importar");
      }
      const data = await res.json();
      setResult(data);
      setStep("result");
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Importar clientes</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>

        {step === "upload" && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">
              Envie uma planilha CSV ou Excel (.xlsx/.xls). Na próxima etapa você confirma o mapeamento das
              colunas.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="text-sm"
            />
            {loading && <p className="text-sm text-neutral-500">Lendo arquivo...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">
              {rows.length} linha(s) encontrada(s). Confirme qual coluna da planilha corresponde a cada campo.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-neutral-500">
                    {field.label}
                    {field.required && " *"}
                  </label>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [field.key]: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  >
                    <option value="">— não mapear —</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>
                        {h || `Coluna ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-xs text-neutral-500 mb-2">Pré-visualização (primeiras linhas)</h4>
              <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                      <th className="py-1 px-2">Nome</th>
                      <th className="py-1 px-2">Documento</th>
                      <th className="py-1 px-2">Área</th>
                      <th className="py-1 px-2">Empresa</th>
                      <th className="py-1 px-2">Cidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedRows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-b border-neutral-100 dark:border-neutral-900">
                        <td className="py-1 px-2">{r.fullName || "-"}</td>
                        <td className="py-1 px-2">
                          {r.documentType}: {r.documentNumber || "-"}
                        </td>
                        <td className="py-1 px-2">{r.legalArea}</td>
                        <td className="py-1 px-2">{r.companyName || "-"}</td>
                        <td className="py-1 px-2">{r.city || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStep("upload")}
                className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
              >
                Voltar
              </button>
              <button
                onClick={confirmImport}
                disabled={loading || mapping.fullName === null}
                className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Importando..." : `Importar ${rows.length} cliente(s)`}
              </button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-3">
            <p className="text-sm">
              <strong className="text-emerald-700">{result.imported}</strong> cliente(s) importado(s) com
              sucesso.
              {result.skipped > 0 && (
                <>
                  {" "}
                  <strong className="text-amber-700">{result.skipped}</strong> linha(s) ignorada(s).
                </>
              )}
            </p>
            {result.errors.length > 0 && (
              <ul className="text-xs text-neutral-500 list-disc pl-4 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
