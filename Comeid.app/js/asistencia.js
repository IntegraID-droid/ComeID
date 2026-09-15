// =============================================
// ComeID - Historial diario, listas y exportaciones
// =============================================


        // Función para exportar la lista de asistencias del día a CSV (abre en Excel)
        function exportarListaDelDiaCSV() {
            const trad = traducciones[configuracion.idioma];
            const hoy = new Date().toISOString().slice(0, 10);

            obtenerResumenDelDia(hoy).then(resumen => {
                if (resumen.total === 0) {
                    mostrarNotificacion(trad.scannerListaVacia || "No hay asistencias registradas hoy", "error");
                    return;
                }
                const filas = [
                    [`Ganancia del día: ₡${resumen.ganancia.toLocaleString()} | ${trad.historialTotal || "Total atendidos"}: ${resumen.total} | Pagantes: ${resumen.pagantes} | Becados: ${resumen.becados}`],
                    [],
                    ["Hora", "Nombre", "Seccion", "Tipo", "Cedula"]
                ];
                resumen.asistencias.forEach(a => {
                    const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                    const nombre = a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "";
                    const seccion = a.seccion || (estudiante ? estudiante.seccion : "") || "";
                    const tipo = esPaganteAsistencia(a) ? (trad.formTipoPaga || "Paga") : (trad.formTipoBecado || "Becado");
                    filas.push([a.hora || "", nombre, seccion, tipo, a.cedula || ""]);
                });

                const csv = filas.map(fila => fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join(",")).join("\r\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement("a");
                enlace.href = url;
                enlace.download = `asistencias_${hoy}.csv`;
                document.body.appendChild(enlace);
                enlace.click();
                document.body.removeChild(enlace);
                URL.revokeObjectURL(url);
                mostrarNotificacion(`${trad.scannerListaTitle || "Lista del Día"} ${hoy} → ${enlace.download}`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar la lista del día: ", error);
            });
        }


        // Carga las asistencias de una fecha con el resumen (ganancia, pagantes, becados)
        function obtenerResumenDelDia(fechaISO) {
            return db.collection("asistencias").where("fecha", "==", fechaISO).get().then(querySnapshot => {
                const asistencias = [];
                querySnapshot.forEach(doc => asistencias.push({ id: doc.id, ...doc.data() }));
                asistencias.sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
                let pagantes = 0;
                let becados = 0;
                asistencias.forEach(a => {
                    if (esPaganteAsistencia(a)) { pagantes++; } else { becados++; }
                });
                const precio = Number(configuracion.precio) || 0;
                const ganancia = pagantes * precio;
                return { asistencias, pagantes, becados, ganancia, total: asistencias.length, precio, fecha: fechaISO };
            });
        }


        // Función para exportar la lista del día a Excel con la ganancia del día
        async function exportarListaDelDiaExcel() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_XLSX);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const hoy = new Date().toISOString().slice(0, 10);
            obtenerResumenDelDia(hoy).then(resumen => {
                if (resumen.total === 0) {
                    mostrarNotificacion(trad.scannerListaVacia || "No hay asistencias registradas hoy", "error");
                    return;
                }
                const wb = XLSX.utils.book_new();
                const filas = [
                    [configuracion.institucion || ""],
                    [configuracion.comedor || "Comedor Institucional"],
                    [`${trad.historialFecha || "Fecha"}: ${new Date().toLocaleDateString()}`],
                    [],
                    [`Ganancia del día: ₡${resumen.ganancia.toLocaleString()}`],
                    [`${trad.historialTotal || "Total atendidos"}: ${resumen.total} | Pagantes: ${resumen.pagantes} | Becados: ${resumen.becados}`],
                    [],
                    ["Hora", "Nombre", "Sección", "Nivel", "Tipo"]
                ];
                resumen.asistencias.forEach(a => {
                    const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                    const nombre = a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "";
                    const seccion = a.seccion || (estudiante ? estudiante.seccion : "") || "";
                    const nivel = estudiante ? (estudiante.nivel || "N/A") : "N/A";
                    const tipo = esPaganteAsistencia(a) ? (trad.formTipoPaga || "Paga") : (trad.formTipoBecado || "Becado");
                    filas.push([a.hora || "", nombre, seccion, nivel, tipo]);
                });
                filas.push([]);
                filas.push([`TOTAL GANANCIA DEL DÍA: ₡${resumen.ganancia.toLocaleString()}`]);
                const ws = XLSX.utils.aoa_to_sheet(filas);
                ws["!cols"] = [{ wch: 12 }, { wch: 34 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
                XLSX.utils.book_append_sheet(wb, ws, "Reporte del Día");
                XLSX.writeFile(wb, `Reporte_del_Dia_${hoy}.xlsx`);
                mostrarNotificacion(`${trad.scannerListaTitle || "Lista del Día"} → Excel`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar Excel del día: ", error);
            });
        }


        // Función para exportar la lista del día a PDF con la ganancia del día
        async function exportarListaDelDiaPDF() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_JSPDF);
                await cargarScript(URL_JSPDF_AUTOTABLE);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const hoy = new Date().toISOString().slice(0, 10);
            obtenerResumenDelDia(hoy).then(resumen => {
                if (resumen.total === 0) {
                    mostrarNotificacion(trad.scannerListaVacia || "No hay asistencias registradas hoy", "error");
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.setFontSize(15);
                doc.setTextColor(22, 91, 211);
                doc.text(configuracion.institucion || "ComeID", 14, 14);
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.text(configuracion.comedor || "Comedor Institucional", 14, 20);
                doc.setFontSize(10);
                doc.text(`${trad.historialFecha || "Fecha"}: ${new Date().toLocaleDateString()}`, 14, 26);
                doc.text(`Ganancia del día: ₡${resumen.ganancia.toLocaleString()}`, 14, 32);
                doc.text(`${trad.historialTotal || "Total atendidos"}: ${resumen.total} | Pagantes: ${resumen.pagantes} | Becados: ${resumen.becados}`, 14, 37);
                const headers = [["Hora", "Nombre", "Sección", "Nivel", "Tipo"]];
                const data = resumen.asistencias.map(a => {
                    const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                    const nombre = a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "";
                    const seccion = a.seccion || (estudiante ? estudiante.seccion : "") || "";
                    const nivel = estudiante ? (estudiante.nivel || "N/A") : "N/A";
                    const tipo = esPaganteAsistencia(a) ? (trad.formTipoPaga || "Paga") : (trad.formTipoBecado || "Becado");
                    return [a.hora || "", nombre, seccion, nivel, tipo];
                });
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 42,
                    styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', textColor: 0 },
                    headStyles: { fillColor: [22, 91, 211], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [235, 240, 250] }
                });
                const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 42) + 10;
                doc.setFontSize(12);
                doc.setTextColor(22, 91, 211);
                doc.text(`TOTAL GANANCIA DEL DÍA: ₡${resumen.ganancia.toLocaleString()}`, 14, finalY);
                doc.save(`Reporte_del_Dia_${hoy}.pdf`);
                mostrarNotificacion(`${trad.scannerListaTitle || "Lista del Día"} → PDF`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al exportar PDF del día: ", error);
            });
        }


        // Función para mostrar el historial de asistencias por fecha
        function mostrarHistorial() {
            vistaActual = "historial";
            const trad = traducciones[configuracion.idioma];
            const hoy = new Date().toISOString().slice(0, 10);
            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.historialTitle || "Registro de Asistencias"}</h1>
                <div class="panel" style="margin-top: 15px;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 15px;">
                        <label for="historialFechaInput" style="color: var(--text-secondary); font-weight: 600;">${trad.historialFecha || "Fecha"}:</label>
                        <input type="date" id="historialFechaInput" value="${hoy}" onchange="cargarHistorial()" style="padding: 10px; border-radius: 8px; background: #111d55; border: none; color: white; font-size: 14px;">
                        <button class="btn-export-scanner" onclick="exportarHistorial()">
                            <i class="fas fa-file-excel"></i> <span>Excel</span>
                        </button>
                        <button class="btn-export-scanner" onclick="exportarHistorialPDF()">
                            <i class="fas fa-file-pdf"></i> <span>PDF</span>
                        </button>
                    </div>
                    <div id="historialResumen" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 15px;"></div>
                    <div class="panel" style="margin-top: 15px;">
                        <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.wasteTitle || "Predicción de Desperdicio"}</h2>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                            <label style="color: var(--text-secondary); font-weight: 600;">${trad.wastePreparados || "Comidas preparadas"}:</label>
                            <input type="number" id="inventarioPreparados" min="0" value="0" style="width: 110px; padding: 10px; border-radius: 8px; background: #111d55; border: none; color: white; font-size: 14px;">
                            <label style="color: var(--text-secondary); font-weight: 600;">${trad.wasteSobrantes || "Sobrantes"}:</label>
                            <input type="number" id="inventarioSobrantes" min="0" value="0" style="width: 110px; padding: 10px; border-radius: 8px; background: #111d55; border: none; color: white; font-size: 14px;">
                            <button class="btn-export-scanner" onclick="guardarInventarioDia()">
                                <i class="fas fa-utensils"></i> <span>${trad.wasteGuardar || "Guardar inventario"}</span>
                            </button>
                        </div>
                    </div>
                    <div id="historialLista"></div>
                </div>
            `;
            cargarHistorial();
        }


        // Carga el historial de la fecha seleccionada
        function cargarHistorial() {
            const trad = traducciones[configuracion.idioma];
            const fecha = document.getElementById("historialFechaInput").value || new Date().toISOString().slice(0, 10);
            const resumenDiv = document.getElementById("historialResumen");
            const listaDiv = document.getElementById("historialLista");
            resumenDiv.innerHTML = `<p class="scanner-lista-vacia">Cargando...</p>`;
            listaDiv.innerHTML = "";

            db.collection("inventario").doc(fecha).get().then(snap => {
                const inv = snap.exists ? snap.data() : null;
                if (document.getElementById("inventarioPreparados")) {
                    document.getElementById("inventarioPreparados").value = inv ? (inv.preparados || 0) : 0;
                }
                if (document.getElementById("inventarioSobrantes")) {
                    document.getElementById("inventarioSobrantes").value = inv ? (inv.sobrantes || 0) : 0;
                }
            }).catch(error => console.error("Error al cargar inventario: ", error));

            obtenerResumenDelDia(fecha).then(resumen => {
                resumenDiv.innerHTML = `
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
                        <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.scannerGanadoHoy || "Ganado hoy"}:</p>
                        <p style="color: #10b981; font-size: 22px; font-weight: bold;">₡${resumen.ganancia.toLocaleString()}</p>
                    </div>
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
                        <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.historialTotal || "Total atendidos"}:</p>
                        <p style="color: var(--text-primary); font-size: 22px; font-weight: bold;">${resumen.total}</p>
                    </div>
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
                        <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.formTipoPaga || "Paga"}:</p>
                        <p style="color: var(--text-primary); font-size: 22px; font-weight: bold;">${resumen.pagantes}</p>
                    </div>
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
                        <p style="color: var(--text-secondary); margin-bottom: 5px;">${trad.formTipoBecado || "Becado"}:</p>
                        <p style="color: var(--text-primary); font-size: 22px; font-weight: bold;">${resumen.becados}</p>
                    </div>
                `;

                if (resumen.total === 0) {
                    listaDiv.innerHTML = `<p class="scanner-lista-vacia">${trad.scannerListaVacia || "No hay asistencias registradas hoy"}</p>`;
                    return;
                }
                let html = "";
                resumen.asistencias.forEach(a => {
                    const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                    const nombre = a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "";
                    const seccion = a.seccion || (estudiante ? estudiante.seccion : "") || "";
                    const esBecado = !esPaganteAsistencia(a);
                    const tipoTexto = esBecado ? (trad.formTipoBecado || "Becado") : (trad.formTipoPaga || "Paga");
                    html += `
                        <div class="scanner-lista-item">
                            <div class="scanner-lista-info">
                                <span class="scanner-lista-nombre">${nombre}</span>
                                <span class="scanner-lista-seccion">${seccion ? `${trad.tablaSeccion || "Sección"}: ${seccion}` : ""}</span>
                            </div>
                            <span class="scanner-lista-tipo ${esBecado ? "becado" : "paga"}">${tipoTexto}</span>
                            <span class="scanner-lista-hora">${a.hora || ""}</span>
                        </div>
                    `;
                });
                listaDiv.innerHTML = html;
            }).catch(error => {
                resumenDiv.innerHTML = `<p class="scanner-lista-vacia">${trad.notificacionError}: ${error.message}</p>`;
                console.error("Error al cargar historial: ", error);
            });
        }


        // Exporta a Excel la fecha seleccionada del historial
        async function exportarHistorial() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_XLSX);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const fecha = document.getElementById("historialFechaInput").value;
            if (!fecha) { mostrarNotificacion(trad.historialFecha || "Fecha", "error"); return; }
            obtenerResumenDelDia(fecha).then(resumen => {
                if (resumen.total === 0) {
                    mostrarNotificacion(trad.scannerListaVacia || "No hay asistencias registradas", "error");
                    return;
                }
                const wb = XLSX.utils.book_new();
                const filas = [
                    [configuracion.institucion || ""],
                    [configuracion.comedor || "Comedor Institucional"],
                    [`${trad.historialFecha || "Fecha"}: ${fecha}`],
                    [],
                    [`Ganancia del día: ₡${resumen.ganancia.toLocaleString()}`],
                    [`${trad.historialTotal || "Total atendidos"}: ${resumen.total} | Pagantes: ${resumen.pagantes} | Becados: ${resumen.becados}`],
                    [],
                    ["Hora", "Nombre", "Sección", "Nivel", "Tipo"]
                ];
                resumen.asistencias.forEach(a => {
                    const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                    filas.push([
                        a.hora || "",
                        a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "",
                        a.seccion || (estudiante ? estudiante.seccion : "") || "",
                        estudiante ? (estudiante.nivel || "N/A") : "N/A",
                        esPaganteAsistencia(a) ? (trad.formTipoPaga || "Paga") : (trad.formTipoBecado || "Becado")
                    ]);
                });
                filas.push([]);
                filas.push([`TOTAL GANANCIA DEL DÍA: ₡${resumen.ganancia.toLocaleString()}`]);
                const ws = XLSX.utils.aoa_to_sheet(filas);
                ws["!cols"] = [{ wch: 12 }, { wch: 34 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
                XLSX.utils.book_append_sheet(wb, ws, "Reporte");
                XLSX.writeFile(wb, `Reporte_${fecha}.xlsx`);
                mostrarNotificacion(`Excel ${fecha}`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
            });
        }


        // Exporta a PDF la fecha seleccionada del historial
        async function exportarHistorialPDF() {
            const trad = traducciones[configuracion.idioma];
            try {
                await cargarScript(URL_JSPDF);
                await cargarScript(URL_JSPDF_AUTOTABLE);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
                return;
            }
            const fecha = document.getElementById("historialFechaInput").value;
            if (!fecha) { mostrarNotificacion(trad.historialFecha || "Fecha", "error"); return; }
            obtenerResumenDelDia(fecha).then(resumen => {
                if (resumen.total === 0) {
                    mostrarNotificacion(trad.scannerListaVacia || "No hay asistencias registradas", "error");
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.setFontSize(15);
                doc.setTextColor(22, 91, 211);
                doc.text(configuracion.institucion || "ComeID", 14, 14);
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.text(configuracion.comedor || "Comedor Institucional", 14, 20);
                doc.setFontSize(10);
                doc.text(`${trad.historialFecha || "Fecha"}: ${fecha}`, 14, 26);
                doc.text(`Ganancia del día: ₡${resumen.ganancia.toLocaleString()}`, 14, 32);
                doc.text(`${trad.historialTotal || "Total atendidos"}: ${resumen.total} | Pagantes: ${resumen.pagantes} | Becados: ${resumen.becados}`, 14, 37);
                const headers = [["Hora", "Nombre", "Sección", "Nivel", "Tipo"]];
                const data = resumen.asistencias.map(a => {
                    const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                    return [
                        a.hora || "",
                        a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "",
                        a.seccion || (estudiante ? estudiante.seccion : "") || "",
                        estudiante ? (estudiante.nivel || "N/A") : "N/A",
                        esPaganteAsistencia(a) ? (trad.formTipoPaga || "Paga") : (trad.formTipoBecado || "Becado")
                    ];
                });
                doc.autoTable({
                    head: headers,
                    body: data,
                    startY: 42,
                    styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', textColor: 0 },
                    headStyles: { fillColor: [22, 91, 211], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [235, 240, 250] }
                });
                const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 42) + 10;
                doc.setFontSize(12);
                doc.setTextColor(22, 91, 211);
                doc.text(`TOTAL GANANCIA DEL DÍA: ₡${resumen.ganancia.toLocaleString()}`, 14, finalY);
                doc.save(`Reporte_${fecha}.pdf`);
                mostrarNotificacion(`PDF ${fecha}`);
            }).catch(error => {
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
            });
        }


        // Función para limpiar las asistencias del día (solo admin)
        function limpiarAsistenciasDelDia() {
            const trad = traducciones[configuracion.idioma];
            if (!usuarioActual || !usuarioActual.rol || usuarioActual.rol.toLowerCase() !== "admin") {
                mostrarNotificacion(trad.notificacionSinPermiso, "error");
                return;
            }
            if (!confirm(trad.confirmarLimpiarAsistencias || "¿Seguro que deseas eliminar todas las asistencias de hoy?")) return;

            const hoy = new Date().toISOString().slice(0, 10);
            mostrarLoading();
            db.collection("asistencias").where("fecha", "==", hoy).get().then(snapshot => {
                const promesas = [];
                snapshot.forEach(doc => promesas.push(doc.ref.delete()));
                return Promise.all(promesas);
            }).then(() => {
                ocultarLoading();
                mostrarNotificacion(trad.notificacionAsistenciasLimpiadas || "Asistencias del día eliminadas correctamente");
                mostrarDashboard();
            }).catch(error => {
                ocultarLoading();
                mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                console.error("Error al limpiar asistencias: ", error);
            });
        }