// =============================================
// ComeID - Gestion de usuarios y roles
// =============================================


        // Función para cargar usuarios desde Firestore
        function cargarUsuarios() {
            db.collection("usuarios").get().then((querySnapshot) => {
                usuarios = [];
                querySnapshot.forEach((doc) => {
                    usuarios.push({
                        uid: doc.id,
                        ...doc.data()
                    });
                });
                mostrarListaRoles();
            }).catch(error => {
                console.error("Error al cargar usuarios: ", error);
                mostrarNotificacion("Error al cargar usuarios: " + error.message, "error");
            });
        }


        // Función para mostrar la lista de usuarios y roles
        function mostrarListaRoles() {
            const trad = traducciones[configuracion.idioma];
            const rolesListDiv = document.getElementById("rolesList");

            if (usuarios.length === 0) {
                rolesListDiv.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">${trad.tablaSinResultados}</p>`;
                return;
            }

            let html = "";
            usuarios.forEach(usuario => {
                const rolActual = usuario.rol || "estudiante";
                const esVinculadoGoogle = usuario.vinculadoDe || usuario.fechaVinculacion;
                const marcaGoogle = esVinculadoGoogle
                    ? `<span style="display:inline-block;margin-top:3px;font-size:11px;font-weight:700;color:#10b981;background:rgba(16,185,129,0.15);padding:2px 8px;border-radius:20px;">VINCULADO POR GOOGLE</span>`
                    : "";
                html += `
                    <div class="role-item">
                        <div class="role-info">
                            <p><strong>${trad.rolesFormNombre}</strong> ${usuario.nombre || usuario.correo || "Sin nombre"}</p>
                            <p><strong>${trad.rolesFormCorreo}</strong> ${usuario.correo || "Sin correo"}</p>
                            ${marcaGoogle}
                        </div>
                        <select class="role-select" data-uid="${usuario.uid}" onchange="actualizarRolSeleccionado(this)">
                            <option value="admin" ${rolActual.toLowerCase() === "admin" ? "selected" : ""}>${trad.rolesFormAdmin}</option>
                            <option value="profesor" ${rolActual.toLowerCase() === "profesor" ? "selected" : ""}>${trad.rolesFormProfesor}</option>
                            <option value="estudiante" ${rolActual.toLowerCase() === "estudiante" ? "selected" : ""}>${trad.rolesFormEstudiante}</option>
                        </select>
                    </div>
                `;
            });

            rolesListDiv.innerHTML = html;
        }


        // Función para actualizar el rol seleccionado en el objeto rolesModificados
        function actualizarRolSeleccionado(selectElement) {
            const uid = selectElement.getAttribute("data-uid");
            const nuevoRol = selectElement.value;
            rolesModificados[uid] = nuevoRol;
        }


        // Función para mostrar el formulario de gestión de roles
        function mostrarGestionRoles() {
            const trad = traducciones[configuracion.idioma];
            const puedeGestionarRoles = usuarioActual && usuarioActual.rol && usuarioActual.rol.toLowerCase() === "admin";

            if (!puedeGestionarRoles) {
                mostrarNotificacion(trad.notificacionSinPermiso, "error");
                return;
            }

            document.getElementById("rolesFormTitle").textContent = trad.rolesFormTitle;
            document.getElementById("rolesCancelarBtn").textContent = trad.rolesCancelarBtn;
            document.getElementById("rolesGuardarBtn").textContent = trad.rolesGuardarBtn;

            rolesModificados = {};
            cargarUsuarios();
            document.getElementById("rolesForm").style.display = "flex";
        }


        // Función para cerrar el formulario de roles
        function cerrarRolesForm() {
            document.getElementById("rolesForm").style.display = "none";
        }


        // Función para guardar los roles modificados
        function guardarRoles() {
            const trad = traducciones[configuracion.idioma];
            const uid = Object.keys(rolesModificados);

            if (uid.length === 0) {
                mostrarNotificacion("No se han realizado cambios", "error");
                return;
            }

            mostrarLoading();
            let promesas = [];

            uid.forEach(usuarioUid => {
                const nuevoRol = rolesModificados[usuarioUid];
                promesas.push(
                    db.collection("usuarios").doc(usuarioUid).update({
                        rol: nuevoRol
                    })
                );
            });

            Promise.all(promesas)
                .then(() => {
                    ocultarLoading();
                    mostrarNotificacion(trad.rolesExito);
                    cerrarRolesForm();
                    // Recargar usuarios para actualizar la lista
                    cargarUsuarios();
                    // Si el usuario actual cambió su propio rol, actualizar la sesión
                    if (rolesModificados[usuarioActual.uid]) {
                        usuarioActual.rol = rolesModificados[usuarioActual.uid];
                        actualizarRolUsuario();
                    }
                })
                .catch(error => {
                    ocultarLoading();
                    mostrarNotificacion(trad.rolesError + ": " + error.message, "error");
                    console.error("Error al guardar roles: ", error);
                });
        }