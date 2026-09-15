// =============================================
// ComeID Biblioteca - Reportes y exportación
// =============================================

let reporteFiltro = "todos";

function mostrarReportes() {
    activarVista("reportes");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const filtros = [
        { valor: "todos", texto: trad.reportesFiltroTodos },
        { valor: "activos", texto: trad.reportesFiltroActivos },
        { valor: "devueltos", texto: trad.reportesFiltroDevueltos }
    ];
    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.reportesTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.reportesSubtitle}</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0;">
            ${filtros.map(f => `
                <button onclick="cambiarFiltroReporte('${f.valor}')"
                    style="padding: 8px 14px; border: 1px solid var(--border-color); border-radius: 20px; background: ${reporteFiltro === f.valor ? "var(--accent-color)" : "var(--bg-tertiary)"}; color: ${reporteFiltro === f.valor ? "#fff" : "var(--text-primary)"}; cursor: pointer; font-weight: 600;">
                    ${f.texto}
                </button>
            `).join("")}
            <div style="flex:1;"></div>
            <button class="btn-save" style="padding:8px 14px; border-radius:10px;" onclick="exportarReporteCSV()"><i class="fas fa-file-csv"></i> ${trad.reportesExportarCSV}</button>
            <button class="btn-save" style="padding:8px 14px; border-radius:10px; background:#28a745;" onclick="exportarReporteExcel()"><i class="fas fa-file-excel"></i> ${trad.reportesExportarExcel}</button>
            <button class="btn-save" style="padding:8px 14px; border-radius:10px; background:#c62828;" onclick="exportarReportePDF()"><i class="fas fa-file-pdf"></i> ${trad.reportesExportarPDF}</button>
        </div>
        <p style="color: var(--text-secondary); font-weight: 600;" id="reporteCantidad"></p>
        <div class="student-container" id="reporteTabla"></div>
    `;
    renderTablaReporte();
}

function cambiarFiltroReporte(filtro) {
    reporteFiltro = filtro;
    renderTablaReporte();
}

function prestamosParaReporte() {
    let lista = prestamos.slice();
    if (reporteFiltro === "activos") lista = lista.filter(p => !p.devuelto);
    else if (reporteFiltro === "devueltos") lista = lista.filter(p => p.devuelto);
    lista.sort((a, b) => (b.fechaPrestamo || "").localeCompare(a.fechaPrestamo || ""));
    return lista;
}

function renderTablaReporte() {
    const cont = document.getElementById("reporteTabla");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const lista = prestamosParaReporte();
    const cantidad = document.getElementById("reporteCantidad");
    if (cantidad) cantidad.textContent = `${trad.reportesCantidad}: ${lista.length}`;

    if (lista.length === 0) {
        cont.innerHTML = `<div class="no-results">${trad.reportesSinRegistros}</div>`;
        return;
    }

    cont.innerHTML = `<table class="student-table">
        <thead>
            <tr>
                <th>${trad.reportesColLibro}</th>
                <th>${trad.reportesColPrestamista}</th>
                <th>${trad.reportesColTipo}</th>
                <th>${trad.reportesColPrestamo}</th>
                <th>${trad.reportesColVence}</th>
                <th>${trad.reportesColDevolucion}</th>
                <th>${trad.reportesColEstado}</th>
            </tr>
        </thead>
        <tbody>${lista.map(p => {
            let estado, color;
            if (p.devuelto) {
                estado = trad.historialEstadoDevuelto;
                color = "#28a745";
            } else if (esPrestamoAtrasado(p)) {
                estado = trad.historialEstadoAtrasado;
                color = "#ef5350";
            } else {
                estado = trad.historialEstadoPrestado;
                color = "#2b67ff";
            }
            return `<tr>
                <td>${escaparHTML(p.libroTitulo)}</td>
                <td>${escaparHTML(p.prestamistaNombre)}</td>
                <td>${escaparHTML(p.tipoPrestamista || "—")}</td>
                <td>${fechaLegible(p.fechaPrestamo)}</td>
                <td>${fechaLegible(p.fechaVencimiento)}</td>
                <td>${fechaLegible(p.fechaDevolucion)}</td>
                <td><span style="color:${color}; font-weight:600;">${estado}</span></td>
            </tr>`;
        }).join("")}</tbody>
    </table>`;
}

// =============================================
// EXPORTACIÓN
// =============================================

function filasReporteCSV(trad) {
    const filas = [[
        trad.reportesColLibro,
        trad.reportesColPrestamista,
        trad.reportesColTipo,
        trad.reportesColPrestamo,
        trad.reportesColVence,
        trad.reportesColDevolucion,
        trad.reportesColEstado
    ]];
    prestamosParaReporte().forEach(p => {
        let estado;
        if (p.devuelto) estado = trad.historialEstadoDevuelto;
        else if (esPrestamoAtrasado(p)) estado = trad.historialEstadoAtrasado;
        else estado = trad.historialEstadoPrestado;
        filas.push([
            p.libroTitulo || "",
            p.prestamistaNombre || "",
            p.tipoPrestamista || "",
            p.fechaPrestamo || "",
            p.fechaVencimiento || "",
            p.fechaDevolucion || "",
            estado
        ]);
    });
    return filas;
}

function exportarReporteCSV() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const lista = prestamosParaReporte();
    if (lista.length === 0) {
        mostrarNotificacion(trad.reportesSinRegistros, "error");
        return;
    }
    const csv = filasReporteCSV(trad).map(fila =>
        fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join(",")
    ).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `Reporte_Prestamos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    mostrarNotificacion(trad.reportesExportarCSV + " ✓");
}

