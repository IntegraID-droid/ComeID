// =============================================
// ComeID Biblioteca - Carga inicial, autenticación y dashboard
// =============================================

// Mapeo de ids estáticos del HTML a sus claves de traducción
const IDS_TEXTO_BIB = {
    headerLogo: "headerLogo",
    sidebarLogo: "sidebarLogo",
    menuGeneralTitle: "menuGeneralTitle",
    menuDashboard: "menuDashboard",
    menuCatalogo: "menuCatalogo",
    menuEstudiantesBib: "menuEstudiantesBib",
    menuPrestamos: "menuPrestamos",
    menuHistorial: "menuHistorial",
    menuAlertas: "menuAlertas",
    menuMapa: "menuMapa",
    menuReportes: "menuReportes",
    menuIA: "menuIA",
    menuConfiguracion: "menuConfiguracion",
    menuAcercaDe: "menuAcercaDe",
    menuActividad: "menuActividad",
    menuNotificaciones: "menuNotificaciones",
    menuReservas: "menuReservas",
    menuSistemaTitle: "menuSistemaTitle",
    menuCambiarSistema: "menuCambiarSistema",
    menuCerrarSesion: "menuCerrarSesion",
    mobileDashboard: "mobileDashboard",
    mobileCatalogo: "mobileCatalogo",
    mobileEstudiantesBib: "mobileEstudiantesBib",
    mobilePrestamos: "mobilePrestamos",
    mobileHistorial: "mobileHistorial",
    mobileMiCuenta: "mobileMiCuenta",
    menuMiCuenta: "menuMiCuenta",
    mobileAlertas: "mobileAlertas",
    mobileMapa: "mobileMapa",
    mobileReportes: "mobileReportes",
    mobileIA: "mobileIA",
    mobileConfiguracion: "mobileConfiguracion",
    mobileAcercaDe: "mobileAcercaDe",
    mobileActividad: "mobileActividad",
    mobileNotificaciones: "mobileNotificaciones",
    mobileReservas: "mobileReservas",
    mobileAyuda: "mobileAyuda",
    headerAyuda: "headerAyuda",
    headerAcercaDe: "headerAcercaDe",
    mobileCambiarSistema: "mobileCambiarSistema",
    mobileCerrarSesion: "mobileCerrarSesion",
    profileCambiarSistema: "profileCambiarSistema",
    profileCerrarSesion: "profileCerrarSesion",
    instalarApp: "instalarApp"
};

function aplicarTemaBib() {
    document.body.classList.toggle("light-theme", configuracion.tema === "Claro");
}

function aplicarIdiomaBib() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    for (const clave in IDS_TEXTO_BIB) {
        const el = document.getElementById(IDS_TEXTO_BIB[clave]);
        if (el && trad[clave] !== undefined) el.textContent = trad[clave];
    }
    const vt = document.getElementById("versionText");
    if (vt) vt.textContent = (trad.versionText || "").replace("{VERSION}", VERSION_BIBLIOTECA);
}

function aplicarConfiguracionBib() {
    aplicarTemaBib();
    aplicarIdiomaBib();
    actualizarEstadoConexion();
    const ms = document.getElementById("menuSearch");
    if (ms) {
        ms.placeholder = (traducciones[configuracion.idioma] || traducciones.Español).menuBuscarFuncion || "";
    }
}

// Buscador de función: filtra los botones del menú lateral por texto.
function iniciarBusquedaMenuBib() {
    const menuSearch = document.getElementById("menuSearch");
    if (!menuSearch) return;
    menuSearch.value = "";
    menuSearch.addEventListener("keyup", function() {
        const texto = this.value.toLowerCase();
        document.querySelectorAll(".menu button").forEach(btn => {
            const nombre = btn.textContent.toLowerCase();
            btn.style.display = nombre.includes(texto) ? "flex" : "none";
        });
    });
}

function getRolTraducidoBib(rol) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    switch ((rol || "").toLowerCase()) {
        case "admin": return trad.headerRoleAdmin || "Admin";
        case "profesor": return trad.headerRoleProfesor || "Profesor";
        case "bibliotecario": return trad.headerRoleBibliotecario || "Bibliotecario";
        default: return trad.headerRoleEstudiante || "Estudiante";
    }
}

