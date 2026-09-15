// =============================================
// ComeID Biblioteca - Reservas y lista de espera
// Estados: espera → disponible → entregada | cancelada
// Al devolver un libro, la cola de reservas del título
// avanza automáticamente y se notifica al siguiente.
// =============================================

function cargarReservas() {
    const gestion = puedeGestionar();
    const consulta = gestion
        ? db.collection("reservas").orderBy("fecha", "asc").limit(200)
        : db.collection("reservas").where("usuarioId", "==", (usuarioActual && usuarioActual.uid) || "_");
    return consulta.get().then(qs => {
        reservas = [];
        qs.forEach(doc => reservas.push(Object.assign({ id: doc.id }, doc.data())));
    }).catch(error => {
        console.warn("No se pudieron cargar las reservas:", error.message);
        reservas = [];
    });
}

function reservasActivasDe(libroId) {
    return reservas.filter(r => r.libroId === libroId && (r.estado === "espera" || r.estado === "disponible"));
}

function reservaActivaUsuario(libroId) {
    const uid = usuarioActual && usuarioActual.uid;
    if (!uid) return false;
    return reservas.some(r => r.libroId === libroId && r.usuarioId === uid && (r.estado === "espera" || r.estado === "disponible"));
}

// Reserva el libro. Si hay ejemplares disponibles queda listo para
// recoger (disponible); si no, pasa a la lista de espera.
function reservarLibro(libroId) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    if (!usuarioActual || !usuarioActual.uid) {
        mostrarNotificacion(trad.notificacionSinPermiso, "error");
        return;
    }
    const libro = libros.find(l => l.id === libroId);
    if (!libro) return;
    if (reservaActivaUsuario(libroId)) {
        mostrarNotificacion(trad.reservasYaReservado, "error");
        return;
    }
    const info = librosDisponibles().find(l => l.id === libroId);
    const hayDisponible = info && info.disponibles > 0 && libroEsPrestable(libro);

    mostrarLoading();
    db.collection("reservas").add({
        libroId: libro.id,
        libroTitulo: libro.titulo,
        usuarioId: usuarioActual.uid,
        usuarioNombre: usuarioActual.nombre || usuarioActual.correo || "Usuario",
        fecha: new Date().toISOString().slice(0, 10),
        estado: hayDisponible ? "disponible" : "espera"
    }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.reservasReservadoOk, "ok");
        registrarActividad("crear_reserva", `${libro.titulo} → ${usuarioActual.nombre || "Usuario"}`);
        return cargarReservas();
    }).then(() => {
        refrescarVistaReservas(libroId);
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

function cancelarReserva(id) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const reserva = reservas.find(r => r.id === id);
    if (!reserva) return;
    if (!confirm(trad.reservasCancelarConfirm)) return;
    mostrarLoading();
    db.collection("reservas").doc(id).update({
        estado: "cancelada",
        fechaCancelacion: new Date().toISOString().slice(0, 10)
    }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.reservasCanceladaOk, "ok");
        registrarActividad("cancelar_reserva", reserva.libroTitulo);
        return cargarReservas();
    }).then(() => {
        if (vistaActual === "reservas") mostrarReservas();
        else refrescarVistaReservas(reserva.libroId);
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

// El gestor entrega el libro reservado al usuario.
function entregarReserva(id) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const reserva = reservas.find(r => r.id === id);
    if (!reserva) return;
    if (!confirm(trad.reservasEntregarConfirm)) return;
    mostrarLoading();
    db.collection("reservas").doc(id).update({
        estado: "entregada",
        fechaEntrega: new Date().toISOString().slice(0, 10)
    }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.reservasEntregadaOk, "ok");
        registrarActividad("entregar_reserva", reserva.libroTitulo);
        return cargarReservas();
    }).then(() => {
        if (vistaActual === "reservas") mostrarReservas();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

// Al devolver un libro, avanza la cola: la primera reserva en espera
// pasa a "disponible" y se notifica al estudiante/profesor.
function procesarColaReservas(libroId) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const cola = reservas
        .filter(r => r.libroId === libroId && r.estado === "espera")
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    if (cola.length === 0) return Promise.resolve();
    const siguiente = cola[0];
    return db.collection("reservas").doc(siguiente.id).update({
        estado: "disponible",
        fechaDisponible: new Date().toISOString().slice(0, 10)
    }).then(() => {
        const mensaje = trad.reservaDisponibleNotifMensaje + " — " + (siguiente.libroTitulo || "");
        return crearNotificacion({
            para: siguiente.usuarioId,
            tipo: "reserva",
            mensaje: mensaje
        });
    }).then(() => {
        return cargarReservas();
    }).catch(error => {
        console.warn("No se pudo avanzar la cola de reservas:", error.message);
    });
}

function refrescarVistaReservas(libroId) {
    if (vistaActual === "reservas") {
        mostrarReservas();
        return;
    }
    const modal = document.getElementById("modalFichaLibro");
    if (modal && modal.classList.contains("show")) {
        mostrarFichaLibro(libroId);
    } else if (vistaActual === "catalogo") {
        renderTablaLibros();
    }
}

function formatearEstadoReserva(r) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const estados = {
        espera: { texto: trad.reservaEstadoEspera, color: "#fbbf24" },
        disponible: { texto: trad.reservaEstadoDisponible, color: "#10b981" },
        entregada: { texto: trad.reservaEstadoEntregada, color: "#2b67ff" },
        cancelada: { texto: trad.reservaEstadoCancelada, color: "#94a3b8" }
    };
    const e = estados[r.estado] || estados.espera;
    return `<span class="estado-semaforo" style="background:${e.color}22; color:${e.color}; border:1px solid ${e.color}66;">${e.texto}</span>`;
}

