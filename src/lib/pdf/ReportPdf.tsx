import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { getPerformanceReport } from "@/lib/reports/performance";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#555", marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", color: "#333" },
  cardsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  card: { flex: 1, border: "1px solid #ddd", borderRadius: 4, padding: 10 },
  cardLabel: { fontSize: 8, color: "#666", marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: 700 },
  cardChange: { fontSize: 8, marginTop: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottom: "1px solid #eee" },
  tableRowHeader: { flexDirection: "row", borderBottom: "1px solid #333", paddingBottom: 4, marginBottom: 4, fontWeight: 700 },
  col: { width: "33%" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999" },
});

function changeLabel(pct: number | null): string {
  if (pct === null) return "novo";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs. período anterior`;
}

type Report = Awaited<ReturnType<typeof getPerformanceReport>>;

export function ReportPdf({ report, generatedAt }: { report: Report; generatedAt: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de Performance</Text>
        <Text style={styles.muted}>
          Período: {report.currentLabel} (comparado a {report.previousLabel}) — gerado em {generatedAt}
        </Text>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NOVOS CLIENTES</Text>
            <Text style={styles.cardValue}>{report.newClients.current}</Text>
            <Text style={styles.cardChange}>{changeLabel(report.newClients.changePct)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TAXA DE CONVERSÃO DO FUNIL</Text>
            <Text style={styles.cardValue}>{report.conversionRate.current}%</Text>
            <Text style={styles.cardChange}>{changeLabel(report.conversionRate.changePct)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faturamento total</Text>
          {report.revenue.length === 0 ? (
            <Text>Nenhuma fatura emitida no período.</Text>
          ) : (
            <View>
              <View style={styles.tableRowHeader}>
                <Text style={styles.col}>Moeda</Text>
                <Text style={styles.col}>Valor no período</Text>
                <Text style={styles.col}>Variação</Text>
              </View>
              {report.revenue.map((r) => (
                <View style={styles.tableRow} key={r.currency}>
                  <Text style={styles.col}>{r.currency}</Text>
                  <Text style={styles.col}>{r.current.toFixed(2)}</Text>
                  <Text style={styles.col}>{changeLabel(r.changePct)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faturamento por área jurídica</Text>
          {report.revenueByArea.length === 0 ? (
            <Text>Nenhuma fatura vinculada a cliente/área no período.</Text>
          ) : (
            <View>
              <View style={styles.tableRowHeader}>
                <Text style={styles.col}>Área</Text>
                <Text style={styles.col}>Moeda</Text>
                <Text style={styles.col}>Valor</Text>
              </View>
              {report.revenueByArea.map((r, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.col}>{r.area}</Text>
                  <Text style={styles.col}>{r.currency}</Text>
                  <Text style={styles.col}>{r.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.footer}>Relatório gerado pelo Internacional Hub — para uso em reunião de sócios.</Text>
      </Page>
    </Document>
  );
}