function actualizarPerfilBib() {
    if (!usuarioActual) return;
    const nombre = usuarioActual.nombre || usuarioActual.correo || "Usuario";
    const rol = getRolTraducidoBib(usuarioActual.rol);
    document.getElementById("userName").textContent = nombre;
    document.getElementById("userRole").textContent = rol;
    document.getElementById("profileName").textContent = nombre;
    document.getElementById("profileRole").textContent = rol;
}

// =============================================
// CARGA DE DATOS
// =============================================

function cargarLibros() {
    return db.collection("libros").get().then(qs => {
        libros = [];
        qs.forEach(doc => libros.push(Object.assign({ id: doc.id }, doc.data())));
    });
}

function cargarPrestamos() {
    const esEstudianteSolo = usuarioActual && String(usuarioActual.rol || "").toLowerCase() === "estudiante";
    const estId = esEstudianteSolo ? usuarioActual.estudiantesId : null;
    const consulta = estId
        ? db.collection("prestamos").where("prestamistaId", "==", estId)
        : db.collection("prestamos");
    return consulta.get().then(qs => {
        prestamos = [];
        qs.forEach(doc => prestamos.push(Object.assign({ id: doc.id }, doc.data())));
    }).catch(error => {
        console.warn("No se pudieron cargar los préstamos:", error.message);
        prestamos = [];
    });
}

function cargarEstudiantesBib() {
    const esEstudianteSolo = usuarioActual && String(usuarioActual.rol || "").toLowerCase() === "estudiante";
    const estId = esEstudianteSolo ? usuarioActual.estudiantesId : null;
    if (estId) {
        return db.collection("estudiantes").doc(estId).get().then(doc => {
            estudiantes = [];
            if (doc.exists) {
                const d = doc.data();
                estudiantes.push({ id: doc.id, nombre: d.nombre || "Sin nombre", cedula: d.cedula || "", correo: d.correo || "", origen: "comedor" });
            }
        }).catch(() => {
            estudiantes = [];
        });
    }
    return Promise.all([
        db.collection("estudiantes").get().then(qs => {
            estudiantes = [];
            qs.forEach(doc => {
                const d = doc.data();
                estudiantes.push({ id: doc.id, nombre: d.nombre || "Sin nombre", cedula: d.cedula || "", correo: d.correo || "", origen: "comedor" });
            });
        }).catch(error => {
            console.warn("No se pudieron cargar los estudiantes:", error.message);
            estudiantes = [];
        }),
        cargarBibliotecaEstudiantes()
    ]).then(() => {
        // Los socios propios de la biblioteca se suman a la lista de prestatarios
        bibliotecaEstudiantes.forEach(s => {
            estudiantes.push({ id: s.id, nombre: s.nombre || "Sin nombre", cedula: s.cedula || "", correo: s.correo || "", origen: "biblioteca" });
        });
    });
}

function cargarBibliotecaEstudiantes() {
    return db.collection("bibliotecaEstudiantes").get().then(qs => {
        bibliotecaEstudiantes = [];
        qs.forEach(doc => {
            const d = doc.data();
            bibliotecaEstudiantes.push({ id: doc.id, nombre: d.nombre || "Sin nombre", cedula: d.cedula || "", correo: d.correo || "" });
        });
    }).catch(error => {
        console.warn("No se pudieron cargar los socios de la biblioteca:", error.message);
        bibliotecaEstudiantes = [];
    });
}

function cargarProfesoresBib() {
    return db.collection("usuarios").where("rol", "==", "profesor").get().then(qs => {
        profesores = [];
        qs.forEach(doc => {
            const d = doc.data();
            profesores.push({ id: doc.id, nombre: d.nombre || d.correo || "Profesor" });
        });
    }).catch(error => {
        // Solo el admin puede listar usuarios; para otros roles se deja vacío
        console.warn("No se pudieron cargar los profesores:", error.message);
        profesores = [];
    });
}

function cargarDatosBiblioteca() {
    return Promise.all([
        cargarLibros(),
        cargarPrestamos(),
        cargarEstudiantesBib(),
        cargarProfesoresBib(),
        cargarAjustesBib(),
        cargarActividad(),
        cargarNotificaciones(),
        cargarReservas()
    ]).then(() => {
        actualizarBadgeNotificaciones();
    });
}

// =============================================
// HELPERS
// =============================================

