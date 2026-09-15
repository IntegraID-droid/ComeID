// =============================================
// ComeID Biblioteca - Configuración, respaldos y multas
// =============================================

// Carga los ajustes propios de la biblioteca (multas) desde Firestore
// con caché en localStorage para funcionar sin conexión.
function cargarAjustesBib() {
    return db.collection("configuracion").doc("biblioteca").get().then(doc => {
        if (doc.exists) {
            const datos = doc.data();
            ajustesBib = {
                multasActivas: !!datos.multasActivas,
                montoMultaDiario: Number(datos.montoMultaDiario) || 0
            };
        } else {
            ajustesBib = { multasActivas: false, montoMultaDiario: 0 };
        }
        try { localStorage.setItem("ajustesBibComeID", JSON.stringify(ajustesBib)); } catch (e) {}
        return ajustesBib;
    }).catch(error => {
        console.warn("No se pudieron cargar los ajustes de la biblioteca:", error.message);
        try {
            const cache = JSON.parse(localStorage.getItem("ajustesBibComeID") || "null");
            if (cache && typeof cache.multasActivas === "boolean") ajustesBib = cache;
        } catch (e) {}
        return ajustesBib;
    });
}

function guardarAjustesBib() {
    const datos = {
        multasActivas: !!ajustesBib.multasActivas,
        montoMultaDiario: Number(ajustesBib.montoMultaDiario) || 0
    };
    ajustesBib = datos;
    try { localStorage.setItem("ajustesBibComeID", JSON.stringify(ajustesBib)); } catch (e) {}
    return db.collection("configuracion").doc("biblioteca").set(datos, { merge: true })
        .catch(error => {
            console.warn("Ajustes guardados localmente (sin conexión):", error.message);
        });
}

function cambiarIdiomaBib(idioma) {
    configuracion.idioma = idioma;
    guardarConfiguracionBib();
    aplicarConfiguracionBib();
}

function cambiarTemaBib(tema) {
    configuracion.tema = tema;
    guardarConfiguracionBib();
    aplicarConfiguracionBib();
}

// =============================================
// VISTA DE CONFIGURACIÓN
// =============================================

