// =============================================
// Portal Estudiantes - Configuración personal
// =============================================

function cambiarTema(tema) {
    localStorage.setItem("portal_estudiantes_tema", tema);
    aplicarTema(tema);
}

function renderConfiguracion() {
    const c = document.getElementById("contenido");
    const temaActual = localStorage.getItem("portal_estudiantes_tema") || "oscuro";
    const est = App.estudiante;
    const asistencias = App.asistencias || [];
    const prestamos = App.prestamos || [];

    c.innerHTML = `
        <div class="page-title">Configuración</div>
        <p class="page-subtitle">Preferencias personales de tu portal.</p>

        <div class="section-title"><i class="fa-solid fa-download"></i> Exportar mis datos</div>
        <div class="card">
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">Descarga un archivo CSV con tu información de asistencia y préstamos.</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn" onclick="exportarAsistenciaCSV()">
                    <i class="fa-solid fa-file-csv"></i> Asistencia (${asistencias.length} registros)
                </button>
                <button class="btn" onclick="exportarPrestamosCSV()">
                    <i class="fa-solid fa-file-csv"></i> Préstamos (${prestamos.length} registros)
                </button>
            </div>
        </div>

        <div class="section-title"><i class="fa-solid fa-bell"></i> Notificaciones</div>
        <div class="card">
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">Recibe alertas del navegador cuando tengas préstamos vencidos o próximos a vencer.</p>
            <button class="btn" onclick="activarNotificacionesPush()" id="btnNotifPush">
                <i class="fa-solid fa-bell"></i> Activar notificaciones del navegador
            </button>
        </div>

        <div class="section-title"><i class="fa-solid fa-moon"></i> Apariencia</div>
        <div class="card">
            <div class="grid" style="grid-template-columns:1fr 1fr;">
                <button class="btn ${temaActual === "oscuro" ? "" : "btn-ghost"}" onclick="cambiarTema('oscuro')">
                    <i class="fa-solid fa-moon"></i> Oscuro
                </button>
                <button class="btn ${temaActual === "claro" ? "" : "btn-ghost"}" onclick="cambiarTema('claro')">
                    <i class="fa-solid fa-sun"></i> Claro
                </button>
            </div>
        </div>

        <div class="section-title"><i class="fa-solid fa-circle-info"></i> Acerca de</div>
        <div class="card" style="text-align:center; padding:22px;">
            <img src="assets/logo.png" alt="Integra ID" style="width:64px; height:64px; border-radius:16px; object-fit:cover; margin:0 auto 12px; display:block; border:1px solid var(--border-color);">
            <div style="font-weight:800; font-size:18px;">Integra ID <span style="color:var(--accent-color);">Estudiantes</span></div>
            <div style="color:var(--text-secondary); font-size:13px; margin-top:4px;">Portal del estudiante · CTP de Liberia</div>
            <div style="color:var(--text-secondary); font-size:12px; margin-top:8px;">Versión 1.0.0</div>
            <div style="margin-top:14px; text-align:left; font-size:13px; color:var(--text-secondary); line-height:1.8;">
                <div><i class="fa-solid fa-user"></i> ${escaparHTML(est.nombre)}</div>
                <div><i class="fa-solid fa-id-card"></i> Código estudiantil: ${escaparHTML(est.id)}</div>
                <div><i class="fa-solid fa-school"></i> CTP de Liberia</div>
            </div>
        </div>

        <div class="section-title"><i class="fa-solid fa-shield-halved"></i> Sesión</div>
        <div class="card">
            <button class="btn btn-danger btn-block" onclick="cerrarSesionPortal()">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
            </button>
        </div>
    `;
}

function descargarCSV(nombre, contenido) {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarAsistenciaCSV() {
    const asistencias = App.asistencias || [];
    if (!asistencias.length) { toast("No hay asistencias para exportar."); return; }
    let csv = "Fecha,Hora\n";
    asistencias.forEach(a => { csv += `"${a.fecha || ""}","${a.hora || ""}"\n`; });
    descargarCSV("asistencias_" + (App.estudiante?.cedula || "") + ".csv", csv);
    toast("Archivo de asistencia descargado.");
}

function exportarPrestamosCSV() {
    const prestamos = App.prestamos || [];
    if (!prestamos.length) { toast("No hay préstamos para exportar."); return; }
    let csv = "Libro,Fecha préstamo,Fecha vencimiento,Estado,Fecha devolución\n";
    prestamos.forEach(p => {
        const est = estadoPrestamo(p);
        csv += `"${p.libroTitulo || ""}","${p.fechaPrestamo || ""}","${p.fechaVencimiento || ""}","${est.texto}","${p.fechaDevolucion || ""}"\n`;
    });
    descargarCSV("prestamos_" + (App.estudiante?.cedula || "") + ".csv", csv);
    toast("Archivo de préstamos descargado.");
}

function activarNotificacionesPush() {
    if (!("Notification" in window)) {
        toast("Tu navegador no soporta notificaciones.");
        return;
    }
    Notification.requestPermission().then(perm => {
        if (perm === "granted") {
            toast("Notificaciones activadas. Se te alertará sobre préstamos vencidos.");
            verificarPrestamosVencidosNotif();
        } else {
            toast("Permiso de notificaciones denegado.");
        }
    });
}

const PAGE = {
    init: function () {
        aplicarTema(localStorage.getItem("portal_estudiantes_tema") || "oscuro");
        Promise.all([cargarPrestamosPropios(), cargarAsistenciasPropias()])
            .then(renderConfiguracion)
            .catch(renderConfiguracion);
    }
};

iniciarApp(PAGE.init);
