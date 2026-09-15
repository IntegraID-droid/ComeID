// =============================================
// ComeID - Dashboard y prediccion
// =============================================


        // Función para mostrar el dashboard
        function mostrarDashboard() {
            vistaActual = "dashboard";
            const trad = traducciones[configuracion.idioma];
            cargarScript(URL_CHART).catch(() => {});
            const becados = estudiantes.filter(e => e.tipo === "Becado").length;
            const pagan = estudiantes.filter(e => e.tipo === "Paga").length;
            const totalEstudiantes = estudiantes.length;

            // Calcular ganancias del día
            const hoy = new Date().toISOString().slice(0, 10);
            let estudiantesQueComieronHoy = 0;
            let gananciaBruta = 0;

            // Contar asistencias de hoy
            Promise.all([
                db.collection("asistencias")
                    .where("fecha", "==", hoy)
                    .get(),
                cargarInvitadosHoy()
            ]).then(resultados => {
                    const querySnapshot = resultados[0];
                    const invitadosHoy = resultados[1];
                    estudiantesQueComieronHoy = querySnapshot.size;
                    // Calcular ganancia bruta (estudiantes que pagan * precio)
                    const estudiantesPaganQueComieron = querySnapshot.docs.filter(doc => {
                        const asistencia = doc.data();
                        const estudiante = estudiantes.find(e => e.cedula === asistencia.cedula);
                        return (asistencia.tipo === "Paga") || (estudiante && estudiante.tipo === "Paga");
                    }).length;
                    gananciaBruta = estudiantesPaganQueComieron * configuracion.precio;

                    // Invitados externos registrados hoy (raciones regaladas del día)
                    const invitadosContHoy = invitadosHoy.length;
                    const invitadosRacionesHoy = invitadosHoy.reduce((suma, i) => suma + (Number(i.raciones) || 1), 0);

                    // Mostrar el dashboard SIN el resumen del comedor
                    document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.dashboardTitle}</h1>
                <div class="cards">
                    <div class="card">
                        <h3>${trad.cardBecadosTitle}</h3>
                        <span id="becados">${becados}</span>
                    </div>
                    <div class="card">
                        <h3>${trad.cardPaganTitle}</h3>
                        <span id="pagados">${pagan}</span>
                    </div>
                    <div class="card">
                        <h3>${trad.cardTotalTitle}</h3>
                        <span id="total">${totalEstudiantes}</span>
                    </div>
                    <div class="card">
                        <h3>${trad.cardHoyComieronTitle}</h3>
                        <span id="comedor">${estudiantesQueComieronHoy}</span>
                    </div>
                </div>

                <!-- Sección de Ganancias y Ocupación del Día -->
                <div class="panel" style="margin-top: 20px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 15px;">${trad.dashboardGananciasTitle || "Ganancias del Día"}</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px;">
                            <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.dashboardGananciaDia || "Ganancia del día"}:</p>
                            <p style="color: #10b981; font-size: 24px; font-weight: bold;">₡${gananciaBruta.toLocaleString()}</p>
                        </div>
                        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px;">
                            <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.dashboardEstudiantesPagan || "Estudiantes que pagan"}:</p>
                            <p style="color: var(--text-primary); font-size: 24px; font-weight: bold;">${estudiantesPaganQueComieron}</p>
                        </div>
                        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 15px;">
                            <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.dashboardInvitadosHoy || "Invitados hoy"}:</p>
                            <p style="color: var(--text-primary); font-size: 24px; font-weight: bold;">${invitadosContHoy}<span style="font-size: 14px; color: var(--text-secondary);"> · ${trad.invitadosRaciones || "raciones"}: ${invitadosRacionesHoy}</span></p>
                        </div>
                    </div>
                    <!-- Botón para limpiar asistencias del día -->
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="limpiarAsistenciasDelDia()" style="padding: 12px 25px; border: none; border-radius: 10px; background: var(--danger-color); color: white; font-weight: bold; cursor: pointer;">
                            <i class="fas fa-trash-alt"></i> ${trad.dashboardLimpiarBtn || "Limpiar Asistencias del Día"}
                        </button>
                    </div>
                </div>

                <!-- Gráficas -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px; margin-top: 20px;">
                    <div class="panel">
                        <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.dashboardGraficoGanancias || "Ganancias últimos 7 días"}</h2>
                        <div class="chart-container">
                            <canvas id="chartGanancias7"></canvas>
                        </div>
                    </div>
                    <div class="panel">
                        <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.dashboardGraficoNiveles || "Asistencias de hoy por nivel"}</h2>
                        <div class="chart-container">
                            <canvas id="chartNivelesHoy"></canvas>
                        </div>
                    </div>
                </div>
            `;

                    // Gráfica: ganancias de los últimos 7 días
                    const precio = Number(configuracion.precio) || 0;
                    db.collection("asistencias").where("fecha", ">=", fechaISOOffset(6)).get()
                        .then(qs7 => {
                            const pagantesPorDia = {};
                            qs7.forEach(doc => {
                                const a = doc.data();
                                if (!pagantesPorDia[a.fecha]) pagantesPorDia[a.fecha] = 0;
                                if (esPaganteAsistencia(a)) pagantesPorDia[a.fecha]++;
                            });
                            const labels7 = [];
                            const datos7 = [];
                            for (let i = 6; i >= 0; i--) {
                                const f = fechaISOOffset(i);
                                labels7.push(new Date(f + "T12:00:00").toLocaleDateString(configuracion.idioma === "es" ? "es-CR" : undefined, { weekday: "short", day: "numeric" }));
                                datos7.push((pagantesPorDia[f] || 0) * precio);
                            }
                            const ctx7 = document.getElementById("chartGanancias7");
                            if (ctx7 && typeof Chart !== "undefined") {
                                new Chart(ctx7, {
                                    type: "line",
                                    data: {
                                        labels: labels7,
                                        datasets: [{
                                            label: trad.scannerGanadoHoy || "Ganado hoy",
                                            data: datos7,
                                            borderColor: "#10b981",
                                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                                            fill: true,
                                            tension: 0.35,
                                            pointRadius: 4
                                        }]
                                    },
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { labels: { color: '#94a3b8' } } },
                                        scales: {
                                            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(0,0,0,0.1)' } },
                                            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                                        }
                                    }
                                });
                            }
                        })
                        .catch(error => console.error("Error al cargar gráfica de 7 días: ", error));

                    // Gráfica: asistencias de hoy por nivel
                    const porNivel = {};
                    querySnapshot.forEach(doc => {
                        const a = doc.data();
                        const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                        const nivel = estudiante ? (estudiante.nivel || "Sin nivel") : "Sin nivel";
                        porNivel[nivel] = (porNivel[nivel] || 0) + 1;
                    });
                    const nivelesLabels = Object.keys(porNivel).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
                    const ctxN = document.getElementById("chartNivelesHoy");
                    if (ctxN && typeof Chart !== "undefined") {
                        new Chart(ctxN, {
                            type: "bar",
                            data: {
                                labels: nivelesLabels,
                                datasets: [{
                                    label: trad.dashboardGraficoNiveles || "Asistencias de hoy por nivel",
                                    data: nivelesLabels.map(n => porNivel[n]),
                                    backgroundColor: "#2b67ff",
                                    borderRadius: 4
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(0,0,0,0.1)' } },
                                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                                }
                            }
                        });
                    }
                }).catch(error => {
                    console.error("Error al cargar asistencias del día: ", error);
                });
        }