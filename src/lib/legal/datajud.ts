// Integração com a API pública do DataJud (CNJ) — consulta de andamentos
// processuais. Documentação: https://datajud-wiki.cnj.jus.br/api-publica/
// A chave é pública, fixa (sem cadastro) e pode ser trocada pelo CNJ a qualquer
// momento — ver DATAJUD_API_KEY no .env.

export const TRIBUNAL_OPTIONS = [
  { group: "Tribunais Superiores", value: "api_publica_tst", label: "TST - Tribunal Superior do Trabalho" },
  { group: "Tribunais Superiores", value: "api_publica_tse", label: "TSE - Tribunal Superior Eleitoral" },
  { group: "Tribunais Superiores", value: "api_publica_stj", label: "STJ - Superior Tribunal de Justiça" },
  { group: "Tribunais Superiores", value: "api_publica_stm", label: "STM - Superior Tribunal Militar" },

  { group: "Justiça Federal", value: "api_publica_trf1", label: "TRF1 - 1ª Região" },
  { group: "Justiça Federal", value: "api_publica_trf2", label: "TRF2 - 2ª Região" },
  { group: "Justiça Federal", value: "api_publica_trf3", label: "TRF3 - 3ª Região" },
  { group: "Justiça Federal", value: "api_publica_trf4", label: "TRF4 - 4ª Região" },
  { group: "Justiça Federal", value: "api_publica_trf5", label: "TRF5 - 5ª Região" },
  { group: "Justiça Federal", value: "api_publica_trf6", label: "TRF6 - 6ª Região" },

  { group: "Justiça Estadual", value: "api_publica_tjac", label: "TJAC - Acre" },
  { group: "Justiça Estadual", value: "api_publica_tjal", label: "TJAL - Alagoas" },
  { group: "Justiça Estadual", value: "api_publica_tjam", label: "TJAM - Amazonas" },
  { group: "Justiça Estadual", value: "api_publica_tjap", label: "TJAP - Amapá" },
  { group: "Justiça Estadual", value: "api_publica_tjba", label: "TJBA - Bahia" },
  { group: "Justiça Estadual", value: "api_publica_tjce", label: "TJCE - Ceará" },
  { group: "Justiça Estadual", value: "api_publica_tjdft", label: "TJDFT - Distrito Federal e Territórios" },
  { group: "Justiça Estadual", value: "api_publica_tjes", label: "TJES - Espírito Santo" },
  { group: "Justiça Estadual", value: "api_publica_tjgo", label: "TJGO - Goiás" },
  { group: "Justiça Estadual", value: "api_publica_tjma", label: "TJMA - Maranhão" },
  { group: "Justiça Estadual", value: "api_publica_tjmg", label: "TJMG - Minas Gerais" },
  { group: "Justiça Estadual", value: "api_publica_tjms", label: "TJMS - Mato Grosso do Sul" },
  { group: "Justiça Estadual", value: "api_publica_tjmt", label: "TJMT - Mato Grosso" },
  { group: "Justiça Estadual", value: "api_publica_tjpa", label: "TJPA - Pará" },
  { group: "Justiça Estadual", value: "api_publica_tjpb", label: "TJPB - Paraíba" },
  { group: "Justiça Estadual", value: "api_publica_tjpe", label: "TJPE - Pernambuco" },
  { group: "Justiça Estadual", value: "api_publica_tjpi", label: "TJPI - Piauí" },
  { group: "Justiça Estadual", value: "api_publica_tjpr", label: "TJPR - Paraná" },
  { group: "Justiça Estadual", value: "api_publica_tjrj", label: "TJRJ - Rio de Janeiro" },
  { group: "Justiça Estadual", value: "api_publica_tjrn", label: "TJRN - Rio Grande do Norte" },
  { group: "Justiça Estadual", value: "api_publica_tjro", label: "TJRO - Rondônia" },
  { group: "Justiça Estadual", value: "api_publica_tjrr", label: "TJRR - Roraima" },
  { group: "Justiça Estadual", value: "api_publica_tjrs", label: "TJRS - Rio Grande do Sul" },
  { group: "Justiça Estadual", value: "api_publica_tjsc", label: "TJSC - Santa Catarina" },
  { group: "Justiça Estadual", value: "api_publica_tjse", label: "TJSE - Sergipe" },
  { group: "Justiça Estadual", value: "api_publica_tjsp", label: "TJSP - São Paulo" },
  { group: "Justiça Estadual", value: "api_publica_tjto", label: "TJTO - Tocantins" },

  ...Array.from({ length: 24 }, (_, i) => ({
    group: "Justiça do Trabalho",
    value: `api_publica_trt${i + 1}`,
    label: `TRT${i + 1} - ${i + 1}ª Região`,
  })),

  ...[
    ["ac", "Acre"], ["al", "Alagoas"], ["am", "Amazonas"], ["ap", "Amapá"], ["ba", "Bahia"],
    ["ce", "Ceará"], ["dft", "Distrito Federal"], ["es", "Espírito Santo"], ["go", "Goiás"],
    ["ma", "Maranhão"], ["mg", "Minas Gerais"], ["ms", "Mato Grosso do Sul"], ["mt", "Mato Grosso"],
    ["pa", "Pará"], ["pb", "Paraíba"], ["pe", "Pernambuco"], ["pi", "Piauí"], ["pr", "Paraná"],
    ["rj", "Rio de Janeiro"], ["rn", "Rio Grande do Norte"], ["ro", "Rondônia"], ["rr", "Roraima"],
    ["rs", "Rio Grande do Sul"], ["sc", "Santa Catarina"], ["se", "Sergipe"], ["sp", "São Paulo"],
    ["to", "Tocantins"],
  ].map(([uf, name]) => ({
    group: "Justiça Eleitoral",
    value: `api_publica_tre-${uf}`,
    label: `TRE-${uf.toUpperCase()} - ${name}`,
  })),

  { group: "Justiça Militar", value: "api_publica_tjmmg", label: "TJM-MG - Minas Gerais" },
  { group: "Justiça Militar", value: "api_publica_tjmrs", label: "TJM-RS - Rio Grande do Sul" },
  { group: "Justiça Militar", value: "api_publica_tjmsp", label: "TJM-SP - São Paulo" },
] as const;

