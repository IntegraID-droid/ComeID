// =============================================
// ComeID Biblioteca - Mapa de ubicación de libros
// =============================================

let mapaSeccion = null;
let mapaSecciones = [];

function seccionDeLibro(libro) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    return (libro.seccion || libro.estante || "").trim() || (trad.mapaGeneral || "General");
}

function mostrarMapa() {
    activarVista("mapa");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.mapaTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.mapaSubtitle}</p>
        <div id="mapaContenido" style="margin-top: 14px;"></div>
    `;
    renderMapa();
}

function renderMapa() {
    const cont = document.getElementById("mapaContenido");
    if (!cont) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const disponibles = librosDisponibles();

    if (mapaSeccion) {
        const lista = libros.filter(l => seccionDeLibro(l) === mapaSeccion);
        if (lista.length === 0) {
            mapaSeccion = null;
            renderMapa();
            return;
        }
        cont.innerHTML = `
            <button class="add-btn" style="margin-bottom: 14px;" onclick="volverMapa()">
                <i class="fas fa-arrow-left"></i> ${trad.mapaVolver}
            </button>
            <div class="student-container">
                <table class="student-table">
                    <thead>
                        <tr>
                            <th>${trad.mapaColLibro}</th>
                            <th>${trad.mapaColAutor}</th>
                            <th>${trad.mapaColCodigo}</th>
                            <th>${trad.mapaColDisponibles}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>${lista.map(l => {
                        const disp = (disponibles.find(d => d.id === l.id) || l).disponibles;
                        return `<tr>
                            <td>${escaparHTML(l.titulo)}</td>
                            <td>${escaparHTML(l.autor || "—")}</td>
                            <td>${escaparHTML(l.codigo || "—")}</td>
                            <td>${disp} / ${Number(l.ejemplares) || 0}</td>
                            <td><button class="table-btn" style="color:#10b981;" onclick="mostrarQRLibro('${l.id}')" title="${trad.qrVer}"><i class="fas fa-qrcode"></i></button></td>
                        </tr>`;
                    }).join("")}</tbody>
                </table>
            </div>
        `;
        return;
    }

    const grupos = {};
    libros.forEach(l => {
        const s = seccionDeLibro(l);
        grupos[s] = grupos[s] || [];
        grupos[s].push(l);
    });
    mapaSecciones = Object.keys(grupos).sort();

    if (mapaSecciones.length === 0) {
        cont.innerHTML = `<div class="no-results">${trad.mapaSinLibros}</div>`;
        return;
    }

    cont.innerHTML = `
        <p style="color: var(--text-secondary); margin: 6px 0 14px;">${trad.mapaLegendTitle}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px;">
            ${mapaSecciones.map((s, i) => {
                const lista = grupos[s];
                const totalEj = lista.reduce((sum, l) => sum + (Number(l.ejemplares) || 0), 0);
                const disp = lista.reduce((sum, l) => sum + ((disponibles.find(d => d.id === l.id) || l).disponibles || 0), 0);
                return `<div class="panel" style="cursor:pointer; text-align:center; padding:22px 14px; border:1px solid var(--border-color);" onclick="mostrarSeccionMapa(${i})">
                    <i class="fas fa-book-open" style="font-size:28px; color: var(--accent-color);"></i>
                    <h3 style="margin:10px 0 4px; color: var(--text-primary);">${escaparHTML(s)}</h3>
                    <p style="color: var(--text-secondary); font-size:13px;">${lista.length} ${trad.mapaTitulos} · ${totalEj} ${trad.mapaEjemplares}</p>
                    <p style="color:#10b981; font-weight:700; font-size:14px;">${disp} ${trad.iaDisponibles}</p>
                </div>`;
            }).join("")}
        </div>
    `;
}

function mostrarSeccionMapa(indice) {
    if (!mapaSecciones[indice]) return;
    mapaSeccion = mapaSecciones[indice];
    renderMapa();
}

function volverMapa() {
    mapaSeccion = null;
    renderMapa();
}
