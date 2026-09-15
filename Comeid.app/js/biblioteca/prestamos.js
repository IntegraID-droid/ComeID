// =============================================
// ComeID Biblioteca - Préstamos, devoluciones e historial
// =============================================

function mostrarPrestamos() {
    activarVista("prestamos");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const activos = prestamos.filter(p => !p.devuelto);
    const atrasados = activos.filter(esPrestamoAtrasado);
    const gestion = puedeGestionar();

    document.getElementById("contenido").innerHTML = `
        <div class="student-header">
            <h1 class="title">${trad.prestamoTitle}</h1>
            ${gestion ? `<div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button class="add-btn" onclick="abrirFormPrestamo()"><i class="fas fa-plus"></i> ${trad.prestamoNuevo}</button>
                <button class="add-btn" style="background:#10b981;" onclick="abrirScanner('devolucion')"><i class="fas fa-qrcode"></i> ${trad.prestamoDevolverQR}</button>
            </div>` : ""}
        </div>
        <div style="margin-top: 18px;">
            <h2 style="color: var(--accent-color); font-size: 18px; margin-bottom: 10px;">${trad.prestamoActivos}</h2>
            <div class="student-container">${renderTablaPrestamos(activos, trad)}</div>
        </div>
        <div style="margin-top: 24px;">
            <h2 style="color: #fbbf24; font-size: 18px; margin-bottom: 10px;">${trad.prestamoAtrasados}</h2>
            <div class="student-container">${renderTablaPrestamos(atrasados, trad)}</div>
        </div>
    `;
}

function renderTablaPrestamos(lista, trad) {
    if (lista.length === 0) {
        return `<div class="no-results">${trad.prestamoSinRegistros}</div>`;
    }
    const gestion = puedeGestionar();
    const hoy = new Date();
    const filas = lista.map(p => {
        const atrasado = esPrestamoAtrasado(p);
        const textoDias = atrasado
            ? `<span style="color:#ef5350; font-weight:600;">${diasAtraso(p)} ${trad.diasAtraso}</span>`
            : `${Math.max(0, Math.ceil((new Date(p.fechaVencimiento + "T23:59:59") - hoy) / 86400000))} ${trad.diasRestantes}`;
        return `
            <tr>
                <td>${escaparHTML(p.libroTitulo)}</td>
                <td>${escaparHTML(p.prestamistaNombre)}</td>
                <td>${fechaLegible(p.fechaPrestamo)}</td>
                <td>${fechaLegible(p.fechaVencimiento)}</td>
                <td>${formatearSemaforo(p)}</td>
                <td>${textoDias}</td>
                <td>${formatearMulta(p)}</td>
                ${gestion ? `<td><button class="table-btn edit-btn" onclick="devolverPrestamo('${p.id}')" title="${trad.prestamoColAcciones}"><i class="fas fa-undo-alt"></i></button></td>` : ""}
            </tr>
        `;
    }).join("");
    return `<table class="student-table">
        <thead>
            <tr>
                <th>${trad.prestamoColLibro}</th>
                <th>${trad.prestamoColPrestamista}</th>
                <th>${trad.prestamoColFecha}</th>
                <th>${trad.prestamoColVence}</th>
                <th>${trad.prestamoColEstado}</th>
                <th>${trad.prestamoColDiasRest}</th>
                <th>${trad.prestamoColMulta}</th>
                ${gestion ? `<th>${trad.prestamoColAcciones}</th>` : ""}
            </tr>
        </thead>
        <tbody>${filas}</tbody>
    </table>`;
}

// =============================================
// FORMULARIO DE PRÉSTAMO
// =============================================

function abrirFormPrestamo() {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const disponibles = librosDisponibles().filter(l => l.disponibles > 0 && libroEsPrestable(l));
    if (disponibles.length === 0) {
        mostrarNotificacion(trad.prestamoSinDisponibles, "error");
        return;
    }
    const selectLibro = document.getElementById("prestamoLibro");
    selectLibro.innerHTML = disponibles.map(l =>
        `<option value="${l.id}">${escaparHTML(l.titulo)} (${l.disponibles})</option>`
    ).join("");
    document.getElementById("prestamoDias").value = 7;
    actualizarPrestamistas();
    document.getElementById("formPrestamo").classList.add("show");
}

function actualizarPrestamistas() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const tipo = document.getElementById("prestamoTipoPrestamista").value;
    const lista = tipo === "Profesor" ? profesores : estudiantes;
    const select = document.getElementById("prestamoPrestamista");
    if (lista.length === 0) {
        select.innerHTML = `<option value="">—</option>`;
        mostrarNotificacion(trad.prestamoSinPersonas, "error");
        return;
    }
    select.innerHTML = lista.map(p =>
        `<option value="${escaparHTML(p.id)}">${escaparHTML(p.nombre)}</option>`
    ).join("");
}

