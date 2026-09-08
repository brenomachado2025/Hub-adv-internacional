import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#555", fontSize: 9, marginBottom: 20 },
  body: { whiteSpace: "pre-wrap" },
  footer: { position: "absolute", bottom: 30, left: 48, right: 48, fontSize: 8, color: "#999" },
});

export function CrmDocumentPdf({ title, content, createdAt }: { title: string; content: string; createdAt: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.muted}>Gerado em {createdAt}</Text>
        {content.split("\n").map((line, i) => (
          <Text key={i} style={styles.body}>
            {line || " "}
          </Text>
        ))}
        <Text style={styles.footer}>Documento gerado pelo Internacional Hub.</Text>
      </Page>
    </Document>
  );
}