// Devuelve los libros con el número de ejemplares disponibles
function librosDisponibles() {
    const activos = prestamos.filter(p => !p.devuelto);
    return libros.map(libro => {
        const prestados = activos.filter(p => p.libroId === libro.id).length;
        return Object.assign({}, libro, {
            disponibles: Math.max(0, (Number(libro.ejemplares) || 0) - prestados)
        });
    });
}

function esPrestamoAtrasado(prestamo) {
    if (prestamo.devuelto || !prestamo.fechaVencimiento) return false;
    return new Date(prestamo.fechaVencimiento + "T23:59:59").getTime() < Date.now();
}

// Días de atraso (0 si no hay atraso) considerando la fecha de devolución
function diasAtraso(prestamo) {
    if (!prestamo.fechaVencimiento) return 0;
    const venc = new Date(prestamo.fechaVencimiento + "T23:59:59").getTime();
    let referencia = Date.now();
    if (prestamo.devuelto && prestamo.fechaDevolucion) {
        referencia = new Date(prestamo.fechaDevolucion + "T00:00:00").getTime();
    }
    return Math.max(0, Math.floor((referencia - venc) / 86400000));
}

// Multa calculada según los ajustes de la biblioteca.
// Para préstamos devueltos se usa el valor guardado al devolver
// (snapshot), para no recalcular con ajustes posteriores.
function calcularMulta(prestamo) {
    if (!ajustesBib.multasActivas) return 0;
    return diasAtraso(prestamo) * (Number(ajustesBib.montoMultaDiario) || 0);
}

function multaFinal(prestamo) {
    if (prestamo && prestamo.devuelto && typeof prestamo.multa === "number") return prestamo.multa;
    return calcularMulta(prestamo);
}

function formatearMulta(prestamo) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const multa = multaFinal(prestamo);
    if (multa <= 0) return "—";
    if (prestamo.devuelto && prestamo.multaPagada) {
        return `<span style="color:#28a745; font-weight:600;"><i class="fas fa-check-circle"></i> ₡${multa.toLocaleString()}</span>`;
    }
    const gestion = puedeGestionar();
    const btnCobrar = prestamo.devuelto && gestion
        ? ` <button class="table-btn" style="color:#10b981;" onclick="cobrarMulta('${prestamo.id}')" title="${trad.multaCobrar}"><i class="fas fa-hand-holding-usd"></i></button>`
        : "";
    return `<span class="multa-negativa">₡${multa.toLocaleString()}</span>${btnCobrar}`;
}

// Semáforo de vencimientos: normal / próximo (<=3 días) / atrasado
function getSemaforoVencimiento(prestamo) {
    if (prestamo.devuelto || !prestamo.fechaVencimiento) return null;
    const ms = new Date(prestamo.fechaVencimiento + "T23:59:59").getTime() - Date.now();
    if (ms < 0) return "atrasado";
    if (ms <= 3 * 86400000) return "proximo";
    return "normal";
}

function formatearSemaforo(prestamo) {
    const estado = getSemaforoVencimiento(prestamo);
    if (!estado) return "—";
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const texto = {
        normal: trad.semaforoNormal || "Normal",
        proximo: trad.semaforoProximo || "Por vencer",
        atrasado: trad.semaforoAtrasado || "Atrasado"
    };
    return `<span class="estado-semaforo semaforo-${estado}">${texto[estado]}</span>`;
}

function coloresChart() {
    if (configuracion.tema === "Claro") {
        return { grid: "#d4dbf0", text: "#5a6b8c" };
    }
    return { grid: "#165bd3", text: "#8cbfff" };
}

// =============================================
// DASHBOARD
// =============================================