export type DataJudMovement = {
  codigo?: number;
  nome: string;
  dataHora: string;
};

export type DataJudResult = {
  found: boolean;
  movimentos: DataJudMovement[];
  raw?: unknown;
};

export async function queryDataJudProcess(tribunalAlias: string, caseNumber: string): Promise<DataJudResult> {
  const apiKey = process.env.DATAJUD_API_KEY;
  if (!apiKey) {
    throw new Error("DATAJUD_API_KEY não configurada no servidor.");
  }

  const numeroProcesso = caseNumber.replace(/\D/g, "");
  if (!numeroProcesso) {
    throw new Error("Número do processo (CNJ) inválido.");
  }

  const res = await fetch(`https://api-publica.datajud.cnj.jus.br/${tribunalAlias}/_search`, {
    method: "POST",
    headers: {
      Authorization: `APIKey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { match: { numeroProcesso } } }),
  });

  if (!res.ok) {
    throw new Error(`DataJud respondeu ${res.status}. Verifique o tribunal selecionado e o número do processo.`);
  }

  const data = await res.json();
  const hit = data?.hits?.hits?.[0];
  if (!hit) {
    return { found: false, movimentos: [] };
  }

  const movimentos: DataJudMovement[] = (hit._source?.movimentos ?? []).map((m: { codigo?: number; nome?: string; dataHora?: string }) => ({
    codigo: m.codigo,
    nome: m.nome ?? "Movimentação",
    dataHora: m.dataHora ?? new Date().toISOString(),
  }));

  return { found: true, movimentos, raw: hit._source };
}
