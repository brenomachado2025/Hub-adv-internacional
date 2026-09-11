// Service worker mínimo: só existe para satisfazer o critério de instalabilidade
// (ícone "Adicionar à tela inicial" no Android/Chrome) e cachear os assets
// estáticos do app (ícones, logo). Não cacheia páginas nem respostas de API -
// os dados do hub (clientes, processos, sanções etc.) sempre vêm da rede.
const CACHE_NAME = "hub-static-v1";
const STATIC_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png", "/logo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset = STATIC_ASSETS.some((path) => url.pathname === path);
  if (!isStaticAsset) return; // deixa passar direto pra rede - páginas e API nunca são cacheadas

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
