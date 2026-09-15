// =============================================
// ComeID Biblioteca - Mi cuenta (portal de usuario)
// Estudiantes y profesores ven sus préstamos, multas y
// pueden renovar. Los gestores pueden consultar a cualquiera.
// =============================================

// Identifica el registro (estudiante o profesor) del usuario actual
function personaActualCuenta() {
    if (!usuarioActual) return null;
    const rol = String(usuarioActual.rol || "").toLowerCase();
    if (rol === "estudiante") {
        const id = usuarioActual.estudiantesId;
        if (id) {
            const e = estudiantes.find(x => x.id === id);
            if (e) return { tipo: "Estudiante", id: e.id, nombre: e.nombre };
        }
        const nombre = String(usuarioActual.nombre || "").trim().toLowerCase();
        const e2 = estudiantes.find(x => x.id && String(x.nombre || "").trim().toLowerCase() === nombre);
        return e2 ? { tipo: "Estudiante", id: e2.id, nombre: e2.nombre } : null;
    }
    if (rol === "profesor") {
        const p = profesores.find(x => x.id === usuarioActual.uid);
        return p ? { tipo: "Profesor", id: p.id, nombre: p.nombre } : null;
    }
    return null;
}

// Un préstamo pertenece al usuario actual (por id o por nombre)
function esMiPrestamo(prestamo) {
    if (!usuarioActual || !prestamo) return false;
    const persona = personaActualCuenta();
    if (persona) {
        if (prestamo.prestamistaId && persona.id && prestamo.prestamistaId === persona.id) return true;
        if (prestamo.prestamistaNombre && String(prestamo.prestamistaNombre).trim().toLowerCase() === persona.nombre.trim().toLowerCase()) return true;
    }
    return false;
}

function prestamosDePersona(persona) {
    const nombre = String(persona.nombre || "").trim().toLowerCase();
    return prestamos.filter(p =>
        (persona.id && p.prestamistaId === persona.id) ||
        (nombre && String(p.prestamistaNombre || "").trim().toLowerCase() === nombre)
    );
}

