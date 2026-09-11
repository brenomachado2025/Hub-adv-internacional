// Formatação compartilhada, para evitar cada página inventar sua própria convenção
// de moeda/data (histórico: código antes do valor em uma tela, depois em outra).
export function formatCurrency(amount: number, currencyCode: string): string {
  const value = amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currencyCode} ${value}`;
}

export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "";
  // Datas "YYYY-MM-DD" puras (sem horário) são convertidas via new Date() como UTC
  // meia-noite - em fusos negativos (ex.: Brasil) isso pode exibir o dia anterior.
  // Formata direto das partes nesse caso, sem passar por conversão de fuso.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}
