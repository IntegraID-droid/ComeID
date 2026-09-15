// =============================================
// Portal Estudiantes - Service Worker
// =============================================

const CACHE = "portal-estudiantes-v3";

const ASSETS = [
    "./",
    "./index.html",
    "./registro.html",
    "./dashboard.html",
    "./perfil.html",
    "./comedor.html",
    "./biblioteca.html",
    "./qr.html",
    "./notificaciones.html",
    "./configuracion.html",
    "./css/global.css",
    "./css/login.css",
    "./js/firebase-config.js",
    "./js/auth.js",
    "./js/registro.js",
    "./js/common.js",
    "./js/dashboard.js",
    "./js/perfil.js",
    "./js/comedor.js",
    "./js/biblioteca.js",
    "./js/qr.js",
    "./js/notificaciones.js",
    "./js/configuracion.js",
    "./manifest.json",
    "./assets/logo.png",
    "./assets/icons/icon-180.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    // Navegación: network-first con respaldo a cache y a index.html sin conexión
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req).then(net => {
                const copia = net.clone();
                caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
                return net;
            }).catch(() => caches.match(req).then(resp => resp || caches.match("./index.html")))
        );
        return;
    }

    // Recursos locales y CDN: cache-first con actualización en segundo plano
    const esQrCDN = req.url.indexOf("cdn.jsdelivr.net/npm/qrcode-generator") !== -1;
    event.respondWith(
        caches.match(req).then(resp => {
            const red = fetch(req).then(net => {
                if (net && net.ok && (new URL(req.url).origin === self.location.origin || esQrCDN)) {
                    const copia = net.clone();
                    caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
                }
                return net;
            }).catch(() => resp);
            return resp || red;
        })
    );
});