function mostrarBibDashboard() {
    activarVista("dashboard");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const disponibles = librosDisponibles();
    const totalEjemplares = libros.reduce((s, l) => s + (Number(l.ejemplares) || 0), 0);
    const titulos = libros.length;
    const activos = prestamos.filter(p => !p.devuelto);
    const atrasados = activos.filter(esPrestamoAtrasado);

    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.dashboardTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.dashboardSubtitle}</p>
        <div class="panel" style="margin-top: 16px; padding: 18px;">
            <h2 style="color: var(--accent-color); margin-bottom: 4px;">${trad.intelTitle}</h2>
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">${trad.intelSubtitle}</p>
            <div id="panelInsights"></div>
        </div>
        <div class="cards">
            <div class="card"><h3>${trad.bibCardLibros}</h3><span>${totalEjemplares}</span></div>
            <div class="card"><h3>${trad.bibCardTitulos}</h3><span>${titulos}</span></div>
            <div class="card"><h3>${trad.bibCardPrestamosActivos}</h3><span>${activos.length}</span></div>
            <div class="card"><h3>${trad.bibCardAtrasados}</h3><span>${atrasados.length}</span></div>
            <div class="card"><h3>${trad.bibCardEstudiantes}</h3><span>${estudiantes.length}</span></div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">
            <div class="panel">
                <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.bibChartPrestamos}</h2>
                <div class="chart-container"><canvas id="chartPrestamos7"></canvas></div>
            </div>
            <div class="panel">
                <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.bibChartTopLibros}</h2>
                <div class="chart-container"><canvas id="chartTopLibros"></canvas></div>
            </div>
            <div class="panel">
                <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.bibChartTopPrestamistas}</h2>
                <div class="chart-container"><canvas id="chartTopPrestamistas"></canvas></div>
            </div>
        </div>
    `;

    graficarPrestamos7();
    graficarTopLibros();
    graficarTopPrestamistas();
    renderInsightsInteligentes();
}

// =============================================
// PANEL INTELIGENTE (insights calculados)
// =============================================

function calcularInsights() {
    const devueltos = prestamos.filter(p => p.devuelto);
    const puntuales = devueltos.filter(p => p.fechaDevolucion && p.fechaVencimiento && p.fechaDevolucion <= p.fechaVencimiento);
    const tasaPuntual = devueltos.length > 0 ? Math.round((puntuales.length / devueltos.length) * 100) : null;

    const conteoCategoria = {};
    const conteoLibro = {};
    const conteoPersona = {};
    prestamos.forEach(p => {
        const libro = libros.find(l => l.id === p.libroId);
        const cat = libro ? (libro.categoria || "Otro") : "—";
        conteoCategoria[cat] = (conteoCategoria[cat] || 0) + 1;
        const t = p.libroTitulo || "—";
        conteoLibro[t] = (conteoLibro[t] || 0) + 1;
        const n = p.prestamistaNombre || "—";
        conteoPersona[n] = (conteoPersona[n] || 0) + 1;
    });
    const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];

    const disponibles = librosDisponibles();
    return {
        tasaPuntual,
        catTop: top(conteoCategoria),
        libroTop: top(conteoLibro),
        personaTop: top(conteoPersona),
        agotados: disponibles.filter(l => l.disponibles === 0).length,
        atrasados: prestamos.filter(p => !p.devuelto && esPrestamoAtrasado(p)).length,
        totalPrestamos: prestamos.length
    };
}

function renderInsightsInteligentes() {
    const cont = document.getElementById("panelInsights");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const d = calcularInsights();

    if (d.totalPrestamos === 0) {
        cont.innerHTML = `<p style="color: var(--text-secondary);">${trad.intelSinDatos}</p>`;
        return;
    }

    const tile = (icono, etiqueta, valor, color) => `
        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px;">
            <i class="${icono}" style="color:${color}; font-size:18px;"></i>
            <p style="color: var(--text-secondary); font-size:12px; margin-top:8px;">${etiqueta}</p>
            <p style="font-weight:700; color: var(--text-primary); font-size:15px; margin-top:2px;">${valor}</p>
        </div>`;

    const valorCat = d.catTop ? escaparHTML(d.catTop[0]) + ` <span style="color:var(--text-secondary); font-weight:400;">(${d.catTop[1]} ${trad.intelVeces})</span>` : "—";
    const valorLibro = d.libroTop ? escaparHTML(d.libroTop[0]) + ` <span style="color:var(--text-secondary); font-weight:400;">(${d.libroTop[1]} ${trad.intelVeces})</span>` : "—";
    const valorPersona = d.personaTop ? escaparHTML(d.personaTop[0]) + ` <span style="color:var(--text-secondary); font-weight:400;">(${d.personaTop[1]} ${trad.intelVeces})</span>` : "—";
    const valorTasa = d.tasaPuntual === null ? "—" : d.tasaPuntual + " %";

    let sugerencia;
    let colorSugerencia;
    if (d.atrasados > 0) {
        sugerencia = trad.intelSugerenciaAtrasos;
        colorSugerencia = "#ef5350";
    } else if (d.agotados > 0) {
        sugerencia = trad.intelSugerenciaAgotados;
        colorSugerencia = "#fbbf24";
    } else {
        sugerencia = trad.intelSugerenciaBien;
        colorSugerencia = "#10b981";
    }

    cont.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            ${tile("fas fa-tags", trad.intelCategoriaPopular, valorCat, "#2b67ff")}
            ${tile("fas fa-book", trad.intelLibroMasPrestado, valorLibro, "#10b981")}
            ${tile("fas fa-check-circle", trad.intelTasaPuntual, valorTasa, "#fbbf24")}
            ${tile("fas fa-user", trad.intelPrestamistaActivo, valorPersona, "#a78bfa")}
            ${tile("fas fa-exclamation-triangle", trad.intelAgotados, d.agotados, "#ef5350")}
        </div>
        <p style="margin-top: 12px; color: ${colorSugerencia}; font-weight: 600;"><i class="fas fa-lightbulb"></i> ${sugerencia}</p>
    `;
}