function puestoEnCola(r) {
    const cola = reservasActivasDe(r.libroId)
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const idx = cola.findIndex(x => x.id === r.id);
    return idx === -1 ? "—" : (idx + 1);
}

function renderTablaReservas(lista, trad) {
    const gestion = puedeGestionar();
    if (lista.length === 0) {
        return `<div class="no-results">${trad.reservasSinRegistros}</div>`;
    }
    const filas = lista.map(r => {
        const acciones = [];
        if (gestion && (r.estado === "espera" || r.estado === "disponible")) {
            acciones.push(`<button class="table-btn" style="color:#10b981;" onclick="entregarReserva('${r.id}')" title="${trad.reservasEntregar}"><i class="fas fa-check"></i></button>`);
        }
        if (r.estado === "espera" || r.estado === "disponible") {
            acciones.push(`<button class="table-btn delete-btn" onclick="cancelarReserva('${r.id}')" title="${trad.reservasCancelar}"><i class="fas fa-times"></i></button>`);
        }
        return `<tr>
            <td>${escaparHTML(r.libroTitulo)}</td>
            <td>${escaparHTML(r.usuarioNombre || "—")}</td>
            <td>${fechaLegible(r.fecha)}</td>
            <td>${puestoEnCola(r)}</td>
            <td>${formatearEstadoReserva(r)}</td>
            <td>${acciones.length ? acciones.join("") : "—"}</td>
        </tr>`;
    }).join("");
    return `<table class="student-table">
        <thead>
            <tr>
                <th>${trad.reservasColLibro}</th>
                <th>${trad.reservasColUsuario}</th>
                <th>${trad.reservasColFecha}</th>
                <th>${trad.reservasColPuesto}</th>
                <th>${trad.reservasColEstado}</th>
                <th>${trad.reservasColAcciones}</th>
            </tr>
        </thead>
        <tbody>${filas}</tbody>
    </table>`;
}

function mostrarReservas() {
    activarVista("reservas");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const gestion = puedeGestionar();
    let visibles = gestion ? reservas.slice() : reservas.filter(r => r.usuarioId === (usuarioActual && usuarioActual.uid));
    visibles.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const enCola = reservas.filter(r => r.estado === "espera" || r.estado === "disponible").length;

    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.reservasTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.reservasSubtitle}</p>
        <h2 style="color: #fbbf24; font-size: 18px; margin: 18px 0 10px;">${trad.reservasCola} (${enCola})</h2>
        <div class="student-container">${renderTablaReservas(visibles, trad)}</div>
    `;
}
