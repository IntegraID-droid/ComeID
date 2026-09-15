// =============================================
// ComeID Biblioteca - Utilidades compartidas
// =============================================

function mostrarLoading() {
    const el = document.getElementById("loading");
    if (el) el.classList.add("show");
}

function ocultarLoading() {
    const el = document.getElementById("loading");
    if (el) el.classList.remove("show");
}

function mostrarNotificacion(mensaje, tipo) {
    const el = document.getElementById("notification");
    if (!el) return;
    el.textContent = mensaje;
    el.style.display = "block";
    el.style.background = tipo === "error" ? "#dc3545" : "#28a745";
    setTimeout(() => { el.style.display = "none"; }, 5000);
}

function activarVista(vista) {
    vistaActual = vista;
    document.querySelectorAll(".menu button[data-vista]").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-vista") === vista);
    });
}

function cerrarSesion() {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    }).catch(error => {
        mostrarNotificacion("Error: " + error.message, "error");
    });
}

function cambiarSistema() {
    window.location.href = "selector.html";

}

// =============================================
// CARGA DIFERIDA DE LIBRERÍAS PESADAS (red lenta)
// =============================================
const URL_XLSX = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
const URL_JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const URL_JSPDF_AUTOTABLE = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js";
const URL_CHART = "https://cdn.jsdelivr.net/npm/chart.js";
const URL_ZXING = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
const _scriptsPromise = {};

function cargarScript(url) {
    if (_scriptsPromise[url]) return _scriptsPromise[url];
    if (document.querySelector(`script[data-cargado="${url}"]`)) {
        _scriptsPromise[url] = Promise.resolve();
        return _scriptsPromise[url];
    }
    _scriptsPromise[url] = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = url;
        s.dataset.cargado = url;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => {
            delete _scriptsPromise[url];
            reject(new Error("No se pudo cargar la librería necesaria. Verifica tu conexión."));
        };
        document.head.appendChild(s);
    });
    return _scriptsPromise[url];
}

function toggleSidebar() {
    const el = document.getElementById("sidebar");
    if (el) el.classList.toggle("show-mobile");
}

function toggleMobileMenu() {
    const el = document.getElementById("mobileMenu");
    if (el) el.classList.toggle("show");
}

function closeMobileMenu() {
    const el = document.getElementById("mobileMenu");
    if (el) el.classList.remove("show");
}

function toggleUserProfile() {
    const el = document.getElementById("userProfileDropdown");
    if (el) el.classList.toggle("show");
}

window.addEventListener("click", function(event) {
    const dd = document.getElementById("userProfileDropdown");
    if (dd && dd.classList.contains("show") && !event.target.closest("#userProfile")) {
        dd.classList.remove("show");
    }
});

function fechaISOOffset(dias) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function localeParaIdioma() {
    switch (configuracion.idioma) {
        case "Español": return "es-CR";
        case "Português": return "pt-BR";
        case "Français": return "fr-FR";
        case "Deutsch": return "de-DE";
        default: return "en-US";
    }
}

function escaparHTML(texto) {
    return String(texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fechaLegible(fechaISO) {
    if (!fechaISO) return "—";
    return new Date(fechaISO + "T12:00:00").toLocaleDateString(localeParaIdioma(), { year: "numeric", month: "short", day: "numeric" });
}

function actualizarEstadoConexion() {
    const banner = document.getElementById("offlineBanner");
    if (!banner) return;
    if (navigator.onLine) {
        banner.style.display = "none";
    } else {
        banner.style.display = "block";
        banner.innerHTML = '<i class="fas fa-wifi"></i> <span>' +
            (traducciones[configuracion.idioma].modoSinConexion || "Modo sin conexión") +
            '</span>';
    }
}
window.addEventListener("online", actualizarEstadoConexion);
window.addEventListener("offline", actualizarEstadoConexion);

// Solo admin/bibliotecario/profesor pueden gestionar libros y préstamos
function puedeGestionar() {
    const rol = (usuarioActual && usuarioActual.rol || "").toLowerCase();
    return rol === "admin" || rol === "profesor" || rol === "bibliotecario";
}
