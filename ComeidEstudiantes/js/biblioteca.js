// =============================================
// Portal Estudiantes - Mi biblioteca (solo lectura)
// =============================================

function renderBiblioteca() {
    const c = document.getElementById("contenido");
    const prestamos = App.prestamos || [];
    const activos = prestamos.filter(p => !p.devuelto);
    const atrasados = activos.filter(esAtrasado);
    const proximosAVencer = activos.filter(p => {
        if (!p.fechaVencimiento || esAtrasado(p)) return false;
        const diff = Math.ceil((new Date(p.fechaVencimiento) - new Date()) / 86400000);
        return diff <= 3;
    });
    const proximaVenc = activos
        .filter(p => p.fechaVencimiento)
        .sort((a, b) => String(a.fechaVencimiento).localeCompare(String(b.fechaVencimiento)))[0];

    const reservas = (App.reservas || []).filter(r => r.estado === "espera" || r.estado === "disponible");

    const filasHistorial = prestamos.map(p => {
        const est = estadoPrestamo(p);
        return `<tr>
            <td>${escaparHTML(p.libroTitulo || "—")}</td>
            <td>${fechaLegible(p.fechaPrestamo)}</td>
            <td>${fechaLegible(p.fechaVencimiento)}</td>
            <td><span class="badge ${est.clase}">${est.texto}</span></td>
        </tr>`;
    }).join("");

    c.innerHTML = `
        <div class="page-title">Mi biblioteca</div>
        <p class="page-subtitle">Préstamos, devoluciones y reservas en BiblioGest.</p>

        ${atrasados.length > 0 ? `
        <div style="background: rgba(198,40,40,0.12); border: 1px solid rgba(198,40,40,0.4); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #ef5350; font-weight: 700; font-size: 14px;">
                <i class="fa-solid fa-triangle-exclamation"></i> ${atrasados.length} préstamo(s) vencido(s)
            </div>
            <p style="color: var(--text-secondary); font-size: 12px; margin-top: 6px;">Devuelve los libros lo antes posible para evitar restricciones en futuros préstamos.</p>
        </div>` : ""}

        ${proximosAVencer.length > 0 ? `
        <div style="background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.4); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #fbbf24; font-weight: 700; font-size: 14px;">
                <i class="fa-solid fa-clock"></i> ${proximosAVencer.length} préstamo(s) vence(n) pronto
            </div>
            <p style="color: var(--text-secondary); font-size: 12px; margin-top: 6px;">${proximosAVencer.map(p => `"${escaparHTML(p.libroTitulo)}" vence el ${fechaLegible(p.fechaVencimiento)}`).join("; ")}.</p>
        </div>` : ""}

        <div class="grid grid-3" style="margin-bottom:4px;">
            <div class="card" style="text-align:center; margin:0;">
                <div style="font-size:26px; font-weight:800; color:var(--accent-color);">${activos.length}</div>
                <div style="color:var(--text-secondary); font-size:12px;">Libros prestados</div>
            </div>
            <div class="card" style="text-align:center; margin:0;">
                <div style="font-size:26px; font-weight:800; color:${atrasados.length ? "var(--danger-color)" : "var(--ok-color)"};">${atrasados.length}</div>
                <div style="color:var(--text-secondary); font-size:12px;">Vencidos</div>
            </div>
            <div class="card" style="text-align:center; margin:0;">
                <div style="font-size:26px; font-weight:800; color:var(--text-primary);">${proximaVenc ? fechaLegible(proximaVenc.fechaVencimiento) : "—"}</div>
                <div style="color:var(--text-secondary); font-size:12px;">Próxima devolución</div>
            </div>
        </div>

        <div class="section-title"><i class="fa-solid fa-book-open"></i> Mis préstamos activos</div>
        ${activos.length === 0
            ? `<div class="card empty"><i class="fa-solid fa-book-open"></i> No tienes libros en préstamo.</div>`
            : activos.map(p => {
                const est = estadoPrestamo(p);
                const diasRest = p.fechaVencimiento ? Math.ceil((new Date(p.fechaVencimiento) - new Date()) / 86400000) : null;
                const esProximo = diasRest !== null && diasRest >= 0 && diasRest <= 3;
                const borderStyle = esAtrasado(p) ? "border-left: 3px solid #ef5350;" : esProximo ? "border-left: 3px solid #fbbf24;" : "";
                return `<div class="list-item" style="${borderStyle}">
                    <div class="li-head">
                        <span class="li-title">${escaparHTML(p.libroTitulo)}</span>
                        <span class="badge ${est.clase}">${est.texto}</span>
                    </div>
                    <div class="li-sub">
                        Préstamo: ${fechaLegible(p.fechaPrestamo)}<br>
                        Devolución: ${fechaLegible(p.fechaVencimiento)}
                        ${esAtrasado(p) ? `<br><span style="color:var(--danger-color); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> ${diasAtraso(p)} día(s) de atraso</span>` : ""}
                        ${esProximo && !esAtrasado(p) ? `<br><span style="color:#fbbf24; font-weight:600;"><i class="fa-solid fa-clock"></i> Vence en ${diasRest} día(s)</span>` : ""}
                    </div>
                </div>`;
            }).join("")}

        <div class="section-title"><i class="fa-solid fa-bookmark"></i> Mis reservas</div>
        ${reservas.length === 0
            ? `<div class="card empty"><i class="fa-solid fa-bookmark"></i> No tienes reservas.</div>`
            : reservas.map(r => `
                <div class="list-item">
                    <div class="li-head">
                        <span class="li-title">${escaparHTML(r.libroTitulo || "Libro")}</span>
                        <span class="badge ${r.estado === "disponible" ? "badge-ok" : "badge-info"}">${r.estado === "disponible" ? "Disponible" : "En espera"}</span>
                    </div>
                    <div class="li-date"><i class="fa-solid fa-calendar-day"></i> Reservado el ${fechaLegible(r.fecha)}</div>
                </div>`).join("")}

        <div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> Historial de préstamos</div>
        ${prestamos.length === 0
            ? `<div class="card empty"><i class="fa-solid fa-clock-rotate-left"></i> No hay préstamos registrados.</div>`
            : `<div class="table-wrap"><table class="data">
                <thead><tr><th>LIBRO</th><th>PRÉSTAMO</th><th>DEVOLUCIÓN</th><th>ESTADO</th></tr></thead>
                <tbody>${filasHistorial}</tbody>
              </table></div>`}
    `;
}

const PAGE = {
    init: function () {
        mostrarCargando();
        Promise.all([cargarPrestamosPropios(), cargarReservasPropias()])
            .then(renderBiblioteca)
            .catch(renderBiblioteca);
    }
};

iniciarApp(PAGE.init);
