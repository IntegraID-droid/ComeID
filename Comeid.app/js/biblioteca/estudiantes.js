// =============================================
// ComeID Biblioteca - Estudiantes de la biblioteca
// Socios propios de la biblioteca (no dependen del comedor).
// Colección "bibliotecaEstudiantes": gestores la gestionan.
// =============================================

function mostrarEstudiantesBib() {
    const gestion = puedeGestionar();
    if (!gestion) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).notificacionSinPermiso, "error");
        return;
    }
    activarVista("estudiantesBib");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;

    document.getElementById("contenido").innerHTML = `
        <div class="student-header">
            <h1 class="title">${trad.estudiantesBibTitle}</h1>
            <button class="add-btn" onclick="toggleFormEstudianteBib()"><i class="fas fa-user-plus"></i> ${trad.estudiantesBibBtnAgregar}</button>
        </div>
        <p style="color: var(--text-secondary); margin-top: 4px; max-width: 720px;">${trad.estudiantesBibSubtitle}</p>
        <div id="listadoEstudiantesBib" style="margin-top:16px;"></div>
    `;
    renderEstudiantesBib(trad);
}

function toggleFormEstudianteBib() {
    const cont = document.getElementById("listadoEstudiantesBib");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    if (cont.querySelector("input")) {
        renderEstudiantesBib(trad);
        return;
    }
    cont.innerHTML = `
        <h2 style="color: var(--accent-color); margin-bottom: 12px;">${trad.estudiantesBibBtnAgregar}</h2>
        <div class="config-section">
            <label>${trad.estudiantesBibFormNombre}</label>
            <input class="config-input" id="estudianteBibNombre" placeholder="${trad.estudiantesBibFormNombre}">
            <label>${trad.estudiantesBibFormCedula}</label>
            <input class="config-input" id="estudianteBibCedula" placeholder="${trad.estudiantesBibFormCedula}">
            <label>${trad.estudiantesBibFormSeccion}</label>
            <input class="config-input" id="estudianteBibSeccion" placeholder="${trad.estudiantesBibFormSeccion}">
            <label>${trad.estudiantesBibFormCorreo}</label>
            <input class="config-input" id="estudianteBibCorreo" type="email" placeholder="${trad.estudiantesBibFormCorreo}">
            <button class="save-config-btn" style="margin-top:10px;" onclick="guardarEstudianteBib()"><i class="fas fa-save"></i> ${trad.estudiantesBibBtnGuardar}</button>
            <button class="save-config-btn" style="background:#c62828; margin-top:10px;" onclick="renderEstudiantesBib()"><i class="fas fa-times"></i> ${trad.libroCancelarBtn}</button>
        </div>
    `;
}

function guardarEstudianteBib() {
    if (!puedeGestionar()) return;
    const nombre = document.getElementById("estudianteBibNombre");
    const cedula = document.getElementById("estudianteBibCedula");
    const seccion = document.getElementById("estudianteBibSeccion");
    const correo = document.getElementById("estudianteBibCorreo");
    if (!nombre || !cedula) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const valorNombre = nombre.value.trim();
    const valorCedula = cedula.value.trim();
    const valorCorreo = correo ? correo.value.trim() : "";
    if (!valorNombre || !valorCedula) {
        mostrarNotificacion(trad.estudiantesBibCamposFaltantes, "error");
        return;
    }
    const repetida = bibliotecaEstudiantes.some(s => s.cedula && String(s.cedula).trim() === valorCedula);
    if (repetida) {
        mostrarNotificacion(trad.estudiantesBibCedulaRepetida, "error");
        return;
    }
    mostrarLoading();
    db.collection("bibliotecaEstudiantes").add({
        nombre: valorNombre,
        cedula: valorCedula,
        seccion: (seccion ? seccion.value.trim() : "") || "",
        correo: valorCorreo,
        fechaAlta: new Date().toISOString().slice(0, 10)
    }).then(ref => {
        bibliotecaEstudiantes.push({ id: ref.id, nombre: valorNombre, cedula: valorCedula, seccion: seccion ? seccion.value.trim() : "", correo: valorCorreo });
        sincronizarEstudiantesBib();
        ocultarLoading();
        mostrarNotificacion(trad.estudiantesBibAgregado, "ok");
        registrarActividad("agregar_estudiante", valorNombre + " (" + valorCedula + ")");
        renderEstudiantesBib(trad);
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

function eliminarEstudianteBib(id) {
    if (!puedeGestionar()) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const socio = bibliotecaEstudiantes.find(s => s.id === id);
    if (!socio) return;
    if (!confirm(trad.estudiantesBibConfirmarEliminar)) return;
    mostrarLoading();
    db.collection("bibliotecaEstudiantes").doc(id).delete().then(() => {
        bibliotecaEstudiantes = bibliotecaEstudiantes.filter(s => s.id !== id);
        sincronizarEstudiantesBib();
        ocultarLoading();
        mostrarNotificacion(trad.estudiantesBibEliminado, "ok");
        registrarActividad("eliminar_estudiante", socio.nombre + " (" + socio.cedula + ")");
        renderEstudiantesBib(trad);
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

function renderEstudiantesBib(trad) {
    const cont = document.getElementById("listadoEstudiantesBib");
    if (!cont) return;
    const t = trad || traducciones[configuracion.idioma] || traducciones.Español;
    if (bibliotecaEstudiantes.length === 0) {
        cont.innerHTML = `<div class="no-results">${t.estudiantesBibSinRegistros}</div>`;
        return;
    }
    const filas = bibliotecaEstudiantes.slice()
        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
        .map(s => `
            <tr>
                <td>${escaparHTML(s.nombre)}</td>
                <td>${escaparHTML(s.cedula)}</td>
                <td>${escaparHTML(s.seccion || "—")}</td>
                <td>${escaparHTML(s.correo || "—")}</td>
                <td><button class="table-btn delete-btn" onclick="eliminarEstudianteBib('${s.id}')" title="${t.estudiantesBibColAcciones}"><i class="fas fa-trash-alt"></i></button></td>
            </tr>
        `).join("");
    cont.innerHTML = `<table class="student-table">
        <thead>
            <tr>
                <th>${t.estudiantesBibColNombre}</th>
                <th>${t.estudiantesBibColCedula}</th>
                <th>${t.estudiantesBibColSeccion}</th>
                <th>${t.estudiantesBibColCorreo}</th>
                <th>${t.estudiantesBibColAcciones}</th>
            </tr>
        </thead>
        <tbody>${filas}</tbody>
    </table>`;
}

// Reconstruye el array mezclado "estudiantes" (comedor + biblioteca)
// tras agregar o eliminar un socio sin recargar toda la app.
function sincronizarEstudiantesBib() {
    const comedor = estudiantes.filter(e => e.origen !== "biblioteca");
    estudiantes = comedor.concat(bibliotecaEstudiantes.map(s => ({
        id: s.id,
        nombre: s.nombre || "Sin nombre",
        cedula: s.cedula || "",
        correo: s.correo || "",
        origen: "biblioteca"
    })));
}