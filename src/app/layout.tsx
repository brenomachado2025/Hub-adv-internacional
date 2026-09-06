import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Hub ADV Internacional | Sanções Internacionais",
  description: "Monitoramento de sanções (ONU/OFAC/UE), auditoria, honorários multi-moeda, faturamento e agendamento multi-fuso.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