function graficarPrestamos7() {
    cargarScript(URL_CHART).catch(() => {});
    const canvas = document.getElementById("chartPrestamos7");
    if (!canvas || typeof Chart === "undefined") return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const porDia = {};
    prestamos.forEach(p => {
        const f = p.fechaPrestamo;
        if (f) porDia[f] = (porDia[f] || 0) + 1;
    });
    const labels = [];
    const datos = [];
    for (let i = 6; i >= 0; i--) {
        const f = fechaISOOffset(i);
        labels.push(new Date(f + "T12:00:00").toLocaleDateString(localeParaIdioma(), { weekday: "short", day: "numeric" }));
        datos.push(porDia[f] || 0);
    }
    const colores = coloresChart();
    new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: trad.bibChartPrestamos,
                data: datos,
                backgroundColor: "#2b67ff",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: colores.grid }, ticks: { color: colores.text } },
                y: { beginAtZero: true, grid: { color: colores.grid }, ticks: { color: colores.text } }
            }
        }
    });
}

function graficarTopLibros() {
    cargarScript(URL_CHART).catch(() => {});
    const canvas = document.getElementById("chartTopLibros");
    if (!canvas || typeof Chart === "undefined") return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    const conteo = {};
    prestamos.forEach(p => {
        const clave = p.libroTitulo || "—";
        conteo[clave] = (conteo[clave] || 0) + 1;
    });
    const orden = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const colores = coloresChart();
    new Chart(canvas, {
        type: "bar",
        data: {
            labels: orden.map(o => o[0]),
            datasets: [{
                data: orden.map(o => o[1]),
                backgroundColor: "#10b981",
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: colores.grid }, ticks: { color: colores.text } },
                y: { grid: { display: false }, ticks: { color: colores.text } }
            }
        }
    });
}

function graficarTopPrestamistas() {
    cargarScript(URL_CHART).catch(() => {});
    const canvas = document.getElementById("chartTopPrestamistas");
    if (!canvas || typeof Chart === "undefined") return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    const conteo = {};
    prestamos.forEach(p => {
        const clave = p.prestamistaNombre || "—";
        conteo[clave] = (conteo[clave] || 0) + 1;
    });
    const orden = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const colores = coloresChart();
    new Chart(canvas, {
        type: "bar",
        data: {
            labels: orden.map(o => o[0]),
            datasets: [{
                data: orden.map(o => o[1]),
                backgroundColor: "#fbbf24",
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: colores.grid }, ticks: { color: colores.text } },
                y: { grid: { display: false }, ticks: { color: colores.text } }
            }
        }
    });
}

// =============================================
// CARGA INICIAL Y AUTENTICACIÓN
// =============================================

window.onload = function() {
    mostrarLoading();
    aplicarConfiguracionBib();
    actualizarEstadoConexion();
    iniciarBusquedaMenuBib();

    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const arrancar = () => {
            actualizarPerfilBib();
            cargarDatosBiblioteca().then(() => {
                ocultarLoading();
                pedirPermisoNotificaciones();
                recordarVencimientosLocales();
                mostrarBibDashboard();
            }).catch(error => {
                console.error("Error al cargar datos de la biblioteca: ", error);
                ocultarLoading();
                mostrarBibDashboard();
            });
        };

        db.collection("usuarios").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                usuarioActual = Object.assign({ uid: user.uid }, doc.data());
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
            arrancar();
        }).catch(error => {
            console.error("Error al cargar datos del usuario: ", error);
            usuarioActual = { uid: user.uid, rol: "estudiante", nombre: user.displayName || "Usuario" };
            arrancar();
        });
    });
};
