// =============================================
// ComeID - Carga inicial y autenticacion
// =============================================


        // =============================================
        // CARGA INICIAL Y AUTENTICACIÓN
        // =============================================

        window.onload = function() {
            mostrarLoading();
            cargarConfiguracion();
            actualizarEstadoConexion();

            firebase.auth().onAuthStateChanged((user) => {
                if (!user) {
                    window.location.href = "login.html";
                    return;
                }

                db.collection("usuarios").doc(user.uid).get().then((doc) => {
                    if (doc.exists) {
                        usuarioActual = { uid: user.uid, ...doc.data() };
                    } else {
                        usuarioActual = { uid: user.uid, rol: "estudiante", nombre: user.displayName || "Usuario" };
                    }
                    const rol = String(usuarioActual.rol || "").toLowerCase();
                    if (rol !== "admin" && rol !== "profesor" && rol !== "bibliotecario") {
                        firebase.auth().signOut().then(() => {
                            window.location.href = "https://comeid-estudiantes.web.app";
                        });
                        return;
                    }
                    registrarInicioSesion();
                    actualizarPerfilUsuario();
                    actualizarRolUsuario();
                    actualizarMenuSegunRol();
                    actualizarEstadoCuentaGoogle();
                    vistaActual = "dashboard";
                    cargarEstudiantes();
                    ocultarLoading();
                    const ms = document.getElementById("menuSearch");
                    if (ms) ms.value = "";
                    const tutorialMostrado = localStorage.getItem("tutorialMostrado");
                    if (!tutorialMostrado) {
                        setTimeout(mostrarTutorial, 1000);
                    }
                }).catch(error => {
                    console.error("Error al cargar datos del usuario: ", error);
                    firebase.auth().signOut().then(() => {
                        window.location.href = "login.html";
                    });
                });
            });

            const estadoGuardado = localStorage.getItem("sidebar");
            if (estadoGuardado === "cerrada") {
                document.getElementById("sidebar").classList.add("collapsed");
            }

            aplicarTema(configuracion.tema);
            aplicarIdioma(configuracion.idioma);
            actualizarVersion();

            const menuSearch = document.getElementById("menuSearch");
            if (menuSearch) {
                menuSearch.value = "";
                menuSearch.addEventListener("keyup", function() {
                    const texto = this.value.toLowerCase();
                    const botones = document.querySelectorAll(".menu button, .dropdown-btn");
                    botones.forEach(btn => {
                        if (!menuHabilitadoPorRol(btn)) {
                            btn.style.display = "none";
                            return;
                        }
                        const nombre = btn.textContent.toLowerCase();
                        btn.style.display = nombre.includes(texto) ? "flex" : "none";
                    });
                });
            }

            // Cerrar el menú del perfil al hacer clic fuera
            window.addEventListener("click", function(event) {
                const userProfileDropdown = document.getElementById("userProfileDropdown");
                if (!event.target.closest("#userProfile") && userProfileDropdown.classList.contains("show")) {
                    userProfileDropdown.classList.remove("show");
                }
            });
        };
    