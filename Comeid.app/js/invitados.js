// =============================================
// ComeID - Lista manual de invitados externos
// =============================================

        let invitadosHoyLista = [];


        // Carga los invitados de hoy y los guarda en invitadosHoyLista
        function cargarInvitadosHoy() {
            const hoy = new Date().toISOString().slice(0, 10);
            return db.collection("invitados")
                .where("fecha", "==", hoy)
                .get()
                .then(querySnapshot => {
                    invitadosHoyLista = [];
                    querySnapshot.forEach(doc => {
                        invitadosHoyLista.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    invitadosHoyLista.sort((a, b) => {
                        const ta = a.creadoEn && a.creadoEn.toDate ? a.creadoEn.toDate().getTime() : 0;
                        const tb = b.creadoEn && b.creadoEn.toDate ? b.creadoEn.toDate().getTime() : 0;
                        return (tb - ta) || String(b.id).localeCompare(String(a.id));
                    });
                    return invitadosHoyLista;
                })
                .catch(error => {
                    invitadosHoyLista = [];
                    console.error("Error al cargar invitados: ", error);
                    return invitadosHoyLista;
                });
        }


        // Muestra la vista de invitados externos del día
        function mostrarInvitados() {
            vistaActual = "invitados";
            const trad = traducciones[configuracion.idioma];
            const hoy = new Date().toISOString().slice(0, 10);
            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.invitadosTitle || "Invitados externos"}</h1>
                <p style="color: var(--text-secondary); margin-bottom: 15px;"><i class="fas fa-info-circle" style="margin-right: 6px;"></i>${trad.invitadosSubtitle || "Registra aquí a los invitados externos a quienes se les regala comida el día de hoy."}</p>

                <div class="panel" style="margin-top: 10px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 12px;">${trad.invitadosFormTitle || "Agregar invitado"}</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; align-items: end;">
                        <div>
                            <label>${trad.invitadosNombre || "Nombre"} *</label>
                            <input type="text" id="invitadoNombre" class="silla-buscar" placeholder="${trad.invitadosNombrePh || "Nombre del invitado"}">
                        </div>
                        <div>
                            <label>${trad.invitadosCedula || "Cédula"}</label>
                            <input type="text" id="invitadoCedula" class="silla-buscar" placeholder="${trad.invitadosCedulaPh || "Opcional"}">
                        </div>
                        <div>
                            <label>${trad.invitadosRaciones || "Raciones"}</label>
                            <input type="number" id="invitadoRaciones" class="silla-buscar" value="1" min="1">
                        </div>
                        <div>
                            <button class="save-config-btn" onclick="agregarInvitado()" style="background: #2b67ff; width: 100%;">
                                <i class="fas fa-user-plus"></i> ${trad.invitadosAgregarBtn || "Agregar"}
                            </button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 15px;">
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px;">
                        <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.invitadosPersonas || "Invitados hoy"}:</p>
                        <p style="color: var(--accent-color); font-size: 24px; font-weight: bold;" id="invitadosContPersonas">0</p>
                    </div>
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px;">
                        <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.invitadosRaciones || "Raciones"}:</p>
                        <p style="color: #10b981; font-size: 24px; font-weight: bold;" id="invitadosContRaciones">0</p>
                    </div>
                </div>

                <div class="panel" style="margin-top: 15px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.invitadosListaTitle || "Lista de hoy"} <span style="color: var(--text-secondary); font-size: 13px; font-weight: 400;">(${hoy})</span></h2>
                    <div id="invitadosLista"></div>
                </div>
            `;
            renderizarInvitados(trad);
            cargarInvitadosHoy().then(() => {
                if (vistaActual === "invitados") renderizarInvitados(trad);
            });
        }


        // Dibuja la lista de invitados del día
        function renderizarInvitados(trad) {
            const listaDiv = document.getElementById("invitadosLista");
            const contPersonas = document.getElementById("invitadosContPersonas");
            const contRaciones = document.getElementById("invitadosContRaciones");
            if (!listaDiv) return;
            if (invitadosHoyLista.length === 0) {
                listaDiv.innerHTML = `<p class="scanner-lista-vacia">${trad.invitadosListaVacia || "No hay invitados registrados hoy."}</p>`;
            } else {
                let filas = "";
                const totalPersonas = invitadosHoyLista.length;
                const totalRaciones = invitadosHoyLista.reduce((suma, i) => suma + (Number(i.raciones) || 1), 0);
                invitadosHoyLista.forEach(invitado => {
                    filas += `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border-color); flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                            <i class="fas fa-user" style="color: var(--accent-color);"></i>
                            <div style="min-width: 0;">
                                <div style="font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escaparHTML(invitado.nombre)}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">${invitado.cedula ? "Cédula: " + escaparHTML(invitado.cedula) : ""}${invitado.cedula ? " · " : ""}${Number(invitado.raciones) || 1} ${(trad.invitadosRaciones || "raciones")}</div>
                            </div>
                        </div>
                        <button class="table-btn delete-btn" onclick="eliminarInvitado('${invitado.id}')" title="${trad.invitadosEliminar || "Eliminar"}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                });
                listaDiv.innerHTML = filas;
                if (contPersonas) contPersonas.textContent = totalPersonas;
                if (contRaciones) contRaciones.textContent = totalRaciones;
            }
        }


        // Agrega un invitado externo a la lista del día
        function agregarInvitado() {
            const trad = traducciones[configuracion.idioma];
            const nombre = (document.getElementById("invitadoNombre") || {}).value || "";
            const cedula = (document.getElementById("invitadoCedula") || {}).value || "";
            const raciones = Math.max(1, Number((document.getElementById("invitadoRaciones") || {}).value) || 1);
            if (!nombre.trim()) {
                mostrarNotificacion(trad.invitadosNombreRequerido || "Indica el nombre del invitado", "error");
                return;
            }
            const hoy = new Date().toISOString().slice(0, 10);
            db.collection("invitados").add({
                fecha: hoy,
                nombre: nombre.trim(),
                cedula: cedula.trim(),
                raciones,
                creadoPor: (usuarioActual && usuarioActual.nombre) || (usuarioActual && usuarioActual.correo) || "gestor",
                creadoEn: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById("invitadoNombre").value = "";
                document.getElementById("invitadoCedula").value = "";
                document.getElementById("invitadoRaciones").value = "1";
                mostrarNotificacion(trad.invitadosAgregadoOk || "Invitado agregado correctamente");
                cargarInvitadosHoy().then(() => {
                    if (vistaActual === "invitados") renderizarInvitados(trad);
                });
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al agregar invitado: ", error);
            });
        }


        // Elimina un invitado externo de la lista del día
        function eliminarInvitado(id) {
            const trad = traducciones[configuracion.idioma];
            if (!confirm(trad.invitadosConfirmEliminar || "¿Quitar este invitado de la lista de hoy?")) return;
            db.collection("invitados").doc(id).delete().then(() => {
                mostrarNotificacion(trad.invitadosEliminadoOk || "Invitado eliminado");
                cargarInvitadosHoy().then(() => {
                    if (vistaActual === "invitados") renderizarInvitados(trad);
                });
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al eliminar invitado: ", error);
            });
        }