// =============================================
// ComeID Biblioteca - Registro de actividad
// =============================================

function cargarActividad() {
    return db.collection("actividad").orderBy("fecha", "desc").limit(200).get().then(qs => {
        actividad = [];
        qs.forEach(doc => actividad.push(Object.assign({ id: doc.id }, doc.data())));
    }).catch(error => {
        console.warn("No se pudo cargar la actividad:", error.message);
        actividad = [];
    });
}

function registrarActividad(accion, detalle) {
    const quien = (usuarioActual && (usuarioActual.nombre || usuarioActual.correo)) || "Desconocido";
    const entrada = {
        accion,
        detalle,
        usuario: quien,
        usuarioId: (usuarioActual && usuarioActual.uid) || "",
        fecha: new Date().toISOString()
    };
    try {
        db.collection("actividad").add(entrada).catch(error => {
            console.warn("Actividad no registrada (sin conexión o sin permiso):", error.message);
        });
        actividad.unshift(Object.assign({ id: "tmp" }, entrada));
        if (actividad.length > 200) actividad.pop();
    } catch (e) {
        console.warn("Error al registrar actividad:", e);
    }
}

const ACTIVIDAD_ACCIONES = {
    agregar_libro: "actividadAccionAgregar",
    editar_libro: "actividadAccionEditar",
    eliminar_libro: "actividadAccionEliminar",
    crear_prestamo: "actividadAccionPrestar",
    devolver_prestamo: "actividadAccionDevolver",
    cobrar_multa: "actividadAccionCobrarMulta",
    renovar_prestamo: "actividadAccionRenovar",
    marcar_danado: "actividadAccionDanado",
    marcar_perdido: "actividadAccionPerdido",
    restaurar_copia: "actividadAccionRestaurar"
};

function mostrarActividad() {
    activarVista("actividad");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.actividadTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.actividadSubtitle}</p>
        <div class="student-container" id="actividadContenido" style="margin-top:16px;"></div>
    `;
    renderActividad();
}

function renderActividad() {
    const cont = document.getElementById("actividadContenido");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    if (actividad.length === 0) {
        cont.innerHTML = `<div class="no-results">${trad.actividadSinRegistros}</div>`;
        return;
    }
    cont.innerHTML = `<table class="student-table">
        <thead>
            <tr>
                <th>${trad.actividadColFecha}</th>
                <th>${trad.actividadColUsuario}</th>
                <th>${trad.actividadColAccion}</th>
                <th>${trad.actividadColDetalle}</th>
            </tr>
        </thead>
        <tbody>${actividad.map(a => {
            const claveAccion = ACTIVIDAD_ACCIONES[a.accion];
            const textoAccion = claveAccion ? (trad[claveAccion] || a.accion) : (a.accion || "—");
            const fecha = a.fecha ? new Date(a.fecha).toLocaleString(localeParaIdioma()) : "—";
            return `<tr>
                <td>${escaparHTML(fecha)}</td>
                <td>${escaparHTML(a.usuario || "—")}</td>
                <td><span class="estado-semaforo semaforo-normal">${escaparHTML(textoAccion)}</span></td>
                <td>${escaparHTML(a.detalle || "—")}</td>
            </tr>`;
        }).join("")}</tbody>
    </table>`;
}
