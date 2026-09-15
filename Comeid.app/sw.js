// ComeID Biblioteca - Service Worker (PWA)
const CACHE = "comeid-biblioteca-v28";
const APP_SHELL = [
    "./",
    "./index.html",
    "./selector.html",
    "./login.html",
    "./biblioteca.html",
    "./icon-biblioteca.svg",
    "./icon-192.png",
    "./icon-512.png",
    "./manifest.json",
    "./logo.png",
    "./js/gemini-config.js",
    "./js/biblioteca/globales.js",
    "./js/biblioteca/utilidades.js",
    "./js/biblioteca/traducciones.js",
    "./js/biblioteca/app.js",
    "./js/biblioteca/libros.js",
    "./js/biblioteca/estudiantes.js",
    "./js/biblioteca/prestamos.js",
    "./js/biblioteca/ia.js",
    "./js/biblioteca/mapa.js",
    "./js/biblioteca/qr.js",
    "./js/biblioteca/alertas.js",
    "./js/biblioteca/reportes.js",
    "./js/biblioteca/configuracion.js",
    "./js/biblioteca/actividad.js",
    "./js/biblioteca/notificaciones.js",
    "./js/biblioteca/reservas.js",
    "./js/biblioteca/ayuda.js",
    "./js/biblioteca/micuenta.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin === self.location.origin && !url.pathname.startsWith("/__/")) {
        event.respondWith(
            fetch(event.request).then(respuesta => {
                if (respuesta && respuesta.ok) {
                    const copia = respuesta.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, copia));
                }
                return respuesta;
            }).catch(() =>
                caches.match(event.request).then(cached => cached || caches.match("./biblioteca.html"))
            )
        );
    }
});
