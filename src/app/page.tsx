import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

const TITLE = "HUB INTERNACIONAL — Tecnologia. Estratégia. Aquisição. Crescimento.";
const DESCRIPTION =
  "Um único ecossistema para conectar, desenvolver e acelerar empresas. Não criamos apenas ferramentas. Criamos ecossistemas.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://hubinternacional.com.br",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://hubinternacional.com.br",
    siteName: "HUB INTERNACIONAL",
    images: ["/logo.png"],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
  },
};

export default function HomePage() {
  return <Landing />;
}
