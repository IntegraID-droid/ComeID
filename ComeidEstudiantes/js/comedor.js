// =============================================
// Portal Estudiantes - Mi comedor (solo lectura)
// =============================================

function renderComedor() {
    const est = App.estudiante;
    const c = document.getElementById("contenido");
    const asistencias = App.asistencias || [];
    const esBecado = est.tipo === "Becado";
    const precio = Number(App.configuracion?.precio) || 0;

    const totalConsumos = asistencias.length;
    const totalDias = new Set(asistencias.map(a => a.fecha)).size;

    const historial = asistencias.slice(0, 30);

    const menu = menuDeHoy();

    // Estadísticas para la gráfica (últimos 30 días)
    const hoy = new Date();
    const dias30 = [];
    const conteoPorDia = {};
    asistencias.forEach(a => { conteoPorDia[a.fecha] = (conteoPorDia[a.fecha] || 0) + 1; });
    for (let i = 29; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        const clave = d.toISOString().slice(0, 10);
        const nombreCorto = d.toLocaleDateString("es-CR", { weekday: "short", day: "numeric" });
        dias30.push({ fecha: clave, label: nombreCorto, total: conteoPorDia[clave] || 0 });
    }
    const maxConsumos = Math.max(1, ...dias30.map(d => d.total));
    const diasConConsumo = dias30.filter(d => d.total > 0).length;

    // Resumen semanal (días de la semana)
    const conteoPorSemana = {};
    const nombresDiasArr = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    asistencias.forEach(a => {
        const w = new Date(a.fecha + "T12:00:00").getDay();
        conteoPorSemana[w] = (conteoPorSemana[w] || 0) + 1;
    });
    const maxSemanal = Math.max(1, ...Object.values(conteoPorSemana));

    // Costo total estimado
    const costoTotal = esBecado ? 0 : totalConsumos * precio;

    c.innerHTML = `
        <div class="page-title">Mi comedor</div>
        <p class="page-subtitle">Resumen de tu alimentación en el comedor institucional.</p>

        <div class="card">
            <div class="stat-line">
                <span class="label"><i class="fa-solid fa-circle-check"></i> Estado</span>
                <span class="value">${esBecado ? "🟢 Becado" : "🟡 Pagado"}</span>
            </div>
            <div class="stat-line">
                <span class="label"><i class="fa-solid fa-bowl-food"></i> Total consumos</span>
                <span class="value">${totalConsumos}</span>
            </div>
            <div class="stat-line">
                <span class="label"><i class="fa-solid fa-calendar-check"></i> Días con asistencia</span>
                <span class="value">${totalDias}</span>
            </div>
            <div class="stat-line">
                <span class="label"><i class="fa-solid fa-money-bill-1"></i> ${esBecado ? "Tarifa" : "Costo estimado"}</span>
                <span class="value">${esBecado ? "₡0" : "₡" + costoTotal.toLocaleString("es-CR")}</span>
            </div>
        </div>

        ${menu ? `
        <div class="section-title"><i class="fa-solid fa-utensils"></i> Menú de hoy (${nombresDias()[new Date().getDay()]})</div>
        <div class="card">
            <div class="stat-line">
                <span class="label"><i class="fa-solid fa-mug-hot"></i> Desayuno</span>
                <span class="value">${escaparHTML(menu.desayuno || "—")}</span>
            </div>
            <div class="stat-line">
                <span class="label"><i class="fa-solid fa-utensils"></i> Almuerzo</span>
                <span class="value">${escaparHTML(menu.almuerzo || "—")}</span>
            </div>
        </div>` : `
        <div class="section-title"><i class="fa-solid fa-utensils"></i> Menú de hoy</div>
        <div class="card empty"><i class="fa-solid fa-utensils"></i> El menú aún no está disponible.</div>`}

        <div class="section-title"><i class="fa-solid fa-chart-bar"></i> Tu asistencia (últimos 30 días)</div>
        <div class="card" style="padding: 16px;">
            ${diasConConsumo === 0
                ? '<div class="card empty"><i class="fa-solid fa-chart-bar"></i> Aún no tienes datos suficientes para la gráfica.</div>'
                : `<div style="display: flex; align-items: flex-end; gap: 3px; height: 120px; overflow-x: auto; padding-bottom: 20px; position: relative;">
                    ${dias30.map(d => {
                        const h = d.total > 0 ? Math.max(12, (d.total / maxConsumos) * 100) : 0;
                        const color = d.total > 0 ? "#10b981" : "var(--bg-tertiary)";
                        return `<div title="${d.fecha}: ${d.total} consumo(s)" style="flex: 1; min-width: 8px; max-width: 20px; height: ${h}%; background: ${color}; border-radius: 3px 3px 0 0; transition: height 0.3s;"></div>`;
                    }).join("")}
                   </div>
                   <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
                       <span>${dias30[0]?.label || ""}</span>
                       <span>${dias30[dias30.length - 1]?.label || ""}</span>
                   </div>`
            }
        </div>

        <div class="section-title"><i class="fa-solid fa-calendar-week"></i> Asistencia por día de la semana</div>
        <div class="card" style="padding: 16px;">
            ${Object.keys(conteoPorSemana).length === 0
                ? '<div class="card empty"><i class="fa-solid fa-calendar-week"></i> Sin datos aún.</div>'
                : `<div style="display: flex; align-items: flex-end; gap: 10px; height: 100px;">
                    ${nombresDiasArr.map((nom, i) => {
                        const val = conteoPorSemana[i] || 0;
                        const h = val > 0 ? Math.max(12, (val / maxSemanal) * 100) : 0;
                        return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="font-size: 11px; color: var(--text-primary); font-weight: 600;">${val}</span>
                            <div style="width: 100%; height: ${h}%; min-height: 4px; background: #2b67ff; border-radius: 4px;"></div>
                            <span style="font-size: 10px; color: var(--text-secondary);">${nom}</span>
                        </div>`;
                    }).join("")}
                   </div>`
            }
        </div>

        <div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> Historial de consumos</div>
        ${historial.length === 0
            ? `<div class="card empty"><i class="fa-solid fa-bowl-food"></i> Aún no tienes consumos registrados.</div>`
            : `<div class="card" style="padding:8px;">
                ${historial.map(a => `
                    <div class="list-item" style="border:none; margin:0; padding:10px 6px;">
                        <div class="li-head">
                            <span class="li-title">Almuerzo</span>
                            <span class="badge badge-ok"><i class="fa-solid fa-circle-check"></i> Registrado</span>
                        </div>
                        <div class="li-date"><i class="fa-solid fa-calendar-day"></i> ${fechaLegible(a.fecha)} · ${escaparHTML(a.hora || "")}</div>
                    </div>`).join("")}
              </div>`}
    `;
}

const PAGE = {
    init: function () {
        mostrarCargando();
        cargarAsistenciasPropias().then(renderComedor).catch(renderComedor);
    }
};

iniciarApp(PAGE.init);
