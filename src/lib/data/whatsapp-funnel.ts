export type FunnelKey =
  | "WELCOME_MENU"
  | "MENU_INVALID"
  | "HANDOFF_ACOMPANHAR"
  | "HANDOFF_ADVOGADO"
  | "HANDOFF_ATTEMPTS"
  | "COLLECT_NAME"
  | "COLLECT_AREA"
  | "COLLECT_CITY"
  | "DONE";

export const FUNNEL_MESSAGE_FIELDS: { key: FunnelKey; label: string; help: string }[] = [
  {
    key: "WELCOME_MENU",
    label: "Boas-vindas + menu (primeira mensagem)",
    help: "Enviada assim que um número novo manda a primeira mensagem.",
  },
  {
    key: "MENU_INVALID",
    label: "Opção não reconhecida",
    help: "Enviada quando a resposta não bate com nenhuma opção do menu.",
  },
  {
    key: "HANDOFF_ACOMPANHAR",
    label: "Pediu para acompanhar processo (opção 2)",
    help: "",
  },
  { key: "HANDOFF_ADVOGADO", label: "Pediu para falar com advogado (opção 3)", help: "" },
  {
    key: "HANDOFF_ATTEMPTS",
    label: "Não entendeu após 2 tentativas",
    help: "",
  },
  { key: "COLLECT_NAME", label: "Pergunta o nome completo", help: "" },
  { key: "COLLECT_AREA", label: "Pergunta a área jurídica", help: "" },
  { key: "COLLECT_CITY", label: "Pergunta a cidade", help: "" },
  {
    key: "DONE",
    label: "Cadastro concluído",
    help: "Enviada ao final, quando o cliente já vira \"Cliente inicializado\" no funil.",
  },
];

export const DEFAULT_FUNNEL_MESSAGES: Record<FunnelKey, string> = {
  WELCOME_MENU:
    "Olá! 👋 Bem-vindo(a). Sou o assistente virtual e posso te ajudar a dar o primeiro passo. Escolha uma opção:\n\n" +
    "1 - Falar sobre um novo caso\n" +
    "2 - Acompanhar processo em andamento\n" +
    "3 - Falar com um advogado",
  MENU_INVALID:
    "Desculpe, não entendi. Responda com o número da opção:\n\n" +
    "1 - Falar sobre um novo caso\n" +
    "2 - Acompanhar processo em andamento\n" +
    "3 - Falar com um advogado",
  HANDOFF_ACOMPANHAR: "Certo! Vou avisar um de nossos advogados para te passar uma atualização. Só um momento. 🙏",
  HANDOFF_ADVOGADO: "Combinado! Um de nossos advogados vai te atender em breve por aqui.",
  HANDOFF_ATTEMPTS: "Vou te encaminhar para um de nossos advogados para não perder tempo. Só um momento. 🙏",
  COLLECT_NAME: "Perfeito! Para começar, qual é o seu nome completo?",
  COLLECT_AREA:
    "Qual a área jurídica do seu caso? (Ex.: Direito Internacional, Societário, Contratos, Tributário, Trabalhista, Outro)",
  COLLECT_CITY: "Em qual cidade você está?",
  DONE: "Obrigado! Já registramos seus dados. Um de nossos advogados vai analisar seu caso e entrar em contato em breve. 🙏",
};
