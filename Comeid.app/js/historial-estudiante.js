// =============================================
// ComeID - Historial por estudiante y notas
// =============================================


        // =============================================
        // HISTORIAL POR ESTUDIANTE
        // Días asistidos, días ausentes y cantidad de comidas
        // =============================================

        function mostrarHistorialEstudiante() {
            vistaActual = "historialEstudiante";
            const trad = traducciones[configuracion.idioma];
            estudianteSeleccionadoHistorial = null;
            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.historialEstudianteTitle || "Historial por Estudiante"}</h1>
                <div class="panel" style="margin-top: 15px;">
                    <label for="historialEstBuscar" style="color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 6px;">${trad.historialEstSelecciona || "Busca y selecciona un estudiante"}</label>
                    <input type="text" id="historialEstBuscar" placeholder="${trad.historialEstBuscar || "Buscar estudiante por nombre o cédula..."}" oninput="buscarEstudianteHistorial()" style="padding: 12px; border-radius: 10px; background: #111d55; border: none; color: white; width: 100%; font-size: 14px; margin-bottom: 10px;">
                    <div id="historialEstResultados"></div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 10px;">
                        <label style="color: var(--text-secondary); font-weight: 600;">${trad.historialEstDesde || "Desde"}:</label>
                        <input type="date" id="historialEstDesde" onchange="actualizarHistorialEstudiante()" style="padding: 10px; border-radius: 8px; background: #111d55; border: none; color: white; font-size: 14px;">
                        <label style="color: var(--text-secondary); font-weight: 600;">${trad.historialEstHasta || "Hasta"}:</label>
                        <input type="date" id="historialEstHasta" onchange="actualizarHistorialEstudiante()" style="padding: 10px; border-radius: 8px; background: #111d55; border: none; color: white; font-size: 14px;">
                    </div>
                </div>
                <div id="historialEstDetalle">
                    <p class="scanner-lista-vacia" style="margin-top: 15px;">${trad.historialEstSelecciona || "Escribe el nombre o la cédula para buscar y selecciona un estudiante"}</p>
                </div>
            `;

            // Rango de fechas por defecto: desde la primera asistencia hasta hoy
            db.collection("asistencias").get().then(qs => {
                let min = null;
                let max = null;
                qs.forEach(doc => {
                    const f = doc.data().fecha;
                    if (!f) return;
                    if (!min || f < min) min = f;
                    if (!max || f > max) max = f;
                });
                const hoy = new Date().toISOString().slice(0, 10);
                document.getElementById("historialEstDesde").value = min || fechaISOOffset(30);
                document.getElementById("historialEstHasta").value = max || hoy;
            }).catch(error => {
                console.error("Error al cargar fechas del historial: ", error);
            });
        }


        function buscarEstudianteHistorial() {
            const trad = traducciones[configuracion.idioma];
            const termino = document.getElementById("historialEstBuscar").value.trim().toLowerCase();
            const contenedor = document.getElementById("historialEstResultados");
            if (!contenedor) return;
            if (!termino) {
                contenedor.innerHTML = "";
                return;
            }
            const coincidencias = estudiantes
                .filter(e => (e.nombre || "").toLowerCase().includes(termino) || String(e.cedula || "").toLowerCase().includes(termino))
                .slice(0, 8);
            if (coincidencias.length === 0) {
                contenedor.innerHTML = `<p class="scanner-lista-vacia">${trad.notificacionEstudianteNoEncontrado || "No se encontró el estudiante"}</p>`;
                return;
            }
            contenedor.innerHTML = coincidencias.map((e, i) => {
                const indice = estudiantes.indexOf(e);
                return `
                    <div onclick="seleccionarEstudianteHistorial(${indice})" style="cursor: pointer; padding: 9px 12px; background: #111d55; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-primary); font-weight: 600;">${e.nombre}</span>
                        <span style="color: var(--text-secondary); font-size: 12px;">${e.cedula} · ${e.seccion || ""}</span>
                    </div>
                `;
            }).join("");
        }


        function seleccionarEstudianteHistorial(indice) {
            const e = estudiantes[indice];
            if (!e) return;
            estudianteSeleccionadoHistorial = e;
            const buscar = document.getElementById("historialEstBuscar");
            if (buscar) buscar.value = e.nombre;
            const contenedor = document.getElementById("historialEstResultados");
            if (contenedor) contenedor.innerHTML = "";
            actualizarHistorialEstudiante();
        }


        // Consulta el historial de un estudiante en el rango de fechas indicado
        function obtenerHistorialEstudiante(e, desde, hasta) {
            return db.collection("asistencias").get().then(qs => {
                const fechasComedor = new Set();
                const fechasEstudiante = new Set();
                const registrosEstudiante = [];
                qs.forEach(doc => {
                    const a = doc.data();
                    if (!a.fecha) return;
                    if (desde && a.fecha < desde) return;
                    if (hasta && a.fecha > hasta) return;
                    fechasComedor.add(a.fecha);
                    if (a.cedula === e.cedula) {
                        fechasEstudiante.add(a.fecha);
                        registrosEstudiante.push({ id: doc.id, ...a });
                    }
                });
                registrosEstudiante.sort((x, y) => (x.fecha + " " + (x.hora || "")).localeCompare(y.fecha + " " + (y.hora || "")));
                const diasAsistidos = fechasEstudiante.size;
                const diasOperados = fechasComedor.size;
                const diasAusentes = Math.max(0, diasOperados - diasAsistidos);
                return {
                    diasAsistidos,
                    diasOperados,
                    diasAusentes,
                    comidas: registrosEstudiante.length,
                    fechasEstudiante: [...fechasEstudiante].sort(),
                    registrosEstudiante
                };
            });
        }


        function actualizarHistorialEstudiante() {
            const trad = traducciones[configuracion.idioma];
            const e = estudianteSeleccionadoHistorial;
            const detalle = document.getElementById("historialEstDetalle");
            if (!detalle) return;
            if (!e) {
                detalle.innerHTML = `<p class="scanner-lista-vacia" style="margin-top: 15px;">${trad.historialEstSelecciona || "Selecciona un estudiante"}</p>`;
                return;
            }
            const desde = document.getElementById("historialEstDesde").value;
            const hasta = document.getElementById("historialEstHasta").value;
            detalle.innerHTML = `<p class="scanner-lista-vacia" style="margin-top: 15px;">Cargando...</p>`;

            obtenerHistorialEstudiante(e, desde, hasta).then(r => {
                const diasAsistidos = r.diasAsistidos;
                const diasOperados = r.diasOperados;
                const diasAusentes = r.diasAusentes;
                const comidas = r.comidas;
                const fechasEstudiante = r.fechasEstudiante;

                detalle.innerHTML = `
                    <div class="panel" style="margin-top: 15px;">
                        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                ${e.foto ? `<img src="${e.foto}" alt="" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-color);">` : `<div style="width: 56px; height: 56px; border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 22px;"><i class="fas fa-user"></i></div>`}
                                <h2 style="color: var(--accent-color); margin: 0;">${e.nombre}</h2>
                            </div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn-export-scanner" onclick="exportarHistorialEstudianteExcel()">
                                    <i class="fas fa-file-excel"></i> <span>${trad.historialEstExcel || "Excel"}</span>
                                </button>
                                <button class="btn-export-scanner" onclick="exportarHistorialEstudiantePDF()">
                                    <i class="fas fa-file-pdf"></i> <span>${trad.historialEstPDF || "PDF"}</span>
                                </button>
                            </div>
                        </div>
                        <p style="color: var(--text-secondary);">
                            <strong>${trad.tablaQR || "Cédula"}:</strong> ${e.cedula} &nbsp;|&nbsp;
                            <strong>${trad.tablaSeccion || "Sección"}:</strong> ${e.seccion || "N/A"} &nbsp;|&nbsp;
                            <strong>${trad.tablaNivel || "Nivel"}:</strong> ${e.nivel || "N/A"} &nbsp;|&nbsp;
                            <strong>${trad.tablaTipo || "Tipo"}:</strong> <span class="tipo-badge ${e.tipo === "Becado" ? "becado" : "paga"}">${e.tipo === "Becado" ? (trad.formTipoBecado || "Becado") : (trad.formTipoPaga || "Paga")}</span>
                        </p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 15px;">
                        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 16px; text-align: center;">
                            <p style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">${trad.historialEstAsistidos || "Días asistidos"}</p>
                            <p style="color: #10b981; font-size: 30px; font-weight: bold;">${diasAsistidos}</p>
                        </div>
                        <div style="background: rgba(198, 40, 40, 0.12); border: 1px solid rgba(198, 40, 40, 0.35); border-radius: 12px; padding: 16px; text-align: center;">
                            <p style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">${trad.historialEstAusentes || "Días ausentes"}</p>
                            <p style="color: #ef5350; font-size: 30px; font-weight: bold;">${diasAusentes}</p>
                        </div>
                        <div style="background: rgba(43, 103, 255, 0.12); border: 1px solid rgba(43, 103, 255, 0.35); border-radius: 12px; padding: 16px; text-align: center;">
                            <p style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">${trad.historialEstComidas || "Cantidad de comidas"}</p>
                            <p style="color: #60a5fa; font-size: 30px; font-weight: bold;">${comidas}</p>
                        </div>
                        <div style="background: rgba(255, 193, 7, 0.12); border: 1px solid rgba(255, 193, 7, 0.35); border-radius: 12px; padding: 16px; text-align: center;">
                            <p style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">${trad.historialEstOperados || "Días operados"}</p>
                            <p style="color: #fbbf24; font-size: 30px; font-weight: bold;">${diasOperados}</p>
                        </div>
                    </div>
                    <div class="panel" style="margin-top: 15px;">
                        <h2 style="color: var(--accent-color); margin-bottom: 8px;">${trad.historialEstNota || "Nota / Observación"}</h2>
                        <textarea id="notaEstudiante" placeholder="${trad.historialEstNotaPlaceholder || "Escribe una observación para este estudiante..."}" style="width: 100%; min-height: 80px; padding: 12px; border-radius: 10px; background: #111d55; border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; resize: vertical; box-sizing: border-box;"></textarea>
                        <button class="btn-export-scanner" style="margin-top: 10px;" onclick="guardarNotaEstudiante()">
                            <i class="fas fa-save"></i> <span>${trad.historialEstGuardarNota || "Guardar nota"}</span>
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
                        <div class="panel">
                            <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.historialEstGrafico || "Asistencia"}</h2>
                            <div class="chart-container" style="height: 240px;">
                                <canvas id="chartHistorialEst"></canvas>
                            </div>
                        </div>
                        <div class="panel">
                            <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.historialFecha || "Fecha"}s ${trad.historialEstAsistencia || "de asistencia"}</h2>
                            ${diasAsistidos === 0 ? `<p class="scanner-lista-vacia">${trad.scannerListaVacia || "Sin asistencias"}</p>` :
                                `<div style="max-height: 240px; overflow-y: auto;">${fechasEstudiante.map(f => `
                                    <div style="display: flex; justify-content: space-between; padding: 7px 10px; background: #111d55; border-radius: 8px; margin-bottom: 5px; font-size: 13px;">
                                        <span style="color: var(--text-primary);">${new Date(f + "T12:00:00").toLocaleDateString()}</span>
                                        <span style="color: #10b981; font-weight: 600;">✓</span>
                                    </div>
                                `).join("")}</div>`}
                        </div>
                    </div>
                `;
                cargarNotaEstudiante(e);
                cargarScript(URL_CHART).catch(() => {});

                if (typeof Chart !== "undefined" && diasOperados > 0) {
                    const ctx = document.getElementById("chartHistorialEst");
                    if (ctx) {
                        new Chart(ctx, {
                            type: "doughnut",
                            data: {
                                labels: [trad.historialEstAsistidos || "Días asistidos", trad.historialEstAusentes || "Días ausentes"],
                                datasets: [{
                                    data: [diasAsistidos, diasAusentes],
                                    backgroundColor: ["#10b981", "#ef5350"],
                                    borderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: "bottom", labels: { color: "#94a3b8" } } }
                            }
                        });
                    }
                }
            }).catch(error => {
                detalle.innerHTML = `<p class="scanner-lista-vacia">${trad.notificacionError}: ${error.message}</p>`;
                console.error("Error al cargar historial del estudiante: ", error);
            });
        }


        // Carga la nota guardada del estudiante (colección "notas")
        function cargarNotaEstudiante(e) {
            const ta = document.getElementById("notaEstudiante");
            if (!ta) return;
            db.collection("notas").doc(e.cedula).get().then(snap => {
                if (snap.exists && document.getElementById("notaEstudiante")) {
                    document.getElementById("notaEstudiante").value = snap.data().nota || "";
                }
            }).catch(error => {
                console.error("Error al cargar nota del estudiante: ", error);
            });
        }


        // Guarda la nota/observación del estudiante en Firestore
        function guardarNotaEstudiante() {
            const trad = traducciones[configuracion.idioma];
            const e = estudianteSeleccionadoHistorial;
            if (!e) {
                mostrarNotificacion(trad.historialEstSelecciona || "Selecciona un estudiante", "error");
                return;
            }
            const ta = document.getElementById("notaEstudiante");
            const nota = ta ? ta.value : "";
            db.collection("notas").doc(e.cedula).set({
                cedula: e.cedula,
                nombre: e.nombre,
                nota: nota,
                actualizada: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                mostrarNotificacion(trad.historialEstNotaGuardada || "Nota guardada");
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al guardar nota del estudiante: ", error);
            });
        }


        // Exporta a Excel el historial del estudiante seleccionado
        async function exportarHistorialEstudianteExcel() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_XLSX);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const e = estudianteSeleccionadoHistorial;
            if (!e) { mostrarNotificacion(trad.historialEstSelecciona || "Selecciona un estudiante", "error"); return; }
            const desde = document.getElementById("historialEstDesde").value;
            const hasta = document.getElementById("historialEstHasta").value;
            obtenerHistorialEstudiante(e, desde, hasta).then(r => {
                const wb = XLSX.utils.book_new();
                const tipoTexto = e.tipo === "Becado" ? (trad.formTipoBecado || "Becado") : (trad.formTipoPaga || "Paga");
                const filas = [
                    [configuracion.institucion || ""],
                    [configuracion.comedor || "Comedor Institucional"],
                    [`${trad.historialEstudianteTitle || "Historial por Estudiante"}: ${e.nombre}`],
                    [`${trad.tablaQR || "Cédula"}: ${e.cedula} | ${trad.tablaSeccion || "Sección"}: ${e.seccion || ""} | ${trad.tablaNivel || "Nivel"}: ${e.nivel || ""} | ${trad.tablaTipo || "Tipo"}: ${tipoTexto}`],
                    [`${trad.historialEstDesde || "Desde"}: ${desde || "-"} | ${trad.historialEstHasta || "Hasta"}: ${hasta || "-"}`],
                    [],
                    [`${trad.historialEstAsistidos || "Días asistidos"}: ${r.diasAsistidos} | ${trad.historialEstAusentes || "Días ausentes"}: ${r.diasAusentes} | ${trad.historialEstComidas || "Cantidad de comidas"}: ${r.comidas} | ${trad.historialEstOperados || "Días operados"}: ${r.diasOperados}`],
                    [],
                    [trad.historialFecha || "Fecha", "Hora", trad.tablaQR || "Cédula", trad.tablaNombre || "Nombre", trad.tablaSeccion || "Sección", trad.tablaNivel || "Nivel", trad.tablaTipo || "Tipo"]
                ];
                r.registrosEstudiante.forEach(a => {
                    filas.push([a.fecha, a.hora || "", e.cedula, e.nombre, e.seccion || "", e.nivel || "", tipoTexto]);
                });
                if (r.registrosEstudiante.length === 0) {
                    filas.push([trad.scannerListaVacia || "Sin asistencias"]);
                }
                const ws = XLSX.utils.aoa_to_sheet(filas);
                ws["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
                XLSX.utils.book_append_sheet(wb, ws, "Historial");
                XLSX.writeFile(wb, `Historial_${e.cedula}.xlsx`);
                mostrarNotificacion(`${trad.historialEstudianteTitle || "Historial"} → Excel`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar Excel del historial: ", error);
            });
        }


        // Exporta a PDF el historial del estudiante seleccionado
        async function exportarHistorialEstudiantePDF() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_JSPDF);
                await cargarScript(URL_JSPDF_AUTOTABLE);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const e = estudianteSeleccionadoHistorial;
            if (!e) { mostrarNotificacion(trad.historialEstSelecciona || "Selecciona un estudiante", "error"); return; }
            const desde = document.getElementById("historialEstDesde").value;
            const hasta = document.getElementById("historialEstHasta").value;
            obtenerHistorialEstudiante(e, desde, hasta).then(r => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.setFontSize(15);
                doc.setTextColor(22, 91, 211);
                doc.text(configuracion.institucion || "ComeID", 14, 14);
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.text(configuracion.comedor || "Comedor Institucional", 14, 20);
                doc.setFontSize(10);
                doc.text(`${trad.historialEstudianteTitle || "Historial por Estudiante"}: ${e.nombre}`, 14, 26);
                doc.text(`${trad.tablaQR || "Cédula"}: ${e.cedula} | ${trad.tablaSeccion || "Sección"}: ${e.seccion || ""} | ${trad.tablaNivel || "Nivel"}: ${e.nivel || ""}`, 14, 32);
                doc.text(`${trad.historialEstDesde || "Desde"}: ${desde || "-"} | ${trad.historialEstHasta || "Hasta"}: ${hasta || "-"}`, 14, 38);
                doc.text(`${trad.historialEstAsistidos || "Días asistidos"}: ${r.diasAsistidos} | ${trad.historialEstAusentes || "Días ausentes"}: ${r.diasAusentes} | ${trad.historialEstComidas || "Cantidad de comidas"}: ${r.comidas}`, 14, 44);
                const headers = [[trad.historialFecha || "Fecha", "Hora", trad.tablaSeccion || "Sección", trad.tablaNivel || "Nivel", trad.tablaTipo || "Tipo"]];
                const data = r.registrosEstudiante.map(a => {
                    const tipoTexto = e.tipo === "Becado" ? (trad.formTipoBecado || "Becado") : (trad.formTipoPaga || "Paga");
                    return [a.fecha, a.hora || "", e.seccion || "", e.nivel || "", tipoTexto];
                });
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 50,
                    styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak', halign: 'left', textColor: 0 },
                    headStyles: { fillColor: [22, 91, 211], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [235, 240, 250] }
                });
                doc.save(`Historial_${e.cedula}.pdf`);
                mostrarNotificacion(`${trad.historialEstudianteTitle || "Historial"} → PDF`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar PDF del historial: ", error);
            });
        }