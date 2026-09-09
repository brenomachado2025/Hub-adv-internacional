export const WHATSAPP_NUMBER = "5512992100312";

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá! Quero conhecer o HUB INTERNACIONAL e entender como podemos conectar a tecnologia da minha empresa.";
