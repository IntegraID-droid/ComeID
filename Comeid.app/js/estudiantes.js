// =============================================
// ComeID - Registro, edicion, filtros y QR de estudiantes
// =============================================


        // Filtros de la vista de estudiantes (nivel y búsqueda)
        let filtroNivelActual = "";
        let textoBusquedaActual = "";


        // Función para cargar estudiantes desde Firestore
        function cargarEstudiantes() {
            db.collection("estudiantes").get().then((querySnapshot) => {
                estudiantes = [];
                querySnapshot.forEach((doc) => {
                    estudiantes.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                if (vistaActual === "dashboard") {
                    mostrarDashboard();
                } else if (vistaActual === "estudiantes") {
                    mostrarEstudiantes();
} else if (vistaActual === "invitados") {
                    mostrarInvitados();
                }
            }).catch(error => {
                console.error("Error al cargar estudiantes: ", error);
            });
        }


        // Función para mostrar estudiantes
        function mostrarEstudiantes() {
            vistaActual = "estudiantes";
            const trad = traducciones[configuracion.idioma];
            const niveles = ["7mo", "8vo", "9no", "10mo", "11mo", "12mo"];
            const busqueda = textoBusquedaActual.toLowerCase();
            const estudiantesVisibles = estudiantes.filter(estudiante => {
                const tipoTraducido = estudiante.tipo === "Becado" ? trad.formTipoBecado : trad.formTipoPaga;
                const nivelCoincide = !filtroNivelActual || estudiante.nivel === filtroNivelActual;
                const textoCoincide = !busqueda ||
                    (estudiante.nombre || "").toLowerCase().includes(busqueda) ||
                    (estudiante.seccion || "").toLowerCase().includes(busqueda) ||
                    tipoTraducido.toLowerCase().includes(busqueda) ||
                    (estudiante.nivel || "").toLowerCase().includes(busqueda) ||
                    (estudiante.cedula || "").toString().toLowerCase().includes(busqueda);
                return nivelCoincide && textoCoincide;
            });
            let filas = "";
            if (estudiantesVisibles.length === 0) {
                filas = `<tr><td colspan="6" class="no-results">${trad.tablaSinResultados}</td></tr>`;
            }
            estudiantesVisibles.forEach(estudiante => {
                const index = estudiantes.indexOf(estudiante);
                        const tipoTraducido = estudiante.tipo === "Becado" ? trad.formTipoBecado : trad.formTipoPaga;
                        const nivelTraducido = estudiante.nivel || "N/A";
                        const puedeEliminar = usuarioActual && usuarioActual.rol && usuarioActual.rol.toLowerCase() === "admin";
                        filas += `
                    <tr>
                        <td><div style="display: flex; align-items: center; gap: 8px;">${estudiante.foto ? `<img src="${estudiante.foto}" alt="" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">` : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; flex-shrink: 0;"><i class="fas fa-user"></i></div>`}<span>${estudiante.nombre}</span></div></td>
                        <td>${estudiante.seccion}</td>
                        <td>${nivelTraducido}</td>
                        <td>${tipoTraducido}</td>
                        <td>${estudiante.cedula}</td>
                        <td>
                            <button class="table-btn edit-btn" onclick="editarEstudiante(${index})" title="${trad.btnEditar}">
                                <i class="fas fa-pen"></i>
                            </button>
                            ${puedeEliminar ? `
                                    <button class="table-btn delete-btn" onclick="eliminarEstudiante('${estudiante.id}')" title="${trad.btnEliminar}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });

            const chips = `
                <button class="nivel-chip ${filtroNivelActual === "" ? "active" : ""}" onclick="seleccionarNivel('')">
                    <span class="chip-dot" style="background: var(--text-tertiary);"></span>
                    ${trad.todosNiveles || "Todos"}
                    <span class="chip-count">${estudiantes.length}</span>
                </button>
                ${niveles.map(n => `
                <button class="nivel-chip ${filtroNivelActual === n ? "active" : ""}" onclick="seleccionarNivel('${n}')">
                    <span class="chip-dot" style="background: ${getColorPorNivelSolido(n)};"></span>
                    ${n}
                    <span class="chip-count">${estudiantes.filter(e => e.nivel === n).length}</span>
                </button>`).join("")}
            `;

            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.estudiantesTitle}</h1>
                <div class="student-header">
                    <input type="text" placeholder="${trad.btnBuscar}" class="search-box" oninput="filtrarEstudiantes(this.value)">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="add-btn" onclick="abrirImportarCSV()" style="background: var(--bg-tertiary); border: 1px solid var(--border-color);">
                            <i class="fas fa-file-import"></i>
                            Importar CSV
                        </button>
                        <button class="add-btn" onclick="abrirFormularioEstudiante()">
                            <i class="fas fa-user-plus"></i>
                            ${trad.btnAgregar}
                        </button>
                    </div>
                </div>
                <div class="nivel-filtro">${chips}</div>
                <div class="student-container">
                    <table class="student-table">
                        <thead>
                            <tr>
                                <th>${trad.tablaNombre}</th>
                                <th>${trad.tablaSeccion}</th>
                                <th>${trad.tablaNivel}</th>
                                <th>${trad.tablaTipo}</th>
                                <th>${trad.tablaQR}</th>
                                <th>${trad.tablaAcciones}</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyEstudiantes">
                            ${filas}
                        </tbody>
                    </table>
                </div>
            `;
            const inputBusqueda = document.querySelector(".search-box");
            if (inputBusqueda) inputBusqueda.value = textoBusquedaActual;
        }


        // Filtra la vista de estudiantes por nivel seleccionado
        function seleccionarNivel(nivel) {
            const inputBusqueda = document.querySelector(".search-box");
            if (inputBusqueda) textoBusquedaActual = inputBusqueda.value;
            filtroNivelActual = nivel || "";
            mostrarEstudiantes();
        }


// Función para filtrar estudiantes
        function filtrarEstudiantes(textoBusqueda) {
            textoBusquedaActual = textoBusqueda;
            const trad = traducciones[configuracion.idioma];
            const busqueda = textoBusqueda.toLowerCase();
            const tbody = document.getElementById("tbodyEstudiantes");
            if (!tbody) return;

            const estudiantesFiltrados = estudiantes.filter(estudiante => {
                const tipoTraducido = estudiante.tipo === "Becado" ? trad.formTipoBecado : trad.formTipoPaga;
                const nivelCoincide = !filtroNivelActual || estudiante.nivel === filtroNivelActual;
                return nivelCoincide && (
                    (estudiante.nombre || "").toLowerCase().includes(busqueda) ||
                    (estudiante.seccion || "").toLowerCase().includes(busqueda) ||
                    tipoTraducido.toLowerCase().includes(busqueda) ||
                    (estudiante.nivel || "").toLowerCase().includes(busqueda) ||
                    (estudiante.cedula || "").toString().toLowerCase().includes(busqueda)
                );
            });

            let filas = "";
            if (estudiantesFiltrados.length === 0) {
                filas = `<tr><td colspan="6" class="no-results">${trad.tablaSinResultados}</td></tr>`;
            } else {
                estudiantesFiltrados.forEach((estudiante) => {
                    const index = estudiantes.indexOf(estudiante);
                    const tipoTraducido = estudiante.tipo === "Becado" ? trad.formTipoBecado : trad.formTipoPaga;
                    const nivelTraducido = estudiante.nivel || "N/A";
                    const puedeEliminar = usuarioActual && usuarioActual.rol && usuarioActual.rol.toLowerCase() === "admin";
                    filas += `
                        <tr>
                            <td><div style="display: flex; align-items: center; gap: 8px;">${estudiante.foto ? `<img src="${estudiante.foto}" alt="" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">` : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; flex-shrink: 0;"><i class="fas fa-user"></i></div>`}<span>${estudiante.nombre}</span></div></td>
                            <td>${estudiante.seccion}</td>
                            <td>${nivelTraducido}</td>
                            <td>${tipoTraducido}</td>
                            <td>${estudiante.cedula}</td>
                            <td>
                                <button class="table-btn edit-btn" onclick="editarEstudiante(${index})" title="${trad.btnEditar}">
                                    <i class="fas fa-pen"></i>
                                </button>
                                ${puedeEliminar ? `
                                <button class="table-btn delete-btn" onclick="eliminarEstudiante('${estudiante.id}')" title="${trad.btnEliminar}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `;
                });
            }
            tbody.innerHTML = filas;
        }


        // Función para abrir el formulario de estudiante
        function abrirFormularioEstudiante() {
            const trad = traducciones[configuracion.idioma];
            indiceEditar = -1;
            document.getElementById("formTitle").textContent = trad.formTitle;
            document.getElementById("nombre").value = "";
            document.getElementById("seccion").value = "";
            document.getElementById("tipo").value = "Becado";
            document.getElementById("nivel").value = "7mo";
            document.getElementById("formEstudiante").style.display = "flex";
            document.getElementById("cedula").value = "";
            document.getElementById("estudianteCorreo").value = "";
            document.getElementById("estudianteCorreo").disabled = false;
            document.getElementById("estudianteClave").value = "";
            document.getElementById("formClaveGrupo").style.display = "";
            fotoTemp = "";
            document.getElementById("fotoUrl").value = "";
            document.getElementById("fotoInput").value = "";
            mostrarFotoPreview("");
        }


        // Función para cerrar el formulario
        function cerrarFormulario() {
            document.getElementById("formEstudiante").style.display = "none";
        }


        // Muestra u oculta la vista previa de la foto en el formulario
        function mostrarFotoPreview(foto) {
            const preview = document.getElementById("fotoPreview");
            const quitarBtn = document.getElementById("formFotoQuitarBtn");
            if (!foto) {
                if (preview) preview.style.display = "none";
                if (quitarBtn) quitarBtn.style.display = "none";
                return;
            }
            preview.src = foto;
            preview.style.display = "block";
            if (quitarBtn) quitarBtn.style.display = "inline-block";
        }


        // Redimensiona la foto seleccionada y la guarda como imagen base64 (se guarda en el estudiante)
        function procesarFotoSeleccionada(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const max = 200;
                    let w = img.width;
                    let h = img.height;
                    if (w > h && w > max) { h = h * max / w; w = max; }
                    else if (h >= w && h > max) { w = w * max / h; h = max; }
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(w));
                    canvas.height = Math.max(1, Math.round(h));
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                    fotoTemp = canvas.toDataURL("image/jpeg", 0.8);
                    mostrarFotoPreview(fotoTemp);
                };
                img.onerror = () => {
                    mostrarNotificacion(traducciones[configuracion.idioma].notificacionError + ": imagen inválida", "error");
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }


        // Usa una URL de foto pegada por el usuario
        function fotoDesdeUrl() {
            const url = document.getElementById("fotoUrl").value.trim();
            if (url) {
                fotoTemp = url;
                mostrarFotoPreview(url);
            }
        }


        // Quita la foto del estudiante
        function quitarFoto() {
            fotoTemp = "";
            document.getElementById("fotoUrl").value = "";
            document.getElementById("fotoInput").value = "";
            mostrarFotoPreview("");
        }


        // Función para guardar estudiante
        function guardarEstudiante() {
            const trad = traducciones[configuracion.idioma];
            const nombre = document.getElementById("nombre").value.trim();
            const seccion = document.getElementById("seccion").value.trim();
            const cedula = document.getElementById("cedula").value.trim();
            const tipo = document.getElementById("tipo").value;
            const nivel = document.getElementById("nivel").value;
            const correo = (document.getElementById("estudianteCorreo").value || "").trim();
            const clave = document.getElementById("estudianteClave").value || "";
            const enEdicion = indiceEditar !== -1;
            const estudianteActual = enEdicion ? estudiantes[indiceEditar] : null;
            const yaTieneCuenta = !!(estudianteActual && estudianteActual.uid);

            if (!nombre || !seccion || !cedula || !nivel) {
                mostrarNotificacion(trad.notificacionCamposObligatorios, "error");
                return;
            }

            // La cuenta del portal es OPCIONAL: si se dejan correo y
            // contraseña vacíos, el estudiante puede registrarse por sí
            // mismo desde el portal ComeID Estudiantes.
            const deseaCuenta = !yaTieneCuenta && (correo || clave);
            if (deseaCuenta && (!correo || !clave)) {
                mostrarNotificacion(trad.formCorreoOpcional || "Indica correo y contraseña para crear la cuenta, o déjalos vacíos para que el estudiante se registre solo", "error");
                return;
            }

            if (deseaCuenta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                mostrarNotificacion(trad.notificacionCorreoInvalido || "El correo ingresado no es válido", "error");
                return;
            }

            if (deseaCuenta && clave.length < 6) {
                mostrarNotificacion(trad.notificacionClaveCorta || "La contraseña debe tener al menos 6 caracteres", "error");
                return;
            }

            const existeCedula = estudiantes.some(
                (e, i) => (e.cedula === cedula) && i !== indiceEditar
            );

            if (existeCedula) {
                mostrarNotificacion(trad.notificacionCedulaExistente, "error");
                return;
            }

            mostrarLoading();

            const contenidoQR = `${limpiarTextoQR(nombre)}|${cedula}|${limpiarTextoQR(seccion)}|${nivel}|${tipo === "Becado" ? "B" : "P"}`;

            if (indiceEditar === -1) {
                // Opcional: crea la cuenta del estudiante en Firebase Auth mediante el
                // endpoint público signUp (NO cambia la sesión del admin). Si se dejan
                // correo/contraseña vacíos, el estudiante se registra por su cuenta.
                const crearCuenta = (correo && clave)
                    ? crearCuentaEstudiante(correo, clave).then(datos => ({ uid: datos.uid, correo }))
                    : Promise.resolve({ uid: "", correo: "" });

                crearCuenta.then(extra => {
                    // Un solo lote: crea el estudiante y su perfil de portal juntos
                    // (una sola ida a la red en vez de dos).
                    const batch = db.batch();
                    const refEst = db.collection("estudiantes").doc();
                    batch.set(refEst, {
                        nombre,
                        seccion,
                        cedula,
                        tipo,
                        nivel,
                        foto: fotoTemp,
                        qr: contenidoQR,
                        correo: extra.correo,
                        uid: extra.uid,
                        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    if (extra.uid) {
                        batch.set(db.collection("usuarios").doc(extra.uid), {
                            rol: "estudiante",
                            nombre,
                            correo,
                            cedula,
                            estudiantesId: refEst.id,
                            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                    return batch.commit();
                }).then(() => {
                    ocultarLoading();
                    mostrarNotificacion(trad.notificacionEstudianteGuardado);
                    cerrarFormulario();
                    cargarEstudiantes();
                }).catch(error => {
                    ocultarLoading();
                    mostrarNotificacion(trad.notificacionError + ": " + (traducirErrorAuth(error) || error.message), "error");
                    console.error("Error al crear cuenta o estudiante: ", error);
                });
            } else {
                const estudiante = estudiantes[indiceEditar];
                const datosCambiaron = estudiante.nombre !== nombre ||
                    estudiante.seccion !== seccion ||
                    estudiante.cedula !== cedula ||
                    estudiante.tipo !== tipo ||
                    estudiante.nivel !== nivel;
                const actualizacion = {
                    nombre,
                    seccion,
                    cedula,
                    tipo,
                    nivel,
                    foto: fotoTemp,
                    qr: contenidoQR
                };
                if (datosCambiaron) {
                    actualizacion.qrGenerado = false;
                    actualizacion.qrFecha = null;
                }
                // Si el estudiante aún no tenía cuenta y el admin la indicó ahora,
                // se crea y se vincula (igual que al crearlo).
                const prep = yaTieneCuenta
                    ? Promise.resolve(estudiante.uid)
                    : ((correo && clave)
                        ? crearCuentaEstudiante(correo, clave).then(datos => datos.uid)
                        : Promise.resolve(""));
                prep.then(uid => {
                    if (uid) {
                        actualizacion.uid = uid;
                        actualizacion.correo = correo;
                    }
                    // Un solo lote: actualiza al estudiante y (si aplica) crea/sincroniza su portal.
                    const batch = db.batch();
                    batch.update(db.collection("estudiantes").doc(estudiante.id), actualizacion);
                    if (uid) {
                        batch.set(db.collection("usuarios").doc(uid), {
                            rol: "estudiante",
                            nombre,
                            correo,
                            cedula,
                            estudiantesId: estudiante.id,
                            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                    if (estudiante.uid && estudiante.uid !== uid) {
                        // Mantiene al día el perfil del portal (no crítico: no bloquea el lote).
                        db.collection("usuarios").doc(estudiante.uid).update({
                            nombre,
                            cedula
                        }).catch(error => {
                            console.warn("No se pudo sincronizar el perfil del portal: ", error);
                        });
                    }
                    return batch.commit();
                }).then(() => {
                    ocultarLoading();
                    mostrarNotificacion(trad.notificacionEstudianteActualizado);
                    cerrarFormulario();
                    cargarEstudiantes();
                }).catch(error => {
                    ocultarLoading();
                    mostrarNotificacion(trad.notificacionError + ": " + (traducirErrorAuth(error) || error.message), "error");
                    console.error("Error al actualizar: ", error);
                });
            }
        }


        // Convierte códigos de error de Firebase Auth a mensajes amigables
        function traducirErrorAuth(error) {
            const mapa = {
                "auth/email-already-in-use": "Ese correo ya está en uso por otra cuenta",
                "auth/invalid-email": "El correo ingresado no es válido",
                "auth/weak-password": "La contraseña es demasiado débil (mínimo 6 caracteres)",
                "auth/operation-not-allowed": "No se permite crear cuentas con correo y contraseña"
            };
            return (error && mapa[error.code]) || null;
        }


        // Crea la cuenta de Firebase Auth del estudiante mediante el endpoint
        // público signUp. A diferencia de createUserWithEmailAndPassword, esto
        // NO cambia la sesión actual (el admin sigue logueado en ComeID).
        function crearCuentaEstudiante(correo, clave) {
            const url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" +
                encodeURIComponent(firebaseConfig.apiKey);
            return fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correo, password: clave, returnSecureToken: true })
            }).then(resp => resp.json()).then(datos => {
                if (datos.error) {
                    const codigo = "auth/" + String(datos.error.message || "").toLowerCase().replace(/\s+/g, "-");
                    const error = new Error(datos.error.message || "Error de autenticación");
                    error.code = codigo;
                    throw error;
                }
                return { uid: datos.localId, email: datos.email };
            });
        }


        // Función para editar estudiante
        function editarEstudiante(index) {
            const trad = traducciones[configuracion.idioma];
            const puedeEditar = usuarioActual && usuarioActual.rol && (usuarioActual.rol.toLowerCase() === "admin" || usuarioActual.rol.toLowerCase() === "profesor");
            if (!puedeEditar) {
                mostrarNotificacion(trad.notificacionSinPermiso, "error");
                return;
            }
            indiceEditar = index;
            const estudiante = estudiantes[index];
            document.getElementById("formTitle").textContent = trad.formTitleEditar || trad.formTitle;
            document.getElementById("nombre").value = estudiante.nombre;
            document.getElementById("seccion").value = estudiante.seccion;
            document.getElementById("tipo").value = estudiante.tipo;
            document.getElementById("nivel").value = estudiante.nivel || "7mo";
            document.getElementById("formEstudiante").style.display = "flex";
            document.getElementById("cedula").value = estudiante.cedula || "";
            const correoInput = document.getElementById("estudianteCorreo");
            const claveGrupo = document.getElementById("formClaveGrupo");
            if (estudiante.uid) {
                correoInput.value = estudiante.correo || "";
                correoInput.disabled = true;
                if (claveGrupo) claveGrupo.style.display = "none";
            } else {
                correoInput.value = "";
                correoInput.disabled = false;
                if (claveGrupo) claveGrupo.style.display = "";
            }
            if (claveGrupo) document.getElementById("estudianteClave").value = "";
            fotoTemp = estudiante.foto || "";
            document.getElementById("fotoUrl").value = (fotoTemp && fotoTemp.startsWith("http")) ? fotoTemp : "";
            document.getElementById("fotoInput").value = "";
            mostrarFotoPreview(fotoTemp);
        }


        // Función para eliminar estudiante
        function eliminarEstudiante(id) {
            const trad = traducciones[configuracion.idioma];
            const puedeEliminar = usuarioActual && usuarioActual.rol && usuarioActual.rol.toLowerCase() === "admin";
            if (!puedeEliminar) {
                mostrarNotificacion(trad.notificacionSinPermiso, "error");
                return;
            }
            if (!id) {
                mostrarNotificacion(trad.notificacionError + ": ID inválido", "error");
                return;
            }
            if (confirm(trad.btnEliminar + "?")) {
                mostrarLoading();
                db.collection("estudiantes").doc(id).delete().then(() => {
                    ocultarLoading();
                    mostrarNotificacion(trad.notificacionEstudianteEliminado);
                    cargarEstudiantes();
                }).catch(error => {
                    ocultarLoading();
                    mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                    console.error("Error al eliminar: ", error);
                });
            }
        }


        // Cédula actualmente mostrada en el modal QR (para regenerar la credencial)
        let cedulaQRActual = "";


        // Función para mostrar el modal QR
        function mostrarQR() {
            const trad = traducciones[configuracion.idioma];
            cedulaQRActual = "";
            document.getElementById("modalQR").style.display = "flex";
            document.getElementById("cedulaQR").value = "";
            document.getElementById("codigoQR").innerHTML = "";
            document.getElementById("cedulaQR").placeholder = trad.notificacionCedulaVacia || "Ingrese una cédula";
        }


        // Genera la credencial digital del estudiante (tarjeta vertical con QR)
        async function generarQR() {
            const trad = traducciones[configuracion.idioma];
            const cedula = document.getElementById("cedulaQR").value.trim();
            if (!cedula) {
                mostrarNotificacion(trad.notificacionCedulaVacia || "Ingrese una cédula", "error");
                return;
            }
            const estudiante = estudiantes.find(e => e.cedula === cedula);
            if (!estudiante) {
                mostrarNotificacion((trad.notificacionEstudianteNoEncontrado || "No se encontró el estudiante con cédula: ") + cedula, "error");
                return;
            }
            cedulaQRActual = cedula;

            const canvas = await dibujarCredencial(estudiante, trad);

            const qrCodeDiv = document.getElementById("codigoQR");
            qrCodeDiv.innerHTML = "";
            const contenedor = document.createElement("div");
            contenedor.style.cssText = "width:100%; text-align:center;";
            contenedor.appendChild(canvas);

            // Permitir arrastrar y soltar una foto sobre la credencial
            canvas.style.cursor = "pointer";
            canvas.addEventListener("dragover", (e) => {
                e.preventDefault();
                canvas.classList.add("credencial-drop");
            });
            canvas.addEventListener("dragleave", () => canvas.classList.remove("credencial-drop"));
            canvas.addEventListener("drop", soltarFotoCredencial);

            const acciones = document.createElement("div");
            acciones.className = "credencial-acciones";
            acciones.innerHTML = `
                <button type="button" class="qr-share-btn" onclick="descargarCredencialPNG()"><i class="fas fa-image" style="color: var(--accent-color);"></i> <span>${trad.modalQRPngBtn}</span></button>
                <button type="button" class="qr-share-btn" onclick="descargarCredencialPDF()"><i class="fas fa-file-pdf" style="color: #dc3545;"></i> <span>${trad.modalQRPdfBtn}</span></button>
                <button type="button" class="qr-share-btn" onclick="imprimirCredencial()"><i class="fas fa-print" style="color: var(--text-secondary);"></i> <span>${trad.modalQRImprimirBtn}</span></button>
                <button type="button" class="qr-share-btn" onclick="compartirQR('whatsapp')"><i class="fab fa-whatsapp" style="color: #25d366;"></i> <span>WhatsApp</span></button>
                <button type="button" class="qr-share-btn" onclick="compartirQR('email')"><i class="fas fa-envelope" style="color: #f59e0b;"></i> <span>${trad.qrEmailBtn}</span></button>
            `;
            contenedor.appendChild(acciones);

            const cambiarFoto = document.createElement("button");
            cambiarFoto.type = "button";
            cambiarFoto.className = "credencial-cambiar-foto";
            cambiarFoto.onclick = () => { const input = document.getElementById("cambioFotoInput"); if (input) input.click(); };
            cambiarFoto.innerHTML = `<i class="fas fa-camera"></i> ${trad.modalQRCambiarFotoBtn}`;
            contenedor.appendChild(cambiarFoto);

            const hint = document.createElement("div");
            hint.className = "credencial-drop-hint";
            hint.innerHTML = `<i class="fas fa-arrow-down"></i> ${trad.credencialDropHint}`;
            contenedor.appendChild(hint);

            qrCodeDiv.appendChild(contenedor);

            // Guardar el estado del QR en Firestore para no tener que regenerarlo
            db.collection("estudiantes").doc(estudiante.id).update({
                qrGenerado: true,
                qrFecha: new Date().toISOString()
            }).then(() => {
                estudiante.qrGenerado = true;
                estudiante.qrFecha = new Date().toISOString();
            }).catch(err => {
                console.error("Error al guardar el estado del QR: ", err);
            });
        }


        // Devuelve el estudiante cuya credencial está visible en el modal
        function obtenerEstudianteQRActual() {
            if (!cedulaQRActual) return null;
            return estudiantes.find(e => e.cedula === cedulaQRActual) || null;
        }


        // Descarga la credencial como imagen PNG
        function descargarCredencialPNG() {
            const canvas = document.querySelector("#codigoQR canvas");
            const estudiante = obtenerEstudianteQRActual();
            if (!canvas || !estudiante) return;
            const trad = traducciones[configuracion.idioma];
            try {
                const url = canvas.toDataURL("image/png");
                const nombreArchivo = "ComeID_" + limpiarTextoQR(estudiante.nombre) + "_" + estudiante.cedula + ".png";
                const a = document.createElement("a");
                a.href = url;
                a.download = nombreArchivo;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } catch (error) {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar la credencial: ", error);
            }
        }


        // Descarga la credencial como PDF (tamaño de tarjeta 60x90 mm)
        async function descargarCredencialPDF() {
            const canvas = document.querySelector("#codigoQR canvas");
            const estudiante = obtenerEstudianteQRActual();
            if (!canvas || !estudiante) return;
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_JSPDF);
                const { jsPDF } = window.jspdf;
                const img = canvas.toDataURL("image/png");
                const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [60, 90] });
                doc.addImage(img, "PNG", 0, 0, 60, 90);
                doc.save("ComeID_" + limpiarTextoQR(estudiante.nombre) + "_" + estudiante.cedula + ".pdf");
            } catch (error) {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar la credencial PDF: ", error);
            }
        }


        // Abre la credencial en una ventana para imprimirla
        function imprimirCredencial() {
            const canvas = document.querySelector("#codigoQR canvas");
            const estudiante = obtenerEstudianteQRActual();
            if (!canvas || !estudiante) return;
            const trad = traducciones[configuracion.idioma];
            try {
                const ventana = window.open("", "_blank");
                if (!ventana) {
                    descargarCredencialPNG();
                    return;
                }
                ventana.document.write(
                    `<html><head><title>ComeID - ${limpiarTextoQR(estudiante.nombre)}</title>` +
                    `<style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#e5e7eb;font-family:'Segoe UI',sans-serif;}` +
                    `img{max-height:96vh;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.3);}</style></head>` +
                    `<body><img src="${canvas.toDataURL("image/png")}" onload="setTimeout(function(){window.print();},400);"></body></html>`
                );
                ventana.document.close();
                ventana.focus();
            } catch (error) {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al imprimir la credencial: ", error);
            }
        }


        // Procesa un archivo de imagen como nueva foto del estudiante (input o drag & drop)
        function procesarFotoCredencial(archivo) {
            const estudiante = obtenerEstudianteQRActual();
            if (!estudiante || !archivo) return;
            const trad = traducciones[configuracion.idioma];
            if (!/^image\//.test(archivo.type)) {
                mostrarNotificacion(trad.notificacionError + ": imagen inválida", "error");
                return;
            }
            const puedeEditar = usuarioActual && usuarioActual.rol && (usuarioActual.rol.toLowerCase() === "admin" || usuarioActual.rol.toLowerCase() === "profesor");
            if (!puedeEditar) {
                mostrarNotificacion(trad.notificacionSinPermiso, "error");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const max = 300;
                    let w = img.width;
                    let h = img.height;
                    if (w > h && w > max) { h = h * max / w; w = max; }
                    else if (h >= w && h > max) { w = w * max / h; h = max; }
                    const canvasTemp = document.createElement("canvas");
                    canvasTemp.width = Math.max(1, Math.round(w));
                    canvasTemp.height = Math.max(1, Math.round(h));
                    canvasTemp.getContext("2d").drawImage(img, 0, 0, canvasTemp.width, canvasTemp.height);
                    const nuevaFoto = canvasTemp.toDataURL("image/jpeg", 0.85);
                    estudiante.foto = nuevaFoto;
                    mostrarLoading();
                    db.collection("estudiantes").doc(estudiante.id).update({ foto: nuevaFoto }).then(() => {
                        ocultarLoading();
                        mostrarNotificacion(trad.notificacionEstudianteActualizado);
                        generarQR();
                    }).catch(error => {
                        ocultarLoading();
                        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                    });
                };
                img.onerror = () => mostrarNotificacion(trad.notificacionError + ": imagen inválida", "error");
                img.src = e.target.result;
            };
            reader.readAsDataURL(archivo);
        }


        // Cambia la foto del estudiante desde el botón del modal
        function cambiarFotoCredencial() {
            const input = document.getElementById("cambioFotoInput");
            if (!input || !input.files || !input.files[0]) return;
            const archivo = input.files[0];
            input.value = "";
            procesarFotoCredencial(archivo);
        }


        // Coloca una foto arrastrada sobre la credencial (drag & drop)
        function soltarFotoCredencial(evento) {
            evento.preventDefault();
            evento.stopPropagation();
            const canvas = document.querySelector("#codigoQR canvas");
            if (canvas) canvas.classList.remove("credencial-drop");
            if (!evento.dataTransfer || !evento.dataTransfer.files || !evento.dataTransfer.files[0]) return;
            procesarFotoCredencial(evento.dataTransfer.files[0]);
        }

        // Función para cerrar QR
        function cerrarQR() {
            document.getElementById("modalQR").style.display = "none";
        }


        // Comparte la credencial por WhatsApp, correo o la descarga
        async function compartirQR(medio) {
            const trad = traducciones[configuracion.idioma];
            const canvas = document.querySelector("#codigoQR canvas");
            const estudiante = obtenerEstudianteQRActual();
            if (!canvas || !estudiante) {
                mostrarNotificacion(trad.notificacionCedulaVacia || "Genera primero la credencial del estudiante", "error");
                return;
            }
            const nombreArchivo = "ComeID_" + limpiarTextoQR(estudiante.nombre) + "_" + estudiante.cedula + ".png";
            const mensaje =
                (trad.qrShareMensaje || "ComeID - Tu código QR del comedor") + "\n" +
                (trad.tablaNombre || "Nombre") + ": " + estudiante.nombre + "\n" +
                (trad.tablaQR || "Cédula") + ": " + estudiante.cedula + "\n" +
                (trad.tablaSeccion || "Sección") + ": " + (estudiante.seccion || "N/A") + "\n" +
                (trad.qrShareInstruccion || "Muestra este código al pasar por el comedor.");

            try {
                const blob = await (await fetch(canvas.toDataURL("image/png"))).blob();
                const archivo = new File([blob], nombreArchivo, { type: "image/png" });

                // En celulares: la API de compartir adjunta la imagen directo a WhatsApp o al correo
                if (medio !== "descargar" && navigator.share && (!navigator.canShare || navigator.canShare({ files: [archivo] }))) {
                    try {
                        await navigator.share({ files: [archivo], title: "ComeID", text: mensaje });
                        return;
                    } catch (e) {
                        if (e && e.name === "AbortError") return;
                    }
                }

                // Descargar la imagen (también es el respaldo cuando no hay API de compartir)
                const url = URL.createObjectURL(archivo);
                const a = document.createElement("a");
                a.href = url;
                a.download = nombreArchivo;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);

                if (medio === "whatsapp") {
                    window.open("https://wa.me/?text=" + encodeURIComponent(mensaje + "\n\n(" + (trad.qrShareAdjuntar || "Adjunta la imagen del código QR descargada") + ")"), "_blank");
                } else if (medio === "email") {
                    window.location.href = "mailto:?subject=" + encodeURIComponent(trad.qrShareMensaje || "ComeID - Tu código QR del comedor") + "&body=" + encodeURIComponent(mensaje + "\n\n(" + (trad.qrShareAdjuntar || "Adjunta la imagen del código QR descargada") + ")");
                }
            } catch (error) {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al compartir QR: ", error);
            }
        }


        // Dibuja la credencial digital (tarjeta vertical 600x900) y devuelve el canvas
        async function dibujarCredencial(estudiante, trad) {
            const W = 600;
            const H = 900;
            const headerAltura = 580;
            const colorAzul = "#1b2f7a";
            const colorAzulOscuro = "#0e1b4d";

            const canvas = document.createElement("canvas");
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext("2d");

            const logoImg = await cargarImagen("logo.png", 1500);
            const fotoImg = estudiante.foto ? await cargarImagen(estudiante.foto, 4000, true) : null;

            // Recortar todo el dibujo a la forma redondeada de la tarjeta
            redondearRuta(ctx, 0, 0, W, H, 28);
            ctx.save();
            ctx.clip();

            // Cabecera azul oscuro (gradiente)
            const grad = ctx.createLinearGradient(0, 0, 0, headerAltura);
            grad.addColorStop(0, colorAzul);
            grad.addColorStop(1, colorAzulOscuro);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, headerAltura);

            // ---- QR (arriba, en la cabecera azul) ----
            const tipoQR = estudiante.tipo === "Becado" ? "B" : "P";
            const contenidoQR = limpiarTextoQR(estudiante.nombre) + "|" + estudiante.cedula + "|" + limpiarTextoQR(estudiante.seccion) + "|" + (estudiante.nivel || "N/A") + "|" + tipoQR;
            const qrCanvas = crearCanvasQR(contenidoQR, 8, 5);
            const qrTam = 270;
            const qrX = (W - qrTam) / 2;
            const qrY = 30;
            redondearRuta(ctx, qrX - 10, qrY - 10, qrTam + 20, qrTam + 20, 18);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.drawImage(qrCanvas, qrX, qrY, qrTam, qrTam);

            // ---- NOMBRE ----
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#ffffff";
            const nombre = String(estudiante.nombre || "");
            const nombreY = qrY + qrTam + 24;
            ctx.font = "bold 44px 'Segoe UI', sans-serif";
            const lineasNombre = envolverTexto(ctx, nombre, 480, "bold 44px 'Segoe UI', sans-serif").slice(0, 2);
            lineasNombre.forEach((linea, i) => {
                ctx.fillText(linea, W / 2, nombreY + i * 54);
            });

            // ---- DATOS SECUNDARIOS ----
            const nivelDisplay = estudiante.nivel || "N/A";
            const tipoDisplay = estudiante.tipo === "Becado" ? (trad.formTipoBecado || "Becado") : (trad.formTipoPaga || "Paga");
            const lineaDatos1 = (trad.formSeccionLabel || "Sección:") + " " + (estudiante.seccion || "N/A");
            const lineaDatos2 = (trad.formNivelLabel || "Nivel:") + " " + nivelDisplay + "  •  " + tipoDisplay;
            const datosY = nombreY + lineasNombre.length * 54 + 12;
            ctx.font = "500 27px 'Segoe UI', sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fillText(lineaDatos1, W / 2, datosY);
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillText(lineaDatos2, W / 2, datosY + 40);

            // ---- Pie de la cabecera (rellena el espacio) ----
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "600 15px 'Segoe UI', sans-serif";
            ctx.fillText(trad.credencialSubtitle || "CREDENCIAL ESTUDIANTIL", W / 2, headerAltura - 42);

            // ---- PARTE INFERIOR BLANCA ----
            const parteBajaY = headerAltura;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, parteBajaY, W, H - parteBajaY);
            ctx.fillStyle = "#e6e9f2";
            ctx.fillRect(0, parteBajaY, W, 3);

            // Logo ComeID (izquierda)
            const logoBox = { x: 80, y: parteBajaY + 55, w: 180, h: 180 };
            if (logoImg) {
                dibujarImagenCentrada(ctx, logoImg, logoBox.x, logoBox.y, logoBox.w, logoBox.h);
            } else {
                dibujarLogoRespaldo(ctx, logoBox.x, logoBox.y, logoBox.w, logoBox.h, colorAzul);
            }

            // ---- FOTO (derecha, donde antes estaba el QR) ----
            const fotoTam = 230;
            const fotoX = 290;
            const fotoY = parteBajaY + (H - parteBajaY - fotoTam) / 2;
            redondearRuta(ctx, fotoX - 6, fotoY - 6, fotoTam + 12, fotoTam + 12, 26);
            ctx.fillStyle = colorAzul;
            ctx.fill();
            redondearRuta(ctx, fotoX, fotoY, fotoTam, fotoTam, 20);
            ctx.save();
            ctx.clip();
            if (fotoImg) {
                dibujarImagenCubierta(ctx, fotoImg, fotoX, fotoY, fotoTam, fotoTam);
            } else {
                ctx.fillStyle = "#d7deff";
                ctx.fillRect(fotoX, fotoY, fotoTam, fotoTam);
                ctx.fillStyle = "#5d6ea8";
                ctx.font = "bold 96px 'Segoe UI', sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const inicial = (estudiante.nombre || "?").trim().charAt(0).toUpperCase() || "?";
                ctx.fillText(inicial, fotoX + fotoTam / 2, fotoY + fotoTam / 2 + 6);
            }
            ctx.restore();

            ctx.restore();
            return canvas;
        }


        // Carga una imagen y resuelve cuando está lista (null si falla o expira el tiempo)
        function cargarImagen(src, timeout, usarCrossOrigin) {
            return new Promise((resolve) => {
                const img = new Image();
                let resuelto = false;
                const terminar = (valor) => {
                    if (!resuelto) {
                        resuelto = true;
                        resolve(valor);
                    }
                };
                img.onload = () => terminar(img);
                img.onerror = () => terminar(null);
                if (usarCrossOrigin && /^https?:/i.test(src)) img.crossOrigin = "anonymous";
                img.src = src;
                setTimeout(() => terminar(img.complete && img.naturalWidth > 0 ? img : null), timeout || 3000);
            });
        }


        // Dibuja la imagen recortada para cubrir el área (como object-fit: cover)
        function dibujarImagenCubierta(ctx, img, x, y, w, h) {
            const escala = Math.max(w / img.width, h / img.height);
            const dw = img.width * escala;
            const dh = img.height * escala;
            const dx = x + (w - dw) / 2;
            const dy = y + (h - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
        }


        // Dibuja la imagen ajustada al área (como object-fit: contain)
        function dibujarImagenCentrada(ctx, img, x, y, w, h) {
            const escala = Math.min(w / img.width, h / img.height);
            const dw = img.width * escala;
            const dh = img.height * escala;
            const dx = x + (w - dw) / 2;
            const dy = y + (h - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
        }


        // Dibuja el respaldo del logo (badge "C" + texto ComeID)
        function dibujarLogoRespaldo(ctx, x, y, w, h, color) {
            const badge = 72;
            const badgeX = x + (w - badge) / 2;
            const badgeY = y + 8;
            redondearRuta(ctx, badgeX, badgeY, badge, badge, 18);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 46px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("C", badgeX + badge / 2, badgeY + badge / 2 + 4);
            ctx.font = "bold 30px 'Segoe UI', sans-serif";
            ctx.fillText("ComeID", badgeX + badge / 2, badgeY + badge + 34);
            ctx.fillStyle = "#7d89b8";
            ctx.font = "600 11px 'Segoe UI', sans-serif";
            ctx.fillText("CREDENCIAL ESTUDIANTIL", badgeX + badge / 2, badgeY + badge + 58);
        }


        // Crea un canvas con el QR (con zona blanca de seguridad)
        function crearCanvasQR(contenido, cellSize, margin) {
            const qr = qrcode(0, "L");
            qr.addData(contenido);
            qr.make();
            const count = qr.getModuleCount();
            const tam = (count + margin * 2) * cellSize;
            const cv = document.createElement("canvas");
            cv.width = tam;
            cv.height = tam;
            const ctx = cv.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, tam, tam);
            ctx.fillStyle = "#000000";
            for (let r = 0; r < count; r += 1) {
                for (let c = 0; c < count; c += 1) {
                    if (qr.isDark(r, c)) {
                        ctx.fillRect(c * cellSize + margin * cellSize, r * cellSize + margin * cellSize, cellSize, cellSize);
                    }
                }
            }
            return cv;
        }


        // Traza un rectángulo redondeado en el contexto de dibujo
        function redondearRuta(ctx, x, y, w, h, r) {
            const radio = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + radio, y);
            ctx.lineTo(x + w - radio, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radio);
            ctx.lineTo(x + w, y + h - radio);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radio, y + h);
            ctx.lineTo(x + radio, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radio);
            ctx.lineTo(x, y + radio);
            ctx.quadraticCurveTo(x, y, x + radio, y);
            ctx.closePath();
        }


        // Divide el texto en líneas que caben en el ancho máximo
        function envolverTexto(ctx, texto, maxAncho, fuente) {
            const palabras = String(texto).split(" ");
            const lineas = [];
            let linea = "";
            ctx.font = fuente;
            palabras.forEach((palabra) => {
                const prueba = linea ? linea + " " + palabra : palabra;
                if (ctx.measureText(prueba).width <= maxAncho) {
                    linea = prueba;
                } else {
                    if (linea) lineas.push(linea);
                    linea = palabra;
                }
            });
            if (linea) lineas.push(linea);
            return lineas;
        }


        // =============================================
        // IMPORTACIÓN MASIVA DE ESTUDIANTES (CSV)
        // =============================================

        function abrirImportarCSV() {
            const trad = traducciones[configuracion.idioma];
            const contenido = document.getElementById("contenido");
            contenido.innerHTML = `
                <h1 class="title">Importar estudiantes (CSV)</h1>
                <div class="panel" style="margin-top: 15px;">
                    <p style="color: var(--text-secondary); margin-bottom: 15px;">
                        Sube un archivo CSV con las columnas: <strong>nombre, cedula, seccion, nivel, tipo</strong> (Becado/Paga).<br>
                        Columnas opcionales: <strong>correo, clave</strong> (si se proveen, se crea la cuenta del estudiante).
                    </p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                        <label class="add-btn" style="cursor: pointer;">
                            <i class="fas fa-file-csv"></i> Seleccionar archivo
                            <input type="file" id="csvFileInput" accept=".csv" style="display: none;" onchange="previewCSV(this)">
                        </label>
                        <button class="add-btn" onclick="ejecutarImportarCSV()" id="btnImportarCSV" style="display: none;">
                            <i class="fas fa-upload"></i> Importar
                        </button>
                        <button class="add-btn" onclick="cargarEstudiantes()" style="background: var(--bg-tertiary); border: 1px solid var(--border-color);">
                            <i class="fas fa-arrow-left"></i> Cancelar
                        </button>
                    </div>
                    <div id="csvPreview" style="margin-top: 15px;"></div>
                    <div id="csvProgreso" style="margin-top: 15px; display: none;"></div>
                </div>
            `;
        }

        let csvDataGlobal = [];

        function previewCSV(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) {
                    document.getElementById("csvPreview").innerHTML = '<p style="color: #ef5350;">El archivo está vacío o no tiene filas de datos.</p>';
                    return;
                }
                const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
                csvDataGlobal = [];
                const errores = [];
                for (let i = 1; i < lines.length; i++) {
                    const vals = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
                    const fila = {};
                    headers.forEach((h, idx) => { fila[h] = vals[idx] || ""; });
                    if (!fila.nombre || !fila.cedula) {
                        errores.push(`Fila ${i + 1}: falta nombre o cédula`);
                        continue;
                    }
                    csvDataGlobal.push({
                        nombre: fila.nombre,
                        cedula: fila.cedula,
                        seccion: fila.seccion || "A",
                        nivel: fila.nivel || "7mo",
                        tipo: (fila.tipo || "Paga").toLowerCase().includes("bec") ? "Becado" : "Paga",
                        correo: fila.correo || "",
                        clave: fila.clave || ""
                    });
                }
                let html = `<p style="color: var(--text-primary);"><strong>${csvDataGlobal.length}</strong> estudiantes válidos encontrados.`;
                if (errores.length) html += ` <span style="color: #ef5350;">(${errores.length} errores omitidos)</span>`;
                html += "</p>";
                if (csvDataGlobal.length > 0) {
                    document.getElementById("btnImportarCSV").style.display = "inline-flex";
                    html += '<div style="overflow-x: auto; margin-top: 10px;"><table style="width: 100%; border-collapse: collapse; font-size: 13px;"><thead><tr>';
                    html += '<th style="text-align: left; padding: 8px; border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">Nombre</th>';
                    html += '<th style="text-align: left; padding: 8px; border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">Cédula</th>';
                    html += '<th style="text-align: left; padding: 8px; border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">Sección</th>';
                    html += '<th style="text-align: left; padding: 8px; border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">Nivel</th>';
                    html += '<th style="text-align: left; padding: 8px; border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">Tipo</th>';
                    html += '</tr></thead><tbody>';
                    csvDataGlobal.slice(0, 20).forEach(f => {
                        html += `<tr><td style="padding: 6px 8px; border-bottom: 1px solid var(--border-color);">${escaparHTML(f.nombre)}</td>`;
                        html += `<td style="padding: 6px 8px; border-bottom: 1px solid var(--border-color);">${escaparHTML(f.cedula)}</td>`;
                        html += `<td style="padding: 6px 8px; border-bottom: 1px solid var(--border-color);">${escaparHTML(f.seccion)}</td>`;
                        html += `<td style="padding: 6px 8px; border-bottom: 1px solid var(--border-color);">${escaparHTML(f.nivel)}</td>`;
                        html += `<td style="padding: 6px 8px; border-bottom: 1px solid var(--border-color);">${escaparHTML(f.tipo)}</td></tr>`;
                    });
                    if (csvDataGlobal.length > 20) html += `<tr><td colspan="5" style="padding: 8px; color: var(--text-secondary); text-align: center;">... y ${csvDataGlobal.length - 20} más</td></tr>`;
                    html += "</tbody></table></div>";
                }
                if (errores.length) {
                    html += '<div style="margin-top: 10px; max-height: 120px; overflow-y: auto;">';
                    errores.slice(0, 10).forEach(e => { html += `<p style="color: #ef5350; font-size: 12px; margin: 2px 0;">${e}</p>`; });
                    html += "</div>";
                }
                document.getElementById("csvPreview").innerHTML = html;
            };
            reader.readAsText(file);
        }

        function ejecutarImportarCSV() {
            if (!csvDataGlobal.length) return;
            const btn = document.getElementById("btnImportarCSV");
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
            const progDiv = document.getElementById("csvProgreso");
            progDiv.style.display = "block";
            let i = 0;
            let exitos = 0;
            let fallos = 0;

            function importarSiguiente() {
                if (i >= csvDataGlobal.length) {
                    progDiv.innerHTML = `<p style="color: var(--text-primary);"><strong>Importación completa:</strong> ${exitos} éxitos, ${fallos} fallos de ${csvDataGlobal.length} total.</p>`;
                    btn.innerHTML = '<i class="fas fa-check"></i> Finalizado';
                    btn.disabled = true;
                    cargarEstudiantes();
                    return;
                }
                const f = csvDataGlobal[i];
                const pct = Math.round(((i + 1) / csvDataGlobal.length) * 100);
                progDiv.innerHTML = `<p style="color: var(--text-secondary); font-size: 13px;">Importando ${i + 1}/${csvDataGlobal.length} (${pct}%) — ${escaparHTML(f.nombre)}</p>
                    <div style="width: 100%; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;"><div style="width: ${pct}%; height: 100%; background: var(--accent-color); transition: width 0.3s;"></div></div>`;

                const crearCuenta = (f.correo && f.clave)
                    ? crearCuentaEstudiante(f.correo, f.clave).then(datos => ({ uid: datos.uid, correo: f.correo }))
                    : Promise.resolve({ uid: "", correo: "" });

                crearCuenta.then(extra => {
                    const qr = `${limpiarTextoQR(f.nombre)}|${f.cedula}|${limpiarTextoQR(f.seccion)}|${f.nivel}|${f.tipo === "Becado" ? "B" : "P"}`;
                    return db.collection("estudiantes").add({
                        nombre: f.nombre,
                        seccion: f.seccion,
                        cedula: f.cedula,
                        tipo: f.tipo,
                        nivel: f.nivel,
                        foto: "",
                        qr: qr,
                        correo: extra.correo,
                        uid: extra.uid,
                        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(ref => {
                        if (!extra.uid) return Promise.resolve();
                        return db.collection("usuarios").doc(extra.uid).set({
                            rol: "estudiante", nombre: f.nombre, correo: f.correo,
                            cedula: f.cedula, estudiantesId: ref.id,
                            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                }).then(() => {
                    exitos++;
                    i++;
                    importarSiguiente();
                }).catch(() => {
                    fallos++;
                    i++;
                    importarSiguiente();
                });
            }
            importarSiguiente();
        }