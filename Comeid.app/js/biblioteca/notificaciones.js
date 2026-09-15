// =============================================
// ComeID Biblioteca - Notificaciones
// Colección "notificaciones": las escribe la app
// (reservas, vencimientos) y la herramienta Python
// (correos automáticos y avisos programados).
// =============================================

// Valores de "para" que corresponden al usuario actual:
// su uid, los avisos generales ("todos") y, si es estudiante,
// los ids de su registro en la colección "estudiantes" (la
// herramienta Python dirige ahí los avisos de vencimientos).
function misParasNotificacion() {
    const uid = usuarioActual && usuarioActual.uid;
    const paras = uid ? [uid, "todos"] : ["todos"];
    if (usuarioActual && String(usuarioActual.rol || "").toLowerCase() === "estudiante") {
        if (usuarioActual.estudiantesId) {
            paras.push(usuarioActual.estudiantesId);
        } else {
            const nombre = String(usuarioActual.nombre || "").trim().toLowerCase();
            if (nombre) {
                estudiantes.forEach(e => {
                    if (e.id && String(e.nombre || "").trim().toLowerCase() === nombre) paras.push(e.id);
                });
            }
        }
    }
    return paras;
}

// El usuario es dueño de sus notificaciones (campo "para" = su uid).
// Los gestores pueden ver todas. Las de "para" ausente o "todos"
// son visibles para todo el mundo (avisos generales).
function notificacionEsParaMi(n) {
    return misParasNotificacion().includes(n.para || "todos");
}

function cargarNotificaciones() {
    const gestion = puedeGestionar();
    const consulta = gestion
        ? db.collection("notificaciones").orderBy("fecha", "desc").limit(100)
        : db.collection("notificaciones").where("para", "in", misParasNotificacion()).limit(100);
    return consulta.get().then(qs => {
        notificaciones = [];
        qs.forEach(doc => notificaciones.push(Object.assign({ id: doc.id }, doc.data())));
        notificaciones.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
    }).catch(error => {
        console.warn("No se pudieron cargar las notificaciones:", error.message);
        notificaciones = [];
    });
}

// Crea una notificación en Firestore (para la app o herramientas).
// datos: { para, tipo, mensaje }
function crearNotificacion(datos) {
    return db.collection("notificaciones").add(Object.assign({
        para: (datos && datos.para) || "todos",
        tipo: (datos && datos.tipo) || "generico",
        mensaje: (datos && datos.mensaje) || "",
        fecha: new Date().toISOString().slice(0, 10),
        leida: false
    }, datos));
}

function notificacionesSinLeer() {
    return notificaciones.filter(n => notificacionEsParaMi(n) && !n.leida);
}

function actualizarBadgeNotificaciones() {
    const sinLeer = notificacionesSinLeer().length;
    ["notifBadge", "mobileNotifBadge"].forEach(id => {
        const badge = document.getElementById(id);
        if (badge) {
            badge.style.display = sinLeer > 0 ? "inline-flex" : "none";
            badge.textContent = sinLeer > 99 ? "99+" : String(sinLeer);
        }
    });
}

function notificacionTipoTexto(n) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const tipo = n.tipo || "generico";
    if (tipo === "vencimiento") return trad.notificacionVencimiento;
    if (tipo === "reserva") return trad.notificacionReserva;
    return trad.notificacionGenerica;
}

function mostrarNotificaciones() {
    activarVista("notificaciones");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const sinLeer = notificacionesSinLeer();
    const visibles = notificaciones.filter(notificacionEsParaMi);

    document.getElementById("contenido").innerHTML = `
        <div class="student-header">
            <h1 class="title">${trad.notificacionesTitle}</h1>
            ${sinLeer.length > 0 ? `<button class="add-btn" onclick="marcarTodasNotificacionesLeidas()"><i class="fas fa-check-double"></i> ${trad.notificacionesMarcarTodas}</button>` : ""}
        </div>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.notificacionesSubtitle}</p>
        <div class="student-container" style="margin-top: 16px;" id="notificacionesLista"></div>
    `;
    renderListaNotificaciones();
}

