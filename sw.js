// Uwe-Dashboard – Offline-Cache für die Weboberfläche selbst (Phase 1: offline-fähige Oberfläche).
// Zählt NICHT die Dashboard-Daten – die bleiben in localStorage bzw. später im Sync-Mechanismus.
const CACHE_NAME = "uwe-dashboard-shell-v5"; // bei jeder fertiggestellten Version hochzählen

const ASSETS = [
  "./fitness-dashboard.html",
  "./manifest.json",
  "./dashboard-assets/icon-192.png",
  "./dashboard-assets/icon-512.png",
  "./dashboard-assets/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // {cache:"reload"} umgeht den HTTP-Cache des Browsers (GitHub Pages liefert
      // Cache-Control: max-age=600 – ohne das hier würde teils veraltet gecacht).
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first, im Hintergrund aktualisieren: Seite lädt sofort (auch offline),
// eine neuere Version steht nach einem erneuten Laden zur Verfügung.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
