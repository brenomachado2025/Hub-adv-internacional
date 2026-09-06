import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Invoice, InvoiceLineItem } from "@prisma/client";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#555" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  party: { width: "48%" },
  table: { display: "flex", width: "auto", marginTop: 8 },
  tableRowHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #333",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 700,
  },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottom: "1px solid #eee" },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colPrice: { width: "17%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  totalsBox: { marginTop: 16, alignSelf: "flex-end", width: "40%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTop: "1px solid #333",
    fontWeight: 700,
    fontSize: 12,
  },
  footer: { marginTop: 32, fontSize: 9, color: "#777" },
});

type InvoiceWithItems = Invoice & { items: InvoiceLineItem[] };

export function InvoiceDocument({ invoice }: { invoice: InvoiceWithItems }) {
  const subtotal = invoice.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>FATURA / INVOICE</Text>
            <Text style={styles.muted}>Nº {invoice.number}</Text>
          </View>
          <View>
            <Text>Data de emissão / Issue date: {invoice.issueDate}</Text>
            {invoice.dueDate ? <Text>Vencimento / Due date: {invoice.dueDate}</Text> : null}
            <Text>Moeda / Currency: {invoice.currency}</Text>
            {invoice.exchangeRate !== 1 ? (
              <Text style={styles.muted}>Taxa de câmbio de referência: {invoice.exchangeRate}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.party}>
            <Text style={styles.sectionTitle}>Emitente / Issuer</Text>
            <Text>{invoice.issuerName}</Text>
            {invoice.issuerTaxId ? <Text style={styles.muted}>ID fiscal: {invoice.issuerTaxId}</Text> : null}
            {invoice.issuerAddress ? <Text style={styles.muted}>{invoice.issuerAddress}</Text> : null}
          </View>
          <View style={styles.party}>
            <Text style={styles.sectionTitle}>Cliente / Bill to</Text>
            <Text>{invoice.clientName}</Text>
            {invoice.clientTaxId ? <Text style={styles.muted}>ID fiscal: {invoice.clientTaxId}</Text> : null}
            {invoice.clientAddress ? <Text style={styles.muted}>{invoice.clientAddress}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens / Line items</Text>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={styles.colDesc}>Descrição</Text>
              <Text style={styles.colQty}>Qtd.</Text>
              <Text style={styles.colPrice}>Preço unit.</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>
            {invoice.items.map((it) => (
              <View style={styles.tableRow} key={it.id}>
                <Text style={styles.colDesc}>{it.description}</Text>
                <Text style={styles.colQty}>{it.quantity}</Text>
                <Text style={styles.colPrice}>
                  {invoice.currency} {it.unitPrice.toFixed(2)}
                </Text>
                <Text style={styles.colTotal}>
                  {invoice.currency} {(it.quantity * it.unitPrice).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>
                {invoice.currency} {subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Imposto ({invoice.taxRate}%)</Text>
              <Text>
                {invoice.currency} {tax.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalsRowFinal}>
              <Text>Total</Text>
              <Text>
                {invoice.currency} {total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Documento gerado pelo Hub ADV Internacional — formato compatível com uso internacional (nº único, partes
          identificadas, itens discriminados, moeda e impostos explícitos).
        </Text>
      </Page>
    </Document>
  );
}