function renderListaNotificaciones() {
    const cont = document.getElementById("notificacionesLista");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const visibles = notificaciones.filter(notificacionEsParaMi);
    if (visibles.length === 0) {
        cont.innerHTML = `<div class="no-results">${trad.notificacionesSinRegistros}</div>`;
        return;
    }
    cont.innerHTML = visibles.map(n => `
        <div class="notif-item ${n.leida ? "notif-leida" : ""}" onclick="${n.leida ? "" : `marcarNotificacionLeida('${n.id}')`}">
            <i class="${n.tipo === "vencimiento" ? "fas fa-clock" : (n.tipo === "reserva" ? "fas fa-bookmark" : "fas fa-bell")}" style="color:${n.leida ? "var(--text-secondary)" : "var(--accent-color)"}; font-size:18px;"></i>
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                    <span class="notif-tipo">${notificacionTipoTexto(n)}</span>
                    <span style="color:var(--text-secondary); font-size:12px;">${fechaLegible(n.fecha)}</span>
                </div>
                <p style="margin-top:4px; font-size:14px; color:var(--text-primary);">${escaparHTML(n.mensaje || "")}</p>
            </div>
            ${n.leida ? "" : `<i class="fas fa-circle" style="color:var(--accent-color); font-size:8px; align-self:center;"></i>`}
        </div>
    `).join("");
}

function marcarNotificacionLeida(id) {
    db.collection("notificaciones").doc(id).update({ leida: true }).then(() => {
        const n = notificaciones.find(x => x.id === id);
        if (n) n.leida = true;
        actualizarBadgeNotificaciones();
        renderListaNotificaciones();
    }).catch(error => {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).notificacionError + ": " + error.message, "error");
    });
}

function marcarTodasNotificacionesLeidas() {
    const sinLeer = notificacionesSinLeer();
    if (sinLeer.length === 0) return;
    const batch = db.batch();
    sinLeer.forEach(n => batch.update(db.collection("notificaciones").doc(n.id), { leida: true }));
    batch.commit().then(() => {
        sinLeer.forEach(n => { n.leida = true; });
        actualizarBadgeNotificaciones();
        renderListaNotificaciones();
    }).catch(error => {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).notificacionError + ": " + error.message, "error");
    });
}

// =============================================
// NOTIFICACIONES LOCALES DEL NAVEGADOR
// (recordatorios de vencimientos al abrir la app)
// =============================================

function notifLocalSoportadas() {
    return typeof window !== "undefined" && typeof Notification !== "undefined";
}

function pedirPermisoNotificaciones() {
    if (!notifLocalSoportadas()) return;
    if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
    }
}

function recordarVencimientosLocales() {
    try {
        if (!notifLocalSoportadas() || Notification.permission !== "granted") return;
        const trad = traducciones[configuracion.idioma] || traducciones.Español;
        const activos = prestamos.filter(p => !p.devuelto);
        const atrasados = activos.filter(esPrestamoAtrasado);
        const proximos = activos.filter(p => getSemaforoVencimiento(p) === "proximo");
        if (atrasados.length === 0 && proximos.length === 0) return;
        const hoy = new Date().toISOString().slice(0, 10);
        const uid = (usuarioActual && usuarioActual.uid) || "anonimo";
        const clave = "notifLocal_" + hoy;
        let mostradas = {};
        try { mostradas = JSON.parse(localStorage.getItem(clave) || "{}"); } catch (e) {}
        if (mostradas[uid]) return;
        const partes = [];
        if (atrasados.length > 0) partes.push(atrasados.length + " " + trad.notifLocalAtrasados);
        if (proximos.length > 0) partes.push(proximos.length + " " + trad.notifLocalProximos);
        const notif = new Notification(trad.headerLogo, {
            body: partes.join(" · ")
        });
        notif.onclick = () => {
            window.focus();
            if (typeof mostrarAlertas === "function") mostrarAlertas();
        };
        mostradas[uid] = true;
        localStorage.setItem(clave, JSON.stringify(mostradas));
    } catch (e) {
        console.warn("No se pudo mostrar la notificación local:", e);
    }
}
