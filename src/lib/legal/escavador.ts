import { TRIBUNAL_OPTIONS } from "./datajud";

// Escavador Business API - busca processos por CPF/CNPJ (o DataJud público não
// permite esse tipo de busca, só por número exato do processo). Serviço pago,
// self-service: https://api.escavador.com/tokens
// Docs: https://api.escavador.com/docs/
const BASE = "https://api.escavador.com/api/v2/processos/envolvido";

export type EscavadorProcesso = {
  numeroCnj: string;
  tribunalNome: string;
  tribunalSigla: string;
  tribunalAlias: string; // já mapeado para o valor usado em TRIBUNAL_OPTIONS, ou "" se não reconhecido
  ultimaMovimentacaoData: string;
  partes: string[];
};

function mapTribunalAlias(sigla: string): string {
  const normalized = sigla.trim().toLowerCase();
  const match = TRIBUNAL_OPTIONS.find((t) => t.value === `api_publica_${normalized}`);
  return match?.value ?? "";
}

export async function searchProcessesByDocument(documentNumber: string): Promise<EscavadorProcesso[]> {
  const token = process.env.ESCAVADOR_API_KEY;
  if (!token) {
    throw new Error("ESCAVADOR_API_KEY não configurada no servidor.");
  }

  const digits = documentNumber.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Este cliente não tem CPF/CNPJ cadastrado.");
  }

  const results: Record<string, unknown>[] = [];
  let page = 1;

  // Limita a 3 páginas (até ~75 processos) por consulta - cada página é cobrada,
  // e devolver tudo de uma pessoa com centenas de processos não ajuda o advogado.
  while (page <= 3) {
    const url = `${BASE}?nome_ou_cpf_cnpj=${encodeURIComponent(digits)}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Escavador: falha na consulta (${res.status})`);
    }
    const data = await res.json();
    const items: Record<string, unknown>[] = data?.items ?? [];
    results.push(...items);

    const totalPages = data?.meta?.total_pages ?? 1;
    if (page >= totalPages) break;
    page++;
  }

  return results.map((item): EscavadorProcesso => {
    const tribunal = (item.tribunal as Record<string, unknown>) ?? {};
    const sigla = String(tribunal.sigla ?? "");
    const ultimaMov = (item.ultima_movimentacao as Record<string, unknown>) ?? {};
    const partes = Array.isArray(item.partes)
      ? (item.partes as Record<string, unknown>[]).map((p) => String(p.nome ?? "")).filter(Boolean)
      : [];

    return {
      numeroCnj: String(item.numero_cnj ?? ""),
      tribunalNome: String(tribunal.nome ?? sigla),
      tribunalSigla: sigla,
      tribunalAlias: mapTribunalAlias(sigla),
      ultimaMovimentacaoData: String(ultimaMov.data ?? ""),
      partes,
    };
  });
}
