// =============================================
// ComeID - Sesion, perfil y roles del usuario
// =============================================


        // Función para cerrar sesión
        function cerrarSesion() {
            firebase.auth().signOut().then(() => {
                window.location.href = "login.html";
            }).catch(error => {
                const trad = traducciones[configuracion.idioma];
                mostrarNotificacion(`${trad.notificacionError}: ${error.message}`, "error");
            });
        }


        // Función para actualizar el rol del usuario en el header
        function actualizarRolUsuario() {
            if (usuarioActual) {
                const trad = traducciones[configuracion.idioma];
                let rolTexto = "";
                switch((usuarioActual.rol || "").toLowerCase()) {
                    case "admin":
                        rolTexto = trad.headerRoleAdmin || "Admin";
                        break;
                    case "profesor":
                        rolTexto = trad.headerRoleProfesor || "Profesor";
                        break;
                    case "estudiante":
                        rolTexto = trad.headerRoleEstudiante || "Estudiante";
                        break;
                }
                document.getElementById("userRole").textContent = rolTexto;
            }
        }

        // =============================================
        // MENÚ SEGÚN ROL Y LIMPIEZA DE ASISTENCIAS
        // =============================================

        // Función para saber si un botón del menú está permitido para el rol actual.
        // Los botones con "data-roles" solo se muestran si su rol está en la lista.
        // "data-rol-admin" es la forma antigua (solo admin).
        function menuHabilitadoPorRol(btn) {
            const rol = usuarioActual && usuarioActual.rol ? String(usuarioActual.rol).toLowerCase() : "estudiante";
            if (btn.hasAttribute("data-rol-admin")) return rol === "admin";
            if (!btn.hasAttribute("data-roles")) return true;
            return btn.getAttribute("data-roles").split(/\s+/).filter(Boolean).includes(rol);
        }

        // Oculta del menú lo que no corresponde al rol: el profesor solo ve
        // sus secciones, nunca funciones de admin (sin mensajes de "sin acceso").
        function actualizarMenuSegunRol() {
            document.querySelectorAll("[data-roles], [data-rol-admin]").forEach(btn => {
                btn.style.display = menuHabilitadoPorRol(btn) ? "" : "none";
            });
        }


        // Función para obtener el rol traducido
        function getRolTraducido(rol) {
            if (!rol) return "Estudiante";
            const trad = traducciones[configuracion.idioma];
            switch (rol.toLowerCase()) {
                case "admin": return trad.headerRoleAdmin || "Admin";
                case "profesor": return trad.headerRoleProfesor || "Profesor";
                case "estudiante": return trad.headerRoleEstudiante || "Estudiante";
                default: return rol;
            }
        }


        // Función para actualizar el perfil en el header
        function actualizarPerfilUsuario() {
            if (!usuarioActual) return;
            document.getElementById("userName").textContent = usuarioActual.nombre || usuarioActual.correo || "Usuario";
            document.getElementById("userRole").textContent = getRolTraducido(usuarioActual.rol);
            document.getElementById("profileName").textContent = usuarioActual.nombre || usuarioActual.correo || "Usuario";
            document.getElementById("profileRole").textContent = getRolTraducido(usuarioActual.rol);
            const lastLogin = localStorage.getItem(`lastLogin_${usuarioActual.uid}`);
            document.getElementById("profileLastLogin").textContent = lastLogin ? new Date(lastLogin).toLocaleString() : "No disponible";
        }


        // Función para registrar el inicio de sesión
        function registrarInicioSesion() {
            if (usuarioActual) {
                localStorage.setItem(`lastLogin_${usuarioActual.uid}`, new Date().toISOString());
            }
        }


        // =============================================
        // VINCULAR CUENTA DE GOOGLE AL PERFIL
        // Permite que un usuario que entró con correo+clave
        // añada su cuenta de Google como segundo método de
        // acceso. El resultado es la MISMA cuenta (mismo UID),
        // así que no se duplican perfiles.
        // =============================================

        function actualizarEstadoCuentaGoogle() {
            const btn = document.getElementById("vincularGoogleBtn");
            if (!btn) return;
            const user = firebase.auth().currentUser;
            const tieneGoogle = !!(user && user.providerData &&
                user.providerData.some(p => p.providerId === "google.com"));
            btn.style.display = tieneGoogle ? "none" : "flex";
        }

        function vincularCuentaGoogle() {
            const user = firebase.auth().currentUser;
            if (!user) return;
            const provider = new firebase.auth.GoogleAuthProvider();
            mostrarLoading();
            user.linkWithPopup(provider)
                .then(() => {
                    ocultarLoading();
                    actualizarEstadoCuentaGoogle();
                    mostrarNotificacion("Cuenta de Google vinculada. Ya puedes iniciar sesión con Google.", "success");
                })
                .catch(error => {
                    ocultarLoading();
                    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
                        // El navegador bloqueó la ventana o se cerró antes de terminar:
                        // se usa redirección (no depende de ventanas emergentes).
                        user.linkWithRedirect(provider)
                            .catch(err => {
                                mostrarNotificacion(
                                    "No se pudo vincular Google por redirección: " + err.message,
                                    "error"
                                );
                                console.error("Error al redirigir para vincular Google: ", err);
                            });
                        return;
                    }
                    if (error.code === "auth/operation-not-supported-in-this-environment") {
                        mostrarNotificacion("Debes usar la app por HTTP/HTTPS (desplegada o localhost), no abrir el archivo directamente.", "error");
                        return;
                    }
                    if (error.code === "auth/account-exists-with-different-credential" ||
                        error.code === "auth/credential-already-in-use") {
                        mostrarNotificacion("El correo de esa cuenta de Google ya está asociado a otro usuario en el sistema. No se puede vincular.", "error");
                        return;
                    }
                    if (error.code === "auth/provider-already-linked") {
                        // Ya estaba vinculada desde otra sesión.
                        actualizarEstadoCuentaGoogle();
                        return;
                    }
                    mostrarNotificacion("No se pudo vincular Google: " + error.message, "error");
                    console.error("Error al vincular cuenta de Google: ", error);
                });
        }

        // Completar el vínculo cuando se usó redirección (popup bloqueado).
        firebase.auth().getRedirectResult().then(result => {
            if (result && result.user) {
                actualizarEstadoCuentaGoogle();
            }
        }).catch(error => {
            console.error("Error al completar el vínculo de Google: ", error);
        });