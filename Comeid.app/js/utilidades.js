// =============================================
// ComeID - Utilidades: loading, notificaciones, conexion y menus
// =============================================


        // Cuenta un registro guardado localmente (modo contingencia)
        function sumarRegistroPendiente() {
            registrosPendientes++;
            localStorage.setItem("registrosPendientes", String(registrosPendientes));
            actualizarEstadoConexion();
        }


        // Estado de conexión: modo contingencia con aviso de pendientes y sincronización
        function actualizarEstadoConexion() {
            const banner = document.getElementById("offlineBanner");
            if (!banner) return;
            const trad = traducciones[configuracion.idioma];
            const estabaOffline = estadoConexionAnterior === false;

            if (navigator.onLine) {
                if (estabaOffline && registrosPendientes > 0) {
                    banner.style.display = "block";
                    banner.style.background = "#28a745";
                    banner.innerHTML = `<i class="fas fa-check-circle"></i> <span id="offlineBannerText">${trad.conexionRestaurada || "Conexión restaurada"} — ${registrosPendientes} ${trad.registrosSincronizados || "registros sincronizados correctamente"}</span>`;
                    registrosPendientes = 0;
                    localStorage.removeItem("registrosPendientes");
                    setTimeout(() => { banner.style.display = "none"; }, 3500);
                } else {
                    banner.style.display = "none";
                }
            } else {
                banner.style.display = "block";
                banner.style.background = "#f59e0b";
                banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span id="offlineBannerText">${trad.modoSinConexion || "Modo sin conexión"} — ${trad.registrosAlmacenando || "Los registros se están almacenando localmente."}${registrosPendientes > 0 ? " " + registrosPendientes + " " + (trad.registrosPendientes || "registros pendientes de sincronización") + "." : ""}</span>`;
            }
            estadoConexionAnterior = navigator.onLine;
        }
        window.addEventListener("online", actualizarEstadoConexion);
        window.addEventListener("offline", actualizarEstadoConexion);



        // =============================================
        // FUNCIONES GLOBALES (ACCESIBLES DESDE HTML)
        // =============================================

        // Función para mostrar loading
        function mostrarLoading() {
            document.getElementById("loading").style.display = "flex";
        }


        // Función para ocultar loading
        function ocultarLoading() {
            document.getElementById("loading").style.display = "none";
        }


        // Función para mostrar notificación
        function mostrarNotificacion(mensaje, tipo = "success") {
            const notification = document.getElementById("notification");
            notification.textContent = mensaje;
            notification.style.display = "block";
            notification.style.background = tipo === "success" ? "#28a745" : "#dc3545";
            setTimeout(() => {
                notification.style.display = "none";
            }, 5000);
        }


        // Función para activar botón del menú
        function activarBoton(index) {
            document.querySelectorAll(".menu button, .dropdown-btn")
                .forEach(btn => btn.classList.remove("active"));
            const boton = document.querySelector(`.menu button:nth-child(${index})`);
            if (boton) {
                boton.classList.add("active");
            }
        }

        // Resalta el botón del menú de la sección actual (sin marcar subacciones)
        window.addEventListener("click", function(event) {
            if (event.target.closest(".dropdown-content")) return;
            const boton = event.target.closest(".menu button, .dropdown-btn");
            if (boton) {
                document.querySelectorAll(".menu button, .dropdown-btn")
                    .forEach(b => b.classList.remove("active"));
                boton.classList.add("active");
            }
        });


        // Función para asignar un color a cada nivel
        function getColorPorNivel(nivel) {
            const colores = {
                "7mo": "rgba(54, 162, 235, 0.2)",
                "8vo": "rgba(75, 192, 192, 0.2)",
                "9no": "rgba(255, 206, 86, 0.2)",
                "10mo": "rgba(153, 102, 255, 0.2)",
                "11mo": "rgba(255, 159, 64, 0.2)",
                "12mo": "rgba(199, 199, 199, 0.2)"
            };
            return colores[nivel] || "var(--bg-tertiary)";
        }


        // Color sólido de cada nivel (para puntos y detalles que no son fondo)
        function getColorPorNivelSolido(nivel) {
            const colores = {
                "7mo": "rgba(54, 162, 235, 1)",
                "8vo": "rgba(75, 192, 192, 1)",
                "9no": "rgba(255, 206, 86, 1)",
                "10mo": "rgba(153, 102, 255, 1)",
                "11mo": "rgba(255, 159, 64, 1)",
                "12mo": "rgba(199, 199, 199, 1)"
            };
            return colores[nivel] || "var(--text-secondary)";
        }


        // Determina si una asistencia corresponde a un estudiante que paga (consistente en todo el sistema)
        function esPaganteAsistencia(asistencia) {
            if (!asistencia) return false;
            if (asistencia.tipo === "Paga") return true;
            if (asistencia.tipo === "Becado") return false;
            const estudiante = estudiantes.find(e => e.cedula === asistencia.cedula);
            return !!(estudiante && estudiante.tipo === "Paga");
        }


        // Fecha ISO (AAAA-MM-DD) de hace N días
        function fechaISOOffset(dias) {
            const d = new Date();
            d.setDate(d.getDate() - dias);
            return d.toISOString().slice(0, 10);
        }


        // =============================================
        // PREDICCIÓN CON IA
        // =============================================

        // =============================================
        // PREDICCIÓN CON IA
        // =============================================

        function localeParaIdioma() {
            switch (configuracion.idioma) {
                case "Español": return "es-CR";
                case "Português": return "pt-BR";
                case "Français": return "fr-FR";
                case "Deutsch": return "de-DE";
                default: return "en-US";
            }
        }


        // Función para alternar el menú desplegable de Exportar
        function toggleDropdown(event) {
            event.stopPropagation();
            const dropdown = document.getElementById("dropdownExport");
            document.getElementById("dropdownQR").classList.remove("show");
            dropdown.classList.toggle("show");
        }


        // Función para alternar el menú desplegable de QR
        function toggleQRDropdown(event) {
            event.stopPropagation();
            const dropdown = document.getElementById("dropdownQR");
            document.getElementById("dropdownExport").classList.remove("show");
            dropdown.classList.toggle("show");
        }


        // Función para alternar el menú desplegable de Exportar en móvil
        function toggleDropdownMobile() {
            const dropdown = document.getElementById("dropdownExportMobile");
            dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
        }


        // Función para alternar el menú desplegable de QR en móvil
        function toggleQRDropdownMobile() {
            const dropdown = document.getElementById("dropdownQRMobile");
            dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
        }

        // Cerrar los menús desplegables al hacer clic fuera de ellos
        window.onclick = function(event) {
            if (!event.target.closest('.dropdown')) {
                const dropdowns = document.getElementsByClassName("dropdown-content");
                for (let i = 0; i < dropdowns.length; i++) {
                    const openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        };


        // Función para toggle el sidebar
        function toggleSidebar() {
            const sidebar = document.getElementById("sidebar");
            sidebar.classList.toggle("collapsed");
            if (sidebar.classList.contains("collapsed")) {
                localStorage.setItem("sidebar", "cerrada");
            } else {
                localStorage.setItem("sidebar", "abierta");
            }
        }


        // Función para toggle el menú móvil
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById("mobileMenu");
            mobileMenu.classList.toggle("show");
        }


        // Función para cerrar el menú móvil
        function closeMobileMenu() {
            document.getElementById("mobileMenu").classList.remove("show");
        }


        // =============================================
        // PERFIL DE USUARIO
        // =============================================

        // Función para alternar el menú del perfil
        function toggleUserProfile() {
            document.getElementById("userProfileDropdown").classList.toggle("show");
        }


        // =============================================
        // CARGA DIFERIDA DE LIBRERÍAS PESADAS (red lenta)
        // Las librerías grandes (Excel, PDF, escáner, gráficos) se descargan
        // solo la primera vez que se usan y se reutilizan en la sesión.
        // =============================================
        const URL_XLSX = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        const URL_JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        const URL_JSPDF_AUTOTABLE = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js";
        const URL_CHART = "https://cdn.jsdelivr.net/npm/chart.js";
        const URL_ZXING = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
        const _scriptsPromise = {};

        function cargarScript(url) {
            if (_scriptsPromise[url]) return _scriptsPromise[url];
            if (document.querySelector(`script[data-cargado="${url}"]`)) {
                _scriptsPromise[url] = Promise.resolve();
                return _scriptsPromise[url];
            }
            _scriptsPromise[url] = new Promise((resolve, reject) => {
                const s = document.createElement("script");
                s.src = url;
                s.dataset.cargado = url;
                s.async = true;
                s.onload = () => resolve();
                s.onerror = () => {
                    delete _scriptsPromise[url];
                    reject(new Error("No se pudo cargar la librería necesaria. Verifica tu conexión."));
                };
                document.head.appendChild(s);
            });
            return _scriptsPromise[url];
        }