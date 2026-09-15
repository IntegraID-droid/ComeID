// =============================================
// Portal Estudiantes - Dashboard principal
// =============================================

function renderDashboard() {
    const est = App.estudiante;
    const c = document.getElementById("contenido");

    const prestamos = App.prestamos || [];
    const activos = prestamos.filter(p => !p.devuelto);
    const atrasados = activos.filter(p => esAtrasado(p));
    const proximaVenc = activos
        .filter(p => p.fechaVencimiento)
        .sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento)))[0];

    const asistencias = App.asistencias || [];
    const diasDistintos = new Set(asistencias.map(a => a.fecha)).size;

    const reservasActivas = (App.reservas || []).filter(r => r.estado === "espera" || r.estado === "disponible");

    const seccion = est.seccion ? "Sección " + est.seccion : "CTP de Liberia";

    c.innerHTML = `
        <div class="greeting">
            <div class="hello">Hola, ${escaparHTML(est.nombre)} 👋</div>
            <div class="school">CTP de Liberia · ${escaparHTML(seccion)}</div>
        </div>

        <div class="grid">
            <a class="dash-card" href="perfil.html">
                <div class="dc-icon"><i class="fa-solid fa-user"></i></div>
                <div class="dc-title">Mi información</div>
                <div class="dc-desc">${escaparHTML(est.nombre)} · Cédula ${escaparHTML(est.cedula || "—")}</div>
                <div class="dc-link">Ver mi información <i class="fa-solid fa-arrow-right"></i></div>
            </a>

            <a class="dash-card" href="comedor.html">
                <div class="dc-icon"><i class="fa-solid fa-utensils"></i></div>
                <div class="dc-title">Mi comedor</div>
                <div class="dc-desc">${estadoBecario()} · ${asistencias.length} consumo(s) · ${diasDistintos} día(s)</div>
                <div class="dc-link">Ver comedor <i class="fa-solid fa-arrow-right"></i></div>
            </a>

            <a class="dash-card" href="biblioteca.html">
                <div class="dc-icon"><i class="fa-solid fa-book-open"></i></div>
                <div class="dc-title">Mi biblioteca</div>
                <div class="dc-desc">${activos.length} libro(s) en préstamo${atrasados.length ? " · " + atrasados.length + " atrasado(s)" : ""}${proximaVenc ? " · Vence el " + fechaLegible(proximaVenc.fechaVencimiento) : ""}</div>
                <div class="dc-link">Ver biblioteca <i class="fa-solid fa-arrow-right"></i></div>
            </a>

            <a class="dash-card" href="qr.html">
                <div class="dc-icon"><i class="fa-solid fa-qrcode"></i></div>
                <div class="dc-title">Mi código QR</div>
                <div class="dc-desc">Tu credencial estudiantil para el comedor y la biblioteca.</div>
                <div class="dc-link">Ver mi código <i class="fa-solid fa-arrow-right"></i></div>
            </a>
        </div>

        ${reservasActivas.length ? `
        <div class="section-title"><i class="fa-solid fa-bookmark"></i> Reservas activas</div>
        <div class="card">
            ${reservasActivas.map(r => `
                <div class="list-item" style="border:none; margin:0; padding:8px 0;">
                    <div class="li-head"><span class="li-title">${escaparHTML(r.libroTitulo || "Libro")}</span>
                        <span class="badge ${r.estado === "disponible" ? "badge-ok" : "badge-info"}">${r.estado === "disponible" ? "Disponible" : "En espera"}</span>
                    </div>
                    <div class="li-date"><i class="fa-solid fa-calendar-day"></i> ${fechaLegible(r.fecha)}</div>
                </div>`).join("")}
        </div>` : ""}
    `;
}

const PAGE = {
    init: function () {
        mostrarCargando();
        Promise.all([cargarPrestamosPropios(), cargarAsistenciasPropias(), cargarReservasPropias()])
            .then(renderDashboard)
            .catch(renderDashboard);
    }
};

iniciarApp(PAGE.init);
