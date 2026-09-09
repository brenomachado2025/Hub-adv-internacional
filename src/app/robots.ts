import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/login",
          "/signup",
          "/crm",
          "/processos",
          "/whatsapp",
          "/sancoes",
          "/notificacoes",
          "/auditoria",
          "/honorarios",
          "/faturas",
          "/relatorios",
          "/automacoes",
          "/reunioes",
          "/configuracoes",
          "/api",
        ],
      },
    ],
    sitemap: "https://hubinternacional.com.br/sitemap.xml",
  };
}
