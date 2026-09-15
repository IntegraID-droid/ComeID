// =============================================
// ComeID Biblioteca - Alertas de atrasos y vencimientos
// =============================================

function mostrarAlertas() {
    activarVista("alertas");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const activos = prestamos.filter(p => !p.devuelto);
    const atrasados = activos.filter(esPrestamoAtrasado);
    const proximos = activos.filter(p => {
        if (esPrestamoAtrasado(p)) return false;
        const dias = diasParaVencimiento(p);
        return dias >= 0 && dias <= 3;
    });

    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.alertasTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.alertasSubtitle}</p>
        ${atrasados.length > 0 ? `
        <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="add-btn" style="padding: 10px 18px;" onclick="notificarTodosAtrasados()">
                <i class="fas fa-bell"></i> Notificar a ${atrasados.length} atrasado(s)
            </button>
        </div>` : ""}
        <div style="margin-top: 18px;">
            <h2 style="color: #ef5350; font-size: 18px; margin-bottom: 10px;">${trad.alertasAtrasados} (${atrasados.length})</h2>
            <div class="student-container">${renderTablaAlertas(atrasados, trad, true)}</div>
        </div>
        <div style="margin-top: 24px;">
            <h2 style="color: #fbbf24; font-size: 18px; margin-bottom: 10px;">${trad.alertasProximos} (${proximos.length})</h2>
            <div class="student-container">${renderTablaAlertas(proximos, trad, false)}</div>
        </div>
    `;
}

// Envía una notificación a cada estudiante con préstamos atrasados
function notificarTodosAtrasados() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const atrasados = prestamos.filter(p => !p.devuelto && esPrestamoAtrasado(p));
    if (atrasados.length === 0) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const porPersona = {};
    atrasados.forEach(p => {
        const clave = p.prestamistaId || p.prestamistaNombre;
        if (!clave) return;
        porPersona[clave] = porPersona[clave] || [];
        porPersona[clave].push(p);
    });
    const promesas = [];
    Object.keys(porPersona).forEach(clave => {
        const lista = porPersona[clave];
        const libros = lista.map(p => `"${p.libroTitulo}"`).join(", ");
        const dias = Math.abs(diasParaVencimiento(lista[0]));
        promesas.push(crearNotificacion({
            para: clave,
            tipo: "vencimiento",
            titulo: "Préstamo vencido",
            mensaje: `Tienes ${lista.length} préstamo(s) vencido(s) (${libros}). Por favor devuélvelos lo antes posible.`,
            fecha: hoy
        }));
    });
    Promise.all(promesas).then(() => {
        mostrarNotificacion((trad.alertasNotificados || "Notificaciones de atrasos enviadas."), "ok");
        return cargarNotificaciones();
    }).then(() => {
        actualizarBadgeNotificaciones();
    }).catch(() => {});
}

function diasParaVencimiento(prestamo) {
    if (!prestamo.fechaVencimiento) return 0;
    const vence = new Date(prestamo.fechaVencimiento + "T23:59:59");
    return Math.ceil((vence - new Date()) / 86400000);
}

function renderTablaAlertas(lista, trad, esAtrasado) {
    if (lista.length === 0) {
        const mensaje = esAtrasado ? trad.alertasSinAtrasados : trad.alertasSinProximos;
        return `<div class="no-results">${mensaje}</div>`;
    }
    const gestion = puedeGestionar();
    const filas = lista.map(p => {
        const dias = Math.abs(diasParaVencimiento(p));
        const etiqueta = esAtrasado
            ? `<span style="color:#ef5350; font-weight:600;">${dias} ${trad.diasAtraso}</span>`
            : `<span style="color:#fbbf24; font-weight:600;">${dias} ${trad.diasRestantes}</span>`;
        return `
            <tr>
                <td>${escaparHTML(p.libroTitulo)}</td>
                <td>${escaparHTML(p.prestamistaNombre)}</td>
                <td>${fechaLegible(p.fechaVencimiento)}</td>
                <td>${etiqueta}</td>
                ${gestion ? `<td><button class="table-btn edit-btn" onclick="devolverPrestamo('${p.id}')" title="${trad.alertasDevolver}"><i class="fas fa-undo-alt"></i></button></td>` : ""}
            </tr>
        `;
    }).join("");
    return `<table class="student-table">
        <thead>
            <tr>
                <th>${trad.alertasColLibro}</th>
                <th>${trad.alertasColPrestamista}</th>
                <th>${trad.alertasColVence}</th>
                <th>${trad.alertasColDias}</th>
                ${gestion ? `<th>${trad.alertasColAcciones}</th>` : ""}
            </tr>
        </thead>
        <tbody>${filas}</tbody>
    </table>`;
}