function mostrarMiCuenta() {
    activarVista("micuenta");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const gestion = puedeGestionar();
    const miPersona = personaActualCuenta();
    const personas = [];
    if (gestion) {
        estudiantes.slice().sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).forEach(e =>
            personas.push({ tipo: "Estudiante", id: e.id, nombre: e.nombre })
        );
        profesores.slice().sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")).forEach(p =>
            personas.push({ tipo: "Profesor", id: p.id, nombre: p.nombre })
        );
    }

    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.miCuentaTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.miCuentaSubtitle}</p>
        ${gestion ? `
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:14px;">
            <select class="config-input" id="miCuentaPersona" style="max-width:320px; margin:0;">
                ${personas.map(p => `<option value="${p.tipo}|${p.id}">${escaparHTML(p.nombre)} (${p.tipo})</option>`).join("")}
            </select>
            <button class="add-btn" onclick="cargarCuentaSeleccionada()"><i class="fas fa-search"></i> ${trad.miCuentaBuscarBtn}</button>
        </div>
        ` : ""}
        <div id="miCuentaContenido" style="margin-top:16px;"></div>
    `;
    if (gestion && personas.length > 0) {
        cargarCuentaSeleccionada();
    } else if (!gestion && miPersona) {
        renderCuentaPersona(miPersona, document.getElementById("miCuentaContenido"));
    } else {
        const cont = document.getElementById("miCuentaContenido");
        cont.innerHTML = `<div class="no-results">${trad.miCuentaSinPrestamos}</div>`;
    }
}

function cargarCuentaSeleccionada() {
    const sel = document.getElementById("miCuentaPersona");
    const cont = document.getElementById("miCuentaContenido");
    if (!sel || !cont) return;
    const [tipo, id] = sel.value.split("|");
    const lista = tipo === "Profesor" ? profesores : estudiantes;
    const persona = lista.find(x => x.id === id);
    if (!persona) return;
    renderCuentaPersona({ tipo, id, nombre: persona.nombre }, cont);
}

function renderCuentaPersona(persona, cont) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const delUsuario = prestamosDePersona(persona);
    const activos = delUsuario.filter(p => !p.devuelto);
    const atrasados = activos.filter(esPrestamoAtrasado);
    const deudas = delUsuario.filter(p => p.devuelto && !p.multaPagada && multaFinal(p) > 0);
    const totalDeuda = deudas.reduce((s, p) => s + multaFinal(p), 0);

    cont.innerHTML = `
        <div class="student-header">
            <h1 class="title" style="font-size:20px;">${escaparHTML(persona.nombre)} <span style="color:var(--text-secondary); font-size:13px; font-weight:400;">(${persona.tipo})</span></h1>
        </div>
        <div class="cards">
            <div class="card"><h3>${trad.miCuentaPrestamosActivos}</h3><span>${activos.length}</span></div>
            <div class="card"><h3>${trad.miCuentaAtrasados}</h3><span>${atrasados.length}</span></div>
            <div class="card"><h3>${trad.miCuentaDeudaPendiente}</h3><span>${totalDeuda > 0 ? "₡" + totalDeuda.toLocaleString() : "₡0"}</span></div>
        </div>
        <h2 style="color: var(--accent-color); font-size:18px; margin:20px 0 10px;">${trad.miCuentaPrestamosActivos}</h2>
        <div class="student-container">${renderTablaMiCuenta(activos, trad)}</div>
        <h2 style="color: #fbbf24; font-size:18px; margin:24px 0 10px;">${trad.miCuentaMultas}</h2>
        <div class="student-container">${renderTablaDeudas(deudas, trad)}</div>
    `;
}

function renderTablaMiCuenta(lista, trad) {
    if (lista.length === 0) return `<div class="no-results">${trad.miCuentaSinPrestamos}</div>`;
    const hoy = new Date();
    const filas = lista.map(p => {
        const atrasado = esPrestamoAtrasado(p);
        const textoDias = atrasado
            ? `<span style="color:#ef5350; font-weight:600;">${diasAtraso(p)} ${trad.diasAtraso}</span>`
            : `${Math.max(0, Math.ceil((new Date(p.fechaVencimiento + "T23:59:59") - hoy) / 86400000))} ${trad.diasRestantes}`;
        const multa = formatearMulta(p);
        const btnRenovar = `<button class="table-btn edit-btn" onclick="renovarPrestamo('${p.id}')" title="${trad.renovar}"><i class="fas fa-sync-alt"></i></button>`;
        return `<tr>
            <td>${escaparHTML(p.libroTitulo)}</td>
            <td>${fechaLegible(p.fechaPrestamo)}</td>
            <td>${fechaLegible(p.fechaVencimiento)}</td>
            <td>${formatearSemaforo(p)}</td>
            <td>${textoDias}</td>
            <td>${multa}</td>
            <td>${btnRenovar}</td>
        </tr>`;
    }).join("");
    return `<table class="student-table">
        <thead><tr>
            <th>${trad.prestamoColLibro}</th>
            <th>${trad.prestamoColFecha}</th>
            <th>${trad.prestamoColVence}</th>
            <th>${trad.prestamoColEstado}</th>
            <th>${trad.prestamoColDiasRest}</th>
            <th>${trad.prestamoColMulta}</th>
            <th>${trad.prestamoColAcciones}</th>
        </tr></thead>
        <tbody>${filas}</tbody>
    </table>`;
}

function renderTablaDeudas(lista, trad) {
    if (lista.length === 0) return `<div class="no-results">${trad.miCuentaSinDeudas}</div>`;
    const filas = lista.map(p => `<tr>
        <td>${escaparHTML(p.libroTitulo)}</td>
        <td>${fechaLegible(p.fechaDevolucion)}</td>
        <td>${formatearMulta(p)}</td>
    </tr>`).join("");
    return `<table class="student-table">
        <thead><tr>
            <th>${trad.prestamoColLibro}</th>
            <th>${trad.historialColDevolucion}</th>
            <th>${trad.prestamoColMulta}</th>
        </tr></thead>
        <tbody>${filas}</tbody>
    </table>`;
}

// Renueva un préstamo activo (extiende el vencimiento)
function renovarPrestamo(id) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const p = prestamos.find(x => x.id === id);
    if (!p || p.devuelto) return;
    if (!puedeGestionar() && !esMiPrestamo(p)) {
        mostrarNotificacion(trad.permisoDenegado, "error");
        return;
    }
    const diasExt = Number(p.dias) || 7;
    const venc = new Date(p.fechaVencimiento + "T12:00:00");
    venc.setDate(venc.getDate() + diasExt);
    const nuevaVenc = venc.toISOString().slice(0, 10);
    mostrarLoading();
    db.collection("prestamos").doc(id).update({ fechaVencimiento: nuevaVenc }).then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.prestamoRenovado, "ok");
        registrarActividad("renovar_prestamo", `${p.libroTitulo} — ${p.prestamistaNombre} → ${fechaLegible(nuevaVenc)}`);
        return cargarPrestamos();
    }).then(() => {
        if (vistaActual === "micuenta") mostrarMiCuenta();
        else if (vistaActual === "prestamos") mostrarPrestamos();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}
