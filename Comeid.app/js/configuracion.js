// =============================================
// ComeID - Configuracion, tema, idioma, respaldos y tutorial
// =============================================


        // Función para mostrar configuración
        function mostrarConfiguracion() {
            vistaActual = "configuracion";
            const trad = traducciones[configuracion.idioma];
            const puedeConfigurar = usuarioActual && usuarioActual.rol && (usuarioActual.rol.toLowerCase() === "admin" || usuarioActual.rol.toLowerCase() === "profesor");
            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.configuracionTitle}</h1>

                <div class="config-section">
                    <h3>${trad.configInstitucionLabel}</h3>
                    <label>${trad.configInstitucionLabel}</label>
                    <input type="text" id="institucion" class="config-input" value="${configuracion.institucion}">
                    <label>${trad.configComedorLabel}</label>
                    <input type="text" id="comedorNombre" class="config-input" value="${configuracion.comedor}">
                </div>

                <div class="config-section">
                    <h3>${trad.configIdiomaLabel}</h3>
                    <select id="idioma" class="config-input" onchange="cambiarIdioma()">
                        <option value="Español" ${configuracion.idioma === "Español" ? "selected" : ""}>Español</option>
                        <option value="English" ${configuracion.idioma === "English" ? "selected" : ""}>English</option>
                        <option value="Português" ${configuracion.idioma === "Português" ? "selected" : ""}>Português</option>
                        <option value="Français" ${configuracion.idioma === "Français" ? "selected" : ""}>Français</option>
                        <option value="Deutsch" ${configuracion.idioma === "Deutsch" ? "selected" : ""}>Deutsch</option>
                    </select>
                </div>

                <div class="config-section">
                    <h3>${trad.configTemaLabel}</h3>
                    <select id="tema" class="config-input" onchange="cambiarTema()">
                        <option value="Oscuro" ${configuracion.tema === "Oscuro" ? "selected" : ""}>${trad.configTemaOscuro}</option>
                        <option value="Claro" ${configuracion.tema === "Claro" ? "selected" : ""}>${trad.configTemaClaro}</option>
                    </select>
                </div>
                ${puedeConfigurar ? `
                <div class="config-section">
                    <h3>${(trad.configAperturaLabel || "Horario").split(" ")[0]}</h3>
                    <label>${trad.configAperturaLabel}</label>
                    <input type="time" id="apertura" class="config-input" value="${configuracion.apertura}">
                    <label>${trad.configCierreLabel}</label>
                    <input type="time" id="cierre" class="config-input" value="${configuracion.cierre}">
                    <label>${trad.configPrecioLabel}</label>
                    <input type="number" id="precio" class="config-input" value="${configuracion.precio}">
                </div>

                <div class="config-section">
                    <h3>Versión</h3>
                    <label>Número de Versión</label>
                    <input type="text" id="version" class="config-input" value="${configuracion.version}">
                </div>

                <div class="config-section">
                    <h3>${trad.backupTitle || "Copias de seguridad"}</h3>
                    <label>${trad.backupLabel || "Descarga una copia completa de la base de datos (estudiantes, asistencias, notas y configuración)."}</label>
                    <button class="save-config-btn" onclick="respaldarBaseDeDatos()" style="background: #2b67ff;">
                        <i class="fas fa-database"></i> ${trad.backupBtn || "Respaldar base de datos"}
                    </button>
                    <div style="margin-top: 15px;">
                        <label>${trad.restoreLabel || "Restaura una copia de seguridad guardada en este dispositivo."}</label>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 5px;">
                            <button class="save-config-btn" onclick="document.getElementById('restaurarBackupInput').click()" style="background: var(--danger-color);">
                                <i class="fas fa-upload"></i> ${trad.restoreBtn || "Restaurar respaldo"}
                            </button>
                            <input type="file" id="restaurarBackupInput" accept=".json,application/json" style="display: none;" onchange="restaurarBaseDeDatos(this.files[0])">
                        </div>
                    </div>
                </div>

                <button class="save-config-btn" onclick="guardarConfiguracion()">
                    ${trad.configGuardarBtn}
                </button>
                ` : `
                <div class="config-section">
                    <h3><i class="fas fa-shield-alt"></i> ${trad.configSoloGestor}</h3>
                    <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
                        ${trad.configSeccionHorarios} · ${trad.backupTitle || "Copias de seguridad"}
                    </p>
                    <button class="save-config-btn" style="margin-top:10px;" onclick="guardarConfiguracion()">
                        <i class="fas fa-save"></i> ${trad.configGuardarBtn}
                    </button>
                </div>
                `}
            `;
        }


        // Función para cambiar idioma
        function cambiarIdioma() {
            const nuevoIdioma = document.getElementById("idioma").value;
            configuracion.idioma = nuevoIdioma;
            localStorage.setItem("configuracionComeID", JSON.stringify(configuracion));
            aplicarIdioma(nuevoIdioma);
            if (vistaActual === "dashboard") mostrarDashboard();
            else if (vistaActual === "estudiantes") mostrarEstudiantes();
            else if (vistaActual === "historialEstudiante") mostrarHistorialEstudiante();
            else if (vistaActual === "invitados") mostrarInvitados();
            else if (vistaActual === "configuracion") mostrarConfiguracion();
            else if (vistaActual === "acercaDe") mostrarAcercaDe();
        }


        // Función para cambiar tema
        function cambiarTema() {
            const nuevoTema = document.getElementById("tema").value;
            aplicarTema(nuevoTema);
        }


        // Función para guardar configuración
        function guardarConfiguracion() {
            const trad = traducciones[configuracion.idioma];
            configuracion.institucion = document.getElementById("institucion") ? document.getElementById("institucion").value : configuracion.institucion;
            configuracion.comedor = document.getElementById("comedorNombre") ? document.getElementById("comedorNombre").value : configuracion.comedor;
            configuracion.idioma = document.getElementById("idioma") ? document.getElementById("idioma").value : configuracion.idioma;
            configuracion.tema = document.getElementById("tema") ? document.getElementById("tema").value : configuracion.tema;
            configuracion.apertura = document.getElementById("apertura") ? document.getElementById("apertura").value : configuracion.apertura;
            configuracion.cierre = document.getElementById("cierre") ? document.getElementById("cierre").value : configuracion.cierre;
            configuracion.precio = document.getElementById("precio") ? (Number(document.getElementById("precio").value) || 0) : configuracion.precio;
            configuracion.version = document.getElementById("version") ? document.getElementById("version").value : configuracion.version;

            localStorage.setItem("configuracionComeID", JSON.stringify(configuracion));
            aplicarIdioma(configuracion.idioma);
            aplicarTema(configuracion.tema);
            actualizarVersion();
            mostrarNotificacion(trad.notificacionConfiguracionGuardada);
        }


        // Función para cargar configuración
        function cargarConfiguracion() {
            const configGuardada = localStorage.getItem("configuracionComeID");
            if (configGuardada) {
                try {
                    configuracion = Object.assign(configuracion, JSON.parse(configGuardada));
                    configuracion.precio = Number(configuracion.precio) || 0;
                } catch (e) {
                    console.error("Error al cargar la configuración: ", e);
                }
            }
        }


        // Guarda el inventario (comidas preparadas / sobrantes) de una fecha
        function guardarInventarioDia() {
            const trad = traducciones[configuracion.idioma];
            const fecha = document.getElementById("historialFechaInput").value;
            if (!fecha) { mostrarNotificacion(trad.historialFecha || "Fecha", "error"); return; }
            const preparados = Number(document.getElementById("inventarioPreparados").value) || 0;
            const sobrantes = Number(document.getElementById("inventarioSobrantes").value) || 0;
            db.collection("inventario").doc(fecha).set({
                fecha: fecha,
                preparados: preparados,
                sobrantes: sobrantes,
                actualizado: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                mostrarNotificacion(trad.wasteGuardado || "Inventario guardado");
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al guardar inventario: ", error);
            });
        }


        // =============================================
        // COPIAS DE SEGURIDAD (respaldo / restauración)
        // =============================================

        function respaldarBaseDeDatos() {
            const trad = traducciones[configuracion.idioma];
            mostrarNotificacion(trad.backupProcesando || "Creando respaldo...");
            // Todas las colecciones del proyecto (comedor + biblioteca + portal)
            const colecciones = [
                "usuarios", "estudiantes", "asistencias", "notas",
                "comenfuera", "invitados", "inventario", "libros", "prestamos",
                "reservas", "valoraciones", "favoritos", "actividad",
                "configuracion", "recomendaciones", "notificaciones"
            ];
            const backup = {
                app: "ComeID",
                version: configuracion.version,
                fecha: new Date().toISOString(),
                configuracion: configuracion,
                colecciones: {}
            };
            const leerColeccion = (nombre) => {
                return db.collection(nombre).get().then(qs => {
                    const docs = [];
                    qs.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
                    return docs;
                });
            };
            const lecturas = colecciones.map(nombre => leerColeccion(nombre).then(docs => {
                backup.colecciones[nombre] = docs;
            }).catch(error => {
                console.warn("No se pudo leer la colección " + nombre + ": ", error);
                backup.colecciones[nombre] = [];
            }));
            Promise.all(lecturas)
                .then(() => {
                    // Compatibilidad con respaldos antiguos (estudiantes/asistencias/notas)
                    backup.estudiantes = backup.colecciones.estudiantes;
                    backup.asistencias = backup.colecciones.asistencias;
                    backup.notas = backup.colecciones.notas;
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Respaldo_ComeID_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    mostrarNotificacion(trad.backupHecho || "Respaldo creado correctamente");
                })
                .catch(error => {
                    mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                    console.error("Error al respaldar: ", error);
                });
        }


        function restaurarBaseDeDatos(file) {
            const trad = traducciones[configuracion.idioma];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    if (!backup || (!backup.colecciones && !Array.isArray(backup.estudiantes) && !Array.isArray(backup.asistencias))) {
                        mostrarNotificacion(trad.restoreError || "El archivo no es un respaldo válido", "error");
                        return;
                    }
                    if (!confirm(trad.restoreConfirm || "¿Restaurar el respaldo? Se agregarán o actualizarán los datos.")) {
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
                    // Formato completo: respalda todas las colecciones
                    if (backup.colecciones) {
                        Object.keys(backup.colecciones).forEach(nombre => {
                            escribirColeccion(nombre, backup.colecciones[nombre]);
                        });
                    }
                    // Compatibilidad con respaldos antiguos
                    escribirColeccion("estudiantes", backup.estudiantes);
                    escribirColeccion("asistencias", backup.asistencias);
                    escribirColeccion("notas", backup.notas);
                    if (backup.configuracion) {
                        configuracion = Object.assign(configuracion, backup.configuracion);
                        localStorage.setItem("configuracionComeID", JSON.stringify(configuracion));
                    }
                    mostrarNotificacion(trad.backupProcesando || "Restaurando respaldo...");
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


        // Función para mostrar Acerca de
        function mostrarAcercaDe() {
            vistaActual = "acercaDe";
            const trad = traducciones[configuracion.idioma];
            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.acercaDeTitle}</h1>
                <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px; margin-top: 15px;">
                    <p style="color: var(--text-primary); line-height: 1.6;">
                        ${trad.acercaDeDescripcion}
                    </p>
                    <p style="color: var(--text-primary); line-height: 1.6; margin-top: 12px;">
                        ${trad.acercaDeVersion.replace("1.8.0", configuracion.version)}<br>
                        ${trad.acercaDeDesarrollado}
                    </p>
                </div>
            `;
        }


        // Función para exportar a Excel
        async function exportarAExcel() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_XLSX);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const datos = estudiantes.map(estudiante => ({
                "Nombre": estudiante.nombre,
                "Sección": estudiante.seccion,
                "Nivel": estudiante.nivel || "N/A",
                "Tipo": estudiante.tipo === "Becado" ? trad.formTipoBecado : trad.formTipoPaga,
                "Cédula": estudiante.cedula
            }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datos);
            XLSX.utils.sheet_add_aoa(ws, [[`Institución: ${configuracion.institucion}`]], { origin: -1 });
            XLSX.utils.sheet_add_aoa(ws, [[`Fecha: ${new Date().toLocaleDateString()}`]], { origin: -1 });
            XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });
            XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
            XLSX.writeFile(wb, `Lista_de_Estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.getElementById("dropdownExport").classList.remove("show");
            mostrarNotificacion(trad.notificacionExportExcel);
        }


        // Función para exportar a PDF
        async function exportarAPDF() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_JSPDF);
                await cargarScript(URL_JSPDF_AUTOTABLE);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text(`Lista de Estudiantes - ${configuracion.institucion}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 22);
            const headers = [[trad.tablaNombre, trad.tablaSeccion, trad.tablaNivel, trad.tablaTipo, trad.tablaQR]];
            const data = estudiantes.map(estudiante => [
                estudiante.nombre,
                estudiante.seccion,
                estudiante.nivel || "N/A",
                estudiante.tipo === "Becado" ? trad.formTipoBecado : trad.formTipoPaga,
                estudiante.cedula
            ]);
            doc.autoTable({
                head: headers,
                body: data,
                startY: 30,
                styles: {
                    fontSize: 8,
                    cellPadding: 1.5,
                    overflow: 'linebreak',
                    tableWidth: 'auto',
                    halign: 'left',
                    textColor: 0
                },
                headStyles: {
                    fillColor: [22, 91, 211],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fillColor: [240, 240, 240],
                    textColor: 0
                },
                alternateRowStyles: {
                    fillColor: [220, 220, 220]
                }
            });
            doc.save(`Lista_de_Estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`);
            document.getElementById("dropdownExport").classList.remove("show");
            mostrarNotificacion(trad.notificacionExportPDF);
        }


        // Función para aplicar el tema
        function aplicarTema(tema) {
            const body = document.body;
            if (tema === "Claro") {
                body.classList.add("light-theme");
                body.classList.remove("dark-theme");
            } else {
                body.classList.remove("light-theme");
                body.classList.add("dark-theme");
            }
            configuracion.tema = tema;
            localStorage.setItem("configuracionComeID", JSON.stringify(configuracion));
        }


        // Función para aplicar el idioma a toda la interfaz
        function aplicarIdioma(idioma) {
            const trad = traducciones[idioma];
            if (!trad) return;
            
            document.getElementById("headerLogo").textContent = trad.headerLogo;
            document.getElementById("headerAcercaDe").textContent = trad.headerAcercaDe;
            document.getElementById("headerAyuda").textContent = trad.headerAyuda;
            actualizarVersion();
            
            document.getElementById("sidebarLogo").textContent = trad.sidebarLogo;
            document.getElementById("menuGeneralTitle").textContent = trad.menuGeneralTitle;
            document.getElementById("menuDashboard").textContent = trad.menuDashboard;
            document.getElementById("menuEstudiantes").textContent = trad.menuEstudiantes;
            document.getElementById("menuHistorial").textContent = trad.menuHistorial;
            document.getElementById("menuHistorialEstudiante").textContent = trad.menuHistorialEstudiante;
            document.getElementById("menuInvitados").textContent = trad.menuInvitados;
            document.getElementById("menuPrediccion").textContent = trad.menuPrediccion;
            const menuMenuEl = document.getElementById("menuMenu");
            if (menuMenuEl) menuMenuEl.textContent = trad.menuMenu;
            const mobileMenuPlanEl = document.getElementById("mobileMenuPlan");
            if (mobileMenuPlanEl) mobileMenuPlanEl.textContent = trad.menuMenu;
            document.getElementById("menuCambiarSistema").textContent = trad.menuCambiarSistema;
            const profileCambiarSistemaEl = document.getElementById("profileCambiarSistema");
            if (profileCambiarSistemaEl) profileCambiarSistemaEl.textContent = trad.profileCambiarSistema;
            document.getElementById("menuGestionRoles").textContent = trad.menuGestionRoles;
            document.getElementById("menuQR").textContent = trad.menuQR;
            document.getElementById("menuGenerarQR").textContent = trad.menuGenerarQR;
            document.getElementById("menuEscanearQR").textContent = trad.menuEscanearQR;
            document.getElementById("menuSistemaTitle").textContent = trad.menuSistemaTitle;
            document.getElementById("menuConfiguracion").textContent = trad.menuConfiguracion;
            document.getElementById("menuCerrarSesion").textContent = trad.menuCerrarSesion;
            document.getElementById("menuExportar").textContent = trad.menuExportar;
            document.getElementById("exportExcel").textContent = trad.exportExcel;
            document.getElementById("exportPDF").textContent = trad.exportPDF;

            // Formulario de estudiante
            document.getElementById("formTitle").textContent = indiceEditar >= 0 ? (trad.formTitleEditar || trad.formTitle) : trad.formTitle;
            document.getElementById("formNombreLabel").textContent = trad.formNombreLabel;
            document.getElementById("formSeccionLabel").textContent = trad.formSeccionLabel;
            document.getElementById("formCedulaLabel").textContent = trad.formCedulaLabel;
            document.getElementById("formNivelLabel").textContent = trad.formNivelLabel;
            document.getElementById("formTipoLabel").textContent = trad.formTipoLabel;
            document.getElementById("formTipoBecado").textContent = trad.formTipoBecado;
            document.getElementById("formTipoPaga").textContent = trad.formTipoPaga;
            document.getElementById("formCuentaTitulo").textContent = trad.formCuentaTitulo;
            document.getElementById("formCorreoAyuda").textContent = trad.formCorreoAyuda;
            document.getElementById("formCorreoLabel").textContent = trad.formCorreoLabel;
            document.getElementById("formClaveLabel").textContent = trad.formClaveLabel;
            document.getElementById("formCancelarBtn").textContent = trad.formCancelarBtn;
            document.getElementById("formGuardarBtn").textContent = trad.formGuardarBtn;
            document.getElementById("formFotoLabel").textContent = trad.formFotoLabel;
            document.getElementById("formFotoSubir").textContent = trad.formFotoSubir;
            document.getElementById("formFotoQuitar").textContent = trad.formFotoQuitar;
            const fotoUrlInput = document.getElementById("fotoUrl");
            if (fotoUrlInput) fotoUrlInput.placeholder = trad.formFotoUrl;

            // Gestión de roles
            document.getElementById("rolesFormTitle").textContent = trad.rolesFormTitle;
            document.getElementById("rolesCancelarBtn").textContent = trad.rolesCancelarBtn;
            document.getElementById("rolesGuardarBtn").textContent = trad.rolesGuardarBtn;

            // Modal QR
            document.getElementById("modalQRTitle").textContent = trad.modalQRTitle;
            document.getElementById("modalQRGenerarText").textContent = trad.modalQRGenerarText;
            document.getElementById("modalQRCerrarBtn").textContent = trad.modalQRCerrarBtn;
            if (typeof cedulaQRActual !== "undefined" && cedulaQRActual && document.querySelector("#codigoQR canvas")) {
                generarQR();
            }

            // Modal escáner
            document.getElementById("scannerTitle").textContent = trad.scannerTitle;
            document.getElementById("scannerIniciarBtn").textContent = trad.scannerIniciarBtn;
            document.getElementById("scannerDetenerBtn").textContent = trad.scannerDetenerBtn;
            document.getElementById("scannerCerrarText").textContent = trad.scannerCerrarText;
            document.getElementById("scannerListaTitle").textContent = trad.scannerListaTitle;
            document.getElementById("scannerInstruccion").textContent = trad.scannerInstruccion;

            document.getElementById("menuSearch").placeholder = trad.menuBuscarFuncion || trad.btnBuscar;
            const selectIdioma = document.getElementById("idioma");
            if (selectIdioma) selectIdioma.value = idioma;
            const selectTema = document.getElementById("tema");
            if (selectTema) selectTema.value = configuracion.tema;

            // Actualizar menú móvil
            document.getElementById("mobileDashboard").textContent = trad.mobileDashboard;
            document.getElementById("mobileEstudiantes").textContent = trad.mobileEstudiantes;
            document.getElementById("mobileHistorial").textContent = trad.menuHistorial;
            document.getElementById("mobileHistorialEstudiante").textContent = trad.menuHistorialEstudiante;
            document.getElementById("mobileInvitados").textContent = trad.menuInvitados;
            document.getElementById("mobilePrediccion").textContent = trad.menuPrediccion;
            document.getElementById("mobileCambiarSistema").textContent = trad.menuCambiarSistema;
            document.getElementById("mobileGestionRoles").textContent = trad.mobileGestionRoles;
            document.getElementById("mobileExportar").textContent = trad.mobileExportar;
            document.getElementById("mobileExportExcel").textContent = trad.mobileExportExcel;
            document.getElementById("mobileExportPDF").textContent = trad.mobileExportPDF;
            document.getElementById("mobileQR").textContent = trad.mobileQR;
            document.getElementById("mobileGenerarQR").textContent = trad.mobileGenerarQR;
            document.getElementById("mobileEscanearQR").textContent = trad.mobileEscanearQR;
            document.getElementById("mobileConfiguracion").textContent = trad.mobileConfiguracion;
            document.getElementById("mobileCerrarSesion").textContent = trad.mobileCerrarSesion;
            actualizarEstadoConexion();
        }


        // Función para actualizar la versión en el footer
        function actualizarVersion() {
            const trad = traducciones[configuracion.idioma];
            document.getElementById("versionText").textContent = trad.versionText.replace("1.8.0", configuracion.version);
        }


        // Función para mostrar el tutorial
        function mostrarTutorial() {
            const trad = traducciones[configuracion.idioma];
            document.getElementById("tutorialModal").style.display = "flex";
            
            document.getElementById("tutorialTitle").textContent = trad.tutorialTitle;
            document.getElementById("tutorialPaso1Titulo").textContent = trad.tutorialPaso1Titulo;
            document.getElementById("tutorialPaso1Texto").textContent = trad.tutorialPaso1Texto;
            document.getElementById("tutorialPaso2Titulo").textContent = trad.tutorialPaso2Titulo;
            document.getElementById("tutorialPaso2Texto").textContent = trad.tutorialPaso2Texto;
            document.getElementById("tutorialPaso3Titulo").textContent = trad.tutorialPaso3Titulo;
            document.getElementById("tutorialPaso3Texto").textContent = trad.tutorialPaso3Texto;
            document.getElementById("tutorialPasoRolesTitulo").textContent = trad.tutorialPasoRolesTitulo || "Gestiona Roles de Usuario";
            document.getElementById("tutorialPasoRolesTexto").textContent = trad.tutorialPasoRolesTexto || "Usa el menú 'Gestionar Roles' para asignar o cambiar roles a los usuarios (Admin, Profesor, Estudiante).";
            document.getElementById("tutorialPasoNivelTitulo").textContent = trad.tutorialPasoNivelTitulo || "Filtra por Nivel";
            document.getElementById("tutorialPasoNivelTexto").textContent = trad.tutorialPasoNivelTexto || 'En el menú "Estudiantes" usa el filtro de nivel para ver a los estudiantes agrupados por su nivel (7mo a 12mo).';
            document.getElementById("tutorialPaso4Titulo").textContent = trad.tutorialPaso4Titulo;
            document.getElementById("tutorialPaso4Texto").textContent = trad.tutorialPaso4Texto;
            document.getElementById("tutorialPaso5Titulo").textContent = trad.tutorialPaso5Titulo;
            document.getElementById("tutorialPaso5Texto").textContent = trad.tutorialPaso5Texto;
            document.getElementById("tutorialPaso6Titulo").textContent = trad.tutorialPaso6Titulo;
            document.getElementById("tutorialPaso6Texto").textContent = trad.tutorialPaso6Texto;
            document.getElementById("tutorialPaso7Titulo").textContent = trad.tutorialPaso7Titulo;
            document.getElementById("tutorialPaso7Texto").textContent = trad.tutorialPaso7Texto;
            document.getElementById("tutorialPaso8Titulo").textContent = trad.tutorialPaso8Titulo;
            document.getElementById("tutorialPaso8Texto").textContent = trad.tutorialPaso8Texto;
            document.getElementById("tutorialPaso9Titulo").textContent = trad.tutorialPaso9Titulo;
            document.getElementById("tutorialPaso9Texto").textContent = trad.tutorialPaso9Texto;
            document.getElementById("tutorialPaso10Titulo").textContent = trad.tutorialPaso10Titulo;
            document.getElementById("tutorialPaso10Texto").textContent = trad.tutorialPaso10Texto;
            document.getElementById("tutorialNoVolverAMostrarBtn").textContent = trad.tutorialNoVolverAMostrarBtn;
            document.getElementById("tutorialEntendidoBtn").textContent = trad.tutorialEntendidoBtn;
        }


        // Función para cerrar el tutorial
        function cerrarTutorial() {
            document.getElementById("tutorialModal").style.display = "none";
        }