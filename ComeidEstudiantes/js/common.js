// =============================================
// Portal Estudiantes - Shell común y carga de datos
// =============================================

function escaparHTML(v) {
    return String(v == null ? "" : v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function limpiarTextoQR(t) {
    return String(t == null ? "" : t)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[|]/g, " ")
        .trim();
}

// ---------- Tema (claro/oscuro) ----------

function aplicarTema(tema) {
    document.body.classList.toggle("light", tema === "claro");
}

function fechaLegible(f) {
    if (!f) return "—";
    const d = new Date(String(f).slice(0, 10) + "T12:00:00");
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-CR");
}

function fechaHoraLegible(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" });
}

function toast(mensaje, tipo) {
    let t = document.querySelector(".toast");
    if (!t) {
        t = document.createElement("div");
        t.className = "toast";
        document.body.appendChild(t);
    }
    t.textContent = mensaje;
    t.className = "toast show" + (tipo === "error" ? " error" : "");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove("show"), 2800);
}

function mostrarCargando() {
    const c = document.getElementById("contenido");
    if (c) c.innerHTML = `<div class="loader"><div class="spinner-ring"></div><p>Cargando...</p></div>`;
}

function menuDeHoy() {
    if (!App.menu || !Array.isArray(App.menu)) return null;
    const dia = new Date().getDay();
    const d = App.menu.find(x => x && Number(x.dia) === dia);
    return d || null;
}

function nombresDias() {
    return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
}

function esAtrasado(prestamo) {
    if (!prestamo || prestamo.devuelto || !prestamo.fechaVencimiento) return false;
    return new Date(prestamo.fechaVencimiento + "T23:59:59").getTime() < Date.now();
}

function diasAtraso(prestamo) {
    if (!prestamo || !prestamo.fechaVencimiento) return 0;
    const ref = (prestamo.devuelto && prestamo.fechaDevolucion)
        ? new Date(prestamo.fechaDevolucion + "T00:00:00")
        : new Date();
    return Math.max(0, Math.floor((ref.getTime() - new Date(prestamo.fechaVencimiento + "T23:59:59").getTime()) / 86400000) + 1);
}

function estadoPrestamo(prestamo) {
    if (!prestamo) return { texto: "—", clase: "badge-info" };
    if (prestamo.devuelto) return { texto: "Devuelto", clase: "badge-info" };
    if (esAtrasado(prestamo)) return { texto: "Atrasado", clase: "badge-danger" };
    return { texto: "En préstamo", clase: "badge-ok" };
}

function estadoBecario() {
    const t = App.estudiante && App.estudiante.tipo;
    return t === "Becado" ? "Becado" : (t || "Pagado");
}

// ---------- Perfil del estudiante autenticado ----------

function cargarPerfilEstudiante(user) {
    return db.collection("usuarios").doc(user.uid).get().then(doc => {
        const datosUsr = doc.exists ? doc.data() : null;
        let estudiantesId = datosUsr && datosUsr.estudiantesId;

        const ensureUserDoc = doc.exists ? Promise.resolve() : db.collection("usuarios").doc(user.uid).set({
            rol: "estudiante", correo: user.email, nombre: "", cedula: "", estudiantesId: ""
        }).catch(() => {});

        const obtenerId = new Promise(resolve => {
            if (estudiantesId) {
                App.usuario = Object.assign({ rol: "estudiante", correo: user.email }, datosUsr, { estudiantesId });
                resolve(estudiantesId);
                return;
            }
            db.collection("estudiantes").where("uid", "==", user.uid).limit(1).get()
                .then(qs => {
                    if (!qs.empty) { resolveFromEstudiantes(qs.docs[0], resolve); return; }
                    const cedulaUsr = (datosUsr && datosUsr.cedula) || "";
                    if (!cedulaUsr) {
                        App.usuario = Object.assign({ rol: "estudiante", correo: user.email }, datosUsr);
                        resolve(null);
                        return;
                    }
                    db.collection("estudiantes").where("cedula", "==", cedulaUsr).limit(5).get()
                        .then(qs2 => {
                            if (qs2.empty) {
                                App.usuario = Object.assign({ rol: "estudiante", correo: user.email }, datosUsr);
                                resolve(null);
                                return;
                            }
                            resolveFromEstudiantes(qs2.docs[0], resolve);
                        }).catch(() => resolve(null));
                })
                .catch(() => resolve(null));
        });

        function resolveFromEstudiantes(edoc, resolve) {
            const id = edoc.id;
            const d = edoc.data();
            App.usuario = Object.assign({ rol: "estudiante", correo: user.email, nombre: d.nombre || "Estudiante" }, datosUsr, { estudiantesId: id });
            db.collection("usuarios").doc(user.uid).set({
                rol: "estudiante", correo: user.email, nombre: d.nombre || "Estudiante",
                cedula: d.cedula || (datosUsr && datosUsr.cedula) || "", estudiantesId: id
            }, { merge: true }).catch(() => {});
            resolve(id);
        }

        return ensureUserDoc.then(() => obtenerId).then(id => {
            if (!id) return null;
            App.usuario = App.usuario || Object.assign({ rol: "estudiante", correo: user.email }, datosUsr);
            App.usuario.estudiantesId = id;
            return db.collection("estudiantes").doc(id).get().then(edoc => {
                if (!edoc.exists) return null;
                App.estudiante = Object.assign({ id: edoc.id }, edoc.data());
                return App.estudiante;
            });
        });
    });
}

// ---------- Configuración del comedor y menú ----------

function cargarConfiguracion() {
    return db.collection("configuracion").doc("comedor").get()
        .then(doc => {
            App.configuracion = Object.assign(
                { institucion: "CTP de Liberia", comedor: "Comedor Institucional", precio: 1000, capacidad: 0, apertura: "", cierre: "" },
                doc.exists ? doc.data() : {}
            );
            return db.collection("configuracion").doc("menu").get();
        })
        .then(doc => {
            App.menu = (doc.exists && Array.isArray(doc.data().plan)) ? doc.data().plan : null;
        })
        .catch(() => {
            App.configuracion = Object.assign({ institucion: "CTP de Liberia", precio: 1000 });
            App.menu = null;
        });
}

// ---------- Datos propios del estudiante ----------

function cargarPrestamosPropios() {
    return db.collection("prestamos").where("prestamistaId", "==", App.estudiante.id).get()
        .then(qs => {
            App.prestamos = [];
            qs.forEach(d => App.prestamos.push(Object.assign({ id: d.id }, d.data())));
            App.prestamos.sort((a, b) => String(b.fechaPrestamo || "").localeCompare(String(a.fechaPrestamo || "")));
        })
        .catch(() => { App.prestamos = []; });
}

function cargarAsistenciasPropias() {
    return db.collection("asistencias").where("cedula", "==", App.estudiante.cedula).get()
        .then(qs => {
            App.asistencias = [];
            qs.forEach(d => App.asistencias.push(Object.assign({ id: d.id }, d.data())));
            App.asistencias.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
        })
        .catch(() => { App.asistencias = []; });
}

function cargarReservasPropias() {
    return db.collection("reservas").where("usuarioId", "==", App.uid).get()
        .then(qs => {
            App.reservas = [];
            qs.forEach(d => App.reservas.push(Object.assign({ id: d.id }, d.data())));
            App.reservas.sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
        })
        .catch(() => { App.reservas = []; });
}

// ---------- Shell (encabezado + menú lateral) ----------

function paginaActual() {
    return (window.location.pathname.split("/").pop() || "dashboard.html");
}

function renderShell() {
    const est = App.estudiante;
    const inicial = String(est.nombre || "?").trim().charAt(0).toUpperCase() || "?";
    const seccion = est.seccion ? "Sección " + est.seccion : "CTP de Liberia";
    const actual = paginaActual();

    const raiz = document.getElementById("app-root");
    if (!raiz) return;

    raiz.innerHTML = `
        <header class="app-header">
            <button class="icon-btn btn-menu" id="btnMenu" aria-label="Abrir menú"><i class="fa-solid fa-bars"></i></button>
            <div class="header-logo">
                <img src="assets/logo.png" alt="Integra ID">
                <span>Integra ID <span class="brand-acc">Estudiantes</span></span>
            </div>
            <div class="header-user-chip hide-mobile"><div class="avatar-mini">${escaparHTML(inicial)}</div></div>
        </header>

        <div class="overlay" id="overlay"></div>

        <aside class="sidebar" id="sidebar">
            <div class="sidebar-logo">
                <img src="assets/logo.png" alt="Integra ID">
                <span>INTEGRA <span class="brand-acc">ID</span></span>
            </div>
            <div class="sidebar-user">
                <div class="avatar">${escaparHTML(inicial)}</div>
                <div>
                    <div class="u-name">${escaparHTML(est.nombre)}</div>
                    <div class="u-sub">${escaparHTML(seccion)}</div>
                </div>
            </div>
            <nav class="sidebar-nav" id="sidebarNav">
                <a href="dashboard.html" data-nav="dashboard.html"><i class="fa-solid fa-house"></i> Inicio</a>
                <a href="perfil.html" data-nav="perfil.html"><i class="fa-solid fa-user"></i> Mi información</a>
                <a href="comedor.html" data-nav="comedor.html"><i class="fa-solid fa-utensils"></i> Mi comedor</a>
                <a href="biblioteca.html" data-nav="biblioteca.html"><i class="fa-solid fa-book-open"></i> Mi biblioteca</a>
                <a href="qr.html" data-nav="qr.html"><i class="fa-solid fa-qrcode"></i> Mi código QR</a>
                <a href="notificaciones.html" data-nav="notificaciones.html"><i class="fa-solid fa-bell"></i> Notificaciones <span class="nav-badge" id="notifBadge" style="display:none;"></span></a>
                <a href="configuracion.html" data-nav="configuracion.html"><i class="fa-solid fa-gear"></i> Configuración</a>
            </nav>
            <div class="sidebar-footer">
                <button class="btn-logout" onclick="cerrarSesionPortal()"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
            </div>
        </aside>

        <main class="main" id="contenido"></main>
    `;

    const nav = raiz.querySelector("#sidebarNav");
    nav.querySelectorAll("a").forEach(a => {
        if (a.getAttribute("data-nav") === actual) a.classList.add("active");
    });

    const btnMenu = document.getElementById("btnMenu");
    const overlay = document.getElementById("overlay");
    const abrir = () => document.body.classList.add("menu-open");
    const cerrar = () => document.body.classList.remove("menu-open");
    if (btnMenu) btnMenu.addEventListener("click", abrir);
    if (overlay) overlay.addEventListener("click", cerrar);
    nav.addEventListener("click", e => {
        if (e.target.closest("a")) cerrar();
    });
}

function renderSinVinculo() {
    const raiz = document.getElementById("app-root");
    if (raiz) {
        raiz.innerHTML = `
            <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width:400px; text-align:center;">
                    <div style="font-size:40px; margin-bottom:12px;"><i class="fa-solid fa-circle-exclamation" style="color:#fbbf24;"></i></div>
                    <h2 style="font-size:18px; margin-bottom:8px;">Perfil no vinculado</h2>
                    <p style="color:var(--text-secondary); font-size:13px; line-height:1.5; margin-bottom:16px;">
                        Esta cuenta no está vinculada a un perfil de estudiante registrado en Integra ID.
                        Pide a la administración del CTP de Liberia que vincule tu cuenta.
                    </p>
                    <button class="btn btn-danger" onclick="cerrarSesionPortal()"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
                </div>
            </div>`;
    }
}

// ---------- Contador de notificaciones no leídas ----------

function cargarContadorNoLeidas() {
    const paras = [App.uid, App.estudiante.id, "todos"];
    db.collection("notificaciones").where("para", "in", paras).get()
        .then(qs => {
            let n = 0;
            qs.forEach(d => { if (!d.data().leida) n++; });
            const badge = document.getElementById("notifBadge");
            if (badge) {
                badge.style.display = n > 0 ? "inline-flex" : "none";
                badge.textContent = n > 99 ? "99+" : n;
            }
        })
        .catch(() => {});
}

// ---------- Notificación de préstamos vencidos / próximos a vencer ----------

function verificarPrestamosVencidosNotif() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const prestamos = App.prestamos || [];
    const atrasados = prestamos.filter(p => !p.devuelto && esAtrasado(p));
    if (atrasados.length > 0) {
        const libros = atrasados.map(p => p.libroTitulo || "Libro").join(", ");
        new Notification("Integra ID - Préstamos vencidos", {
            body: `Tienes ${atrasados.length} préstamo(s) vencido(s): ${libros}`,
            icon: "assets/logo.png"
        });
    }
    const proximos = prestamos.filter(p => {
        if (p.devuelto || !p.fechaVencimiento) return false;
        const diff = Math.ceil((new Date(p.fechaVencimiento) - new Date()) / 86400000);
        return diff >= 0 && diff <= 2;
    });
    if (proximos.length > 0) {
        const libros = proximos.map(p => p.libroTitulo || "Libro").join(", ");
        new Notification("Integra ID - Próximos a vencer", {
            body: `${proximos.length} préstamo(s) vence(n) pronto: ${libros}`,
            icon: "assets/logo.png"
        });
    }
}

// ---------- Arranque por página ----------

function iniciarApp(callback) {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
    aplicarTema(localStorage.getItem("portal_estudiantes_tema") || "oscuro");
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }
        App.uid = user.uid;
        cargarPerfilEstudiante(user).then(est => {
            if (!est) {
                renderSinVinculo();
                return;
            }
            cargarConfiguracion().then(() => {
                renderShell();
                cargarContadorNoLeidas();
                cargarPrestamosPropios().then(() => {
                    if (typeof verificarPrestamosVencidosNotif === "function") verificarPrestamosVencidosNotif();
                }).catch(() => {});
                if (typeof callback === "function") callback();
            }).catch(() => renderSinVinculo());
        }).catch(() => renderSinVinculo());
    });
}