async function exportarReporteExcel() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const lista = prestamosParaReporte();
    if (lista.length === 0) {
        mostrarNotificacion(trad.reportesSinRegistros, "error");
        return;
    }
    try {
        await cargarScript(URL_XLSX);
    } catch (e) {
        mostrarNotificacion(e.message, "error");
        return;
    }
    if (typeof XLSX === "undefined") {
        mostrarNotificacion(trad.notificacionError, "error");
        return;
    }
    const wb = XLSX.utils.book_new();
    const filas = [
        [configuracion.institucion || ""],
        [trad.headerLogo],
        [`${trad.reportesTitle}: ${new Date().toLocaleDateString()}`],
        [],
        ...filasReporteCSV(trad)
    ];
    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws["!cols"] = [{ wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, "Prestamos");
    XLSX.writeFile(wb, `Reporte_Prestamos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    mostrarNotificacion(trad.reportesExportarExcel + " ✓");
}

async function exportarReportePDF() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const lista = prestamosParaReporte();
    if (lista.length === 0) {
        mostrarNotificacion(trad.reportesSinRegistros, "error");
        return;
    }
    try {
        await cargarScript(URL_JSPDF);
        await cargarScript(URL_JSPDF_AUTOTABLE);
    } catch (e) {
        mostrarNotificacion(e.message, "error");
        return;
    }
    if (typeof window.jspdf === "undefined") {
        mostrarNotificacion(trad.notificacionError, "error");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.setTextColor(22, 91, 211);
    doc.text(configuracion.institucion || "ComeID", 14, 14);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(trad.headerLogo, 14, 20);
    doc.setFontSize(10);
    doc.text(`${trad.reportesTitle} — ${new Date().toLocaleDateString()}`, 14, 26);
    doc.text(`${trad.reportesCantidad}: ${lista.length}`, 14, 31);

    const cuerpo = filasReporteCSV(trad);
    const cabeceras = [cuerpo[0]];
    const datos = cuerpo.slice(1);
    doc.autoTable({
        head: cabeceras,
        body: datos,
        startY: 36,
        styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak', halign: 'left', textColor: 0 },
        headStyles: { fillColor: [22, 91, 211], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [235, 240, 250] }
    });
    doc.save(`Reporte_Prestamos_${new Date().toISOString().slice(0, 10)}.pdf`);
    mostrarNotificacion(trad.reportesExportarPDF + " ✓");
}
