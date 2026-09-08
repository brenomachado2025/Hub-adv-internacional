import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: "#555" },
  amount: { fontSize: 22, fontWeight: 700, marginVertical: 20 },
  footer: { marginTop: 40, fontSize: 9, color: "#999" },
});

export function ReceiptPdf({
  issuerName,
  clientName,
  amount,
  currency,
  description,
  paidAt,
  installmentNumber,
}: {
  issuerName: string;
  clientName: string;
  amount: number;
  currency: string;
  description: string;
  paidAt: string;
  installmentNumber: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>RECIBO DE PAGAMENTO</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Recebido de</Text>
          <Text>{clientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Referente a</Text>
          <Text>{description} — parcela {installmentNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Data do pagamento</Text>
          <Text>{paidAt}</Text>
        </View>

        <Text style={styles.amount}>
          {currency} {amount.toFixed(2)}
        </Text>

        <Text>{issuerName} declara ter recebido a quantia acima, dando plena e geral quitação.</Text>

        <Text style={styles.footer}>Recibo gerado pelo Internacional Hub.</Text>
      </Page>
    </Document>
  );
}