function mostrarConfiguracionBib() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const gestion = puedeGestionar();
    activarVista("configuracion");
    const idiomas = ["Español", "English", "Português", "Français", "Deutsch"];
    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.configuracionTitle}</h1>

        <div class="config-section" style="margin-top:15px;">
            <h3><i class="fas fa-building"></i> ${trad.configSeccionGeneral}</h3>
            <label>${trad.configInstitucionLabel}</label>
            <input class="config-input" id="cfgInstitucion" value="${escaparHTML(configuracion.institucion)}">
            <label>${trad.configIdiomaLabel}</label>
            <select class="config-input" id="cfgIdioma">
                ${idiomas.map(i => `<option value="${i}" ${configuracion.idioma === i ? "selected" : ""}>${i}</option>`).join("")}
            </select>
            <label>${trad.configTemaLabel}</label>
            <select class="config-input" id="cfgTema">
                <option value="Oscuro" ${configuracion.tema === "Oscuro" ? "selected" : ""}>${trad.configTemaOscuro}</option>
                <option value="Claro" ${configuracion.tema === "Claro" ? "selected" : ""}>${trad.configTemaClaro}</option>
            </select>
            <button class="save-config-btn" style="margin-top:10px;" onclick="guardarAjustesGenerales()"><i class="fas fa-save"></i> ${trad.configGuardarBtn}</button>
        </div>
        ${gestion ? `
        <div class="config-section">
            <h3><i class="fas fa-coins"></i> ${trad.configSeccionMultas}</h3>
            <div class="switch-row">
                <div>
                    <p style="color: var(--text-primary); font-size: 14px; font-weight: 600;">${trad.configMultasActivas}</p>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">${trad.configMultaMontoDesc}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="cfgMultasActivas" ${ajustesBib.multasActivas ? "checked" : ""}>
                    <span class="switch-slider"></span>
                </label>
            </div>
            <label>${trad.configMultaMontoLabel}</label>
            <input class="config-input" type="number" id="cfgMontoMulta" min="0" step="50" value="${Number(ajustesBib.montoMultaDiario) || 0}">
            <button class="save-config-btn" style="margin-top:10px;" onclick="guardarAjustesMultas()"><i class="fas fa-save"></i> ${trad.configGuardarBtn}</button>
        </div>

        <div class="config-section">
            <h3><i class="fas fa-database"></i> ${trad.backupTitle}</h3>
            <label>${trad.backupLabel}</label>
            <button class="save-config-btn" style="margin-top:10px;" onclick="respaldarBaseDeDatosBib()"><i class="fas fa-download"></i> ${trad.backupBtn}</button>
            <label>${trad.restoreLabel}</label>
            <input type="file" id="fileRestaurarBib" accept="application/json,.json" style="display:none;" onchange="restaurarBaseDeDatosBib(this)">
            <button class="save-config-btn" style="background:#10b981; margin-top:10px;" onclick="document.getElementById('fileRestaurarBib').click()"><i class="fas fa-upload"></i> ${trad.restoreBtn}</button>
        </div>` : `
        <div class="config-section">
            <h3><i class="fas fa-shield-alt"></i> ${trad.configSoloGestor}</h3>
            <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
                ${trad.configSeccionMultas} · ${trad.backupTitle}
            </p>
        </div>`}
    `;
}

function guardarAjustesGenerales() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const institucion = (document.getElementById("cfgInstitucion").value || "").trim();
    const idioma = document.getElementById("cfgIdioma").value;
    const tema = document.getElementById("cfgTema").value;
    if (institucion) configuracion.institucion = institucion;
    configuracion.idioma = idioma;
    configuracion.tema = tema;
    guardarConfiguracionBib();
    aplicarConfiguracionBib();
    mostrarConfiguracionBib();
    mostrarNotificacion(trad.notificacionConfigGuardada);
}

function guardarAjustesMultas() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const activasEl = document.getElementById("cfgMultasActivas");
    const montoEl = document.getElementById("cfgMontoMulta");
    if (!activasEl || !montoEl) return;
    ajustesBib.multasActivas = activasEl.checked;
    ajustesBib.montoMultaDiario = Number(montoEl.value) || 0;
    mostrarLoading();
    guardarAjustesBib().then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionConfigGuardada, "ok");
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

// =============================================
// COPIA DE SEGURIDAD (respaldo / restauración)
// =============================================

function respaldarBaseDeDatosBib() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    mostrarNotificacion(trad.backupProcesando || "Creando respaldo...");
    const backup = {
        app: "BiblioGest",
        version: VERSION_BIBLIOTECA,
        fecha: new Date().toISOString(),
        configuracion: configuracion,
        ajustesBib: ajustesBib,
        libros: [],
        prestamos: [],
        estudiantes: [],
        profesores: [],
        bibliotecaEstudiantes: [],
        reservas: [],
        valoraciones: [],
        favoritos: [],
        actividad: []
    };
    const leerColeccion = (nombre) => {
        return db.collection(nombre).get().then(qs => {
            const docs = [];
            qs.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            return docs;
        });
    };
    Promise.all([
        leerColeccion("libros"),
        leerColeccion("prestamos"),
        leerColeccion("estudiantes"),
        leerColeccion("usuarios"),
        leerColeccion("bibliotecaEstudiantes"),
        leerColeccion("reservas"),
        leerColeccion("valoraciones"),
        leerColeccion("favoritos"),
        leerColeccion("actividad")
    ]).then(resultados => {
        backup.libros = resultados[0];
        backup.prestamos = resultados[1];
        backup.estudiantes = resultados[2];
        backup.profesores = resultados[3];
        backup.bibliotecaEstudiantes = resultados[4];
        backup.reservas = resultados[5];
        backup.valoraciones = resultados[6];
        backup.favoritos = resultados[7];
        backup.actividad = resultados[8];
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Respaldo_Biblioteca_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarNotificacion(trad.backupHecho || "Respaldo creado correctamente");
    }).catch(error => {
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
        console.error("Error al respaldar: ", error);
    });
}

function restaurarBaseDeDatosBib(fileInput) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const file = fileInput && fileInput.files ? fileInput.files[0] : fileInput;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            if (!backup || !Array.isArray(backup.libros)) {
                mostrarNotificacion(trad.restoreError || "El archivo no es un respaldo válido", "error");
                return;
            }
            if (!confirm(trad.restoreConfirm || "¿Restaurar el respaldo? Se agregarán o actualizarán los datos de la biblioteca.")) {
                return;
            }
            const operaciones = [];
            const escribirColeccion = (nombre, docs) => {
                (docs || []).forEach(d => {
                    if (!d || !d.id) return;
                    const datos = Object.assign({}, d);
                    delete datos.id;
                    operaciones.push(db.collection(nombre).doc(d.id).set(datos));
                });
            };
            escribirColeccion("libros", backup.libros);
            escribirColeccion("prestamos", backup.prestamos);
            escribirColeccion("estudiantes", backup.estudiantes);
            escribirColeccion("usuarios", backup.profesores);
            escribirColeccion("bibliotecaEstudiantes", backup.bibliotecaEstudiantes);
            escribirColeccion("reservas", backup.reservas);
            escribirColeccion("valoraciones", backup.valoraciones);
            escribirColeccion("favoritos", backup.favoritos);
            escribirColeccion("actividad", backup.actividad);
            if (backup.ajustesBib) {
                ajustesBib = backup.ajustesBib;
                guardarAjustesBib();
            }
            if (backup.configuracion) {
                if (backup.configuracion.idioma) configuracion.idioma = backup.configuracion.idioma;
                if (backup.configuracion.tema) configuracion.tema = backup.configuracion.tema;
                if (backup.configuracion.institucion) configuracion.institucion = backup.configuracion.institucion;
                guardarConfiguracionBib();
            }
            mostrarNotificacion(trad.restoreProcesando || "Restaurando respaldo...");
            Promise.all(operaciones).then(() => {
                mostrarNotificacion(trad.restoreHecho || "Respaldo restaurado correctamente");
                setTimeout(() => { location.reload(); }, 1200);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al restaurar: ", error);
            });
        } catch (error) {
            mostrarNotificacion(trad.restoreError || "El archivo no es un respaldo válido", "error");
            console.error("Error al restaurar: ", error);
        }
    };
    reader.readAsText(file);
}

// =============================================
// ACERCA DE
// =============================================

function mostrarAcercaDeBib() {
    activarVista("acercaDe");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const anio = new Date().getFullYear();
    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.acercaDeTitle}</h1>
        <div class="config-section" style="margin-top:15px;">
            <p style="color: var(--text-primary); line-height: 1.6;">
                ${trad.acercaDeDescripcion}
            </p>
            <p style="color: var(--text-primary); line-height: 1.6; margin-top: 12px;">
                <i class="fas fa-tag"></i> ${trad.acercaDeVersion.replace("{VERSION}", VERSION_BIBLIOTECA)}
            </p>
            <p style="color: var(--text-primary); line-height: 1.6; margin-top: 12px;">
                <i class="fas fa-code"></i> ${trad.acercaDeDesarrollado}
            </p>
        </div>
        <p style="color: var(--text-secondary); font-size: 12px; text-align: center; margin-top: 10px;">
            ${trad.acercaDeCopyright.replace("{ANIO}", anio)}
        </p>
    `;
}