function cerrarFormPrestamo() {
    document.getElementById("formPrestamo").classList.remove("show");
}

function guardarPrestamo() {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const libroId = document.getElementById("prestamoLibro").value;
    const tipo = document.getElementById("prestamoTipoPrestamista").value;
    const prestamistaId = document.getElementById("prestamoPrestamista").value;
    const dias = Number(document.getElementById("prestamoDias").value) || 7;
    const libro = libros.find(l => l.id === libroId);
    const prestamista = (tipo === "Profesor" ? profesores : estudiantes).find(p => p.id === prestamistaId);
    if (!libro || !prestamista) {
        mostrarNotificacion(trad.notificacionCompleteCampos, "error");
        return;
    }
    if (!libroEsPrestable(libro)) {
        mostrarNotificacion(trad.prestamoLibroNoPrestable, "error");
        return;
    }
    const activosDeLibro = prestamos.filter(p => p.libroId === libroId && !p.devuelto).length;
    if (activosDeLibro >= (Number(libro.ejemplares) || 0)) {
        mostrarNotificacion(trad.prestamoSinDisponibles, "error");
        return;
    }

    // Sancion: no se presta a quien tenga préstamos atrasados o multas sin pagar
    const esMoroso = prestamos.some(p =>
        (p.prestamistaId === prestamistaId || p.prestamistaNombre === prestamista.nombre) &&
        ((!p.devuelto && esPrestamoAtrasado(p)) || (p.devuelto && !p.multaPagada && multaFinal(p) > 0))
    );
    if (esMoroso) {
        mostrarNotificacion(trad.prestamoBloqueadoMoroso, "error");
        return;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const vencimiento = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

    mostrarLoading();
    const disponiblesReserva = reservas
        .filter(r => r.libroId === libroId && r.estado === "disponible")
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    db.collection("prestamos").add({
        libroId,
        libroTitulo: libro.titulo,
        prestamistaId,
        prestamistaNombre: prestamista.nombre,
        tipoPrestamista: tipo,
        fechaPrestamo: hoy,
        dias,
        fechaVencimiento: vencimiento,
        devuelto: false,
        fechaDevolucion: null
    }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionPrestamoCreado, "ok");
        registrarActividad("crear_prestamo", `${libro.titulo} → ${prestamista.nombre}`);
        // Notifica al estudiante (si es estudiante) sobre su nuevo préstamo
        const paraQuien = tipo === "estudiante" && prestamistaId ? prestamistaId : null;
        if (paraQuien && typeof crearNotificacion === "function") {
            crearNotificacion({
                para: paraQuien,
                tipo: "vencimiento",
                titulo: "Nuevo préstamo",
                mensaje: `Te prestaron "${libro.titulo}". Debes devolverlo el ${fechaLegible(vencimiento)}.`
            }).catch(() => {});
        }
        cerrarFormPrestamo();
        const reservaEntrega = disponiblesReserva.length > 0
            ? db.collection("reservas").doc(disponiblesReserva[0].id).update({ estado: "entregada", fechaEntrega: hoy })
            : Promise.resolve();
        return reservaEntrega.then(() => cargarReservas());
    }).then(() => {
        return cargarPrestamos();
    }).then(() => {
        mostrarPrestamos();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

function devolverPrestamo(id) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const prestamo = prestamos.find(p => p.id === id);
    const multa = prestamo ? calcularMulta(prestamo) : 0;
    mostrarLoading();
    db.collection("prestamos").doc(id).update({
        devuelto: true,
        fechaDevolucion: new Date().toISOString().slice(0, 10),
        multa: multa,
        multaPagada: false,
        fechaPagoMulta: null
    }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionPrestamoDevuelto, "ok");
        if (prestamo) {
            registrarActividad("devolver_prestamo", `${prestamo.libroTitulo} — ${prestamo.prestamistaNombre}` + (multa > 0 ? ` (multa ₡${multa.toLocaleString()})` : ""));
        }
        return cargarPrestamos();
    }).then(() => {
        return prestamo ? procesarColaReservas(prestamo.libroId) : Promise.resolve();
    }).then(() => {
        actualizarBadgeNotificaciones();
        if (vistaActual === "prestamos") mostrarPrestamos();
        else if (vistaActual === "historial") mostrarHistorialPrestamos();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

// Marca la multa de un préstamo devuelto como cobrada (registro de cobros)
function cobrarMulta(id) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const prestamo = prestamos.find(p => p.id === id);
    const multa = prestamo ? multaFinal(prestamo) : 0;
    if (!prestamo || !prestamo.devuelto || multa <= 0 || prestamo.multaPagada) return;
    if (!confirm(`${trad.confirmaCobrarMulta} ₡${multa.toLocaleString()}`)) return;
    mostrarLoading();
    db.collection("prestamos").doc(id).update({
        multaPagada: true,
        fechaPagoMulta: new Date().toISOString().slice(0, 10)
    }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.multaCobrada + " ₡" + multa.toLocaleString(), "ok");
        registrarActividad("cobrar_multa", `${prestamo.libroTitulo} — ${prestamo.prestamistaNombre} (₡${multa.toLocaleString()})`);
        return cargarPrestamos();
    }).then(() => {
        if (vistaActual === "historial") mostrarHistorialPrestamos();
        else if (vistaActual === "prestamos") mostrarPrestamos();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

// =============================================
// HISTORIAL
// =============================================

function mostrarHistorialPrestamos() {
    activarVista("historial");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const filtros = [
        { valor: "todos", texto: trad.historialFiltroTodos },
        { valor: "activos", texto: trad.historialFiltroActivos },
        { valor: "atrasados", texto: trad.historialFiltroAtrasados },
        { valor: "devueltos", texto: trad.historialFiltroDevueltos }
    ];
    const opcionesLibros = libros.slice().sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.historialTitle}</h1>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 16px 0;">
            ${filtros.map(f => `
                <button onclick="cambiarFiltroHistorial('${f.valor}')"
                    style="padding: 8px 14px; border: 1px solid var(--border-color); border-radius: 20px; background: ${historialFiltro === f.valor ? "var(--accent-color)" : "var(--bg-tertiary)"}; color: ${historialFiltro === f.valor ? "#fff" : "var(--text-primary)"}; cursor: pointer; font-weight: 600;">
                    ${f.texto}
                </button>
            `).join("")}
            <select class="config-input" style="max-width: 260px; margin: 0;" onchange="cambiarFiltroLibroHistorial(this.value)">
                <option value="todos" ${historialFiltroLibro === "todos" ? "selected" : ""}>${trad.historialTodosLibros}</option>
                ${opcionesLibros.map(l => `<option value="${l.id}" ${historialFiltroLibro === l.id ? "selected" : ""}>${escaparHTML(l.titulo)}</option>`).join("")}
            </select>
        </div>
        <div class="student-container" id="historialTabla"></div>
    `;
    renderTablaHistorial();
}

function cambiarFiltroHistorial(filtro) {
    historialFiltro = filtro;
    renderTablaHistorial();
}

function cambiarFiltroLibroHistorial(libroId) {
    historialFiltroLibro = libroId;
    renderTablaHistorial();
}

function renderTablaHistorial() {
    const cont = document.getElementById("historialTabla");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    let lista = prestamos.slice();
    if (historialFiltroLibro !== "todos") lista = lista.filter(p => p.libroId === historialFiltroLibro);
    if (historialFiltro === "activos") lista = lista.filter(p => !p.devuelto);
    else if (historialFiltro === "atrasados") lista = lista.filter(p => esPrestamoAtrasado(p));
    else if (historialFiltro === "devueltos") lista = lista.filter(p => p.devuelto);
    lista.sort((a, b) => (b.fechaPrestamo || "").localeCompare(a.fechaPrestamo || ""));

    if (lista.length === 0) {
        cont.innerHTML = `<div class="no-results">${trad.historialSinRegistros}</div>`;
        return;
    }

    cont.innerHTML = `<table class="student-table">
        <thead>
            <tr>
                <th>${trad.historialColLibro}</th>
                <th>${trad.historialColPrestamista}</th>
                <th>${trad.historialColTipo}</th>
                <th>${trad.historialColPrestamo}</th>
                <th>${trad.historialColVence}</th>
                <th>${trad.historialColDevolucion}</th>
                <th>${trad.historialColEstado}</th>
                <th>${trad.prestamoColMulta}</th>
            </tr>
        </thead>
        <tbody>${lista.map(p => {
            let estado, color;
            if (p.devuelto) {
                estado = trad.historialEstadoDevuelto;
                color = "#28a745";
            } else if (esPrestamoAtrasado(p)) {
                estado = trad.historialEstadoAtrasado;
                color = "#ef5350";
            } else {
                estado = trad.historialEstadoPrestado;
                color = "#2b67ff";
            }
            return `<tr>
                <td>${escaparHTML(p.libroTitulo)}</td>
                <td>${escaparHTML(p.prestamistaNombre)}</td>
                <td>${escaparHTML(p.tipoPrestamista || "—")}</td>
                <td>${fechaLegible(p.fechaPrestamo)}</td>
                <td>${fechaLegible(p.fechaVencimiento)}</td>
                <td>${fechaLegible(p.fechaDevolucion)}</td>
                <td>${p.devuelto ? `<span style="color:${color}; font-weight:600;">${estado}</span>` : formatearSemaforo(p)}</td>
                <td>${formatearMulta(p)}</td>
            </tr>`;
        }).join("")}</tbody>
    </table>`;
}
