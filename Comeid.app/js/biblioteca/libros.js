// =============================================
// ComeID Biblioteca - Catálogo de libros (CRUD)
// =============================================

// Normaliza y traduce el estado físico de los ejemplares
function formatearEstadoLibro(libro) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const estado = (libro.estado || "Bueno");
    const clase = estado === "Bueno" ? "estado-bueno" : (estado === "Dañado" ? "estado-danado" : "estado-perdido");
    const texto = estado === "Bueno" ? trad.estadoBueno : (estado === "Dañado" ? trad.estadoDanado : trad.estadoPerdido);
    return `<span class="estado-semaforo ${clase}">${texto}</span>`;
}

function libroEsPrestable(libro) {
    return (libro.estado || "Bueno") === "Bueno";
}

function cambiarEstadoLibro(id) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const libro = libros.find(l => l.id === id);
    if (!libro) return;
    const actual = (libro.estado || "Bueno");
    const opciones = [
        { valor: "Bueno", texto: trad.estadoBueno },
        { valor: "Dañado", texto: trad.estadoDanado },
        { valor: "Perdido", texto: trad.estadoPerdido }
    ].filter(o => o.valor !== actual);
    const opcion = prompt(trad.cambiarEstadoPrompt, opciones[0].valor);
    if (!opcion) return;
    const nuevo = opciones.find(o => o.valor === opcion) ? opcion : null;
    if (!nuevo) return;
    mostrarLoading();
    db.collection("libros").doc(id).update({ estado: nuevo }).then(() => {
        ocultarLoading();
        const accion = nuevo === "Dañado" ? "marcar_danado" : (nuevo === "Perdido" ? "marcar_perdido" : "restaurar_copia");
        registrarActividad(accion, `${libro.titulo} → ${nuevo}`);
        mostrarNotificacion(trad.notificacionLibroActualizado, "ok");
        return cargarLibros();
    }).then(() => {
        renderTablaLibros();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

function mostrarCatalogoLibros() {
    activarVista("catalogo");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const gestion = puedeGestionar();
    document.getElementById("contenido").innerHTML = `
        <div class="student-header">
            <h1 class="title">${trad.catalogoTitle}</h1>
            ${gestion ? `<button class="add-btn" onclick="abrirFormLibro()"><i class="fas fa-plus"></i> ${trad.catalogoAgregar}</button>
            <button class="add-btn" onclick="abrirImportacion('libros')" title="Importar catálogo desde Excel / CSV"><i class="fas fa-file-import"></i> Importar Excel/CSV</button>` : ""}
        </div>
        <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
            <input type="text" class="search-box" id="buscarLibro" placeholder="${trad.catalogoBuscar}" oninput="renderTablaLibros()" style="flex:1; min-width:200px;">
            <select class="search-box" id="filtroDisponibilidad" onchange="renderTablaLibros()" style="max-width:170px;">
                <option value="todos">${trad.catalogoFiltroTodos}</option>
                <option value="disponibles">${trad.catalogoFiltroDisponibles}</option>
                <option value="prestados">${trad.catalogoFiltroPrestados}</option>
            </select>
        </div>
        <div class="student-container">
            <table class="student-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>${trad.catalogoColTitulo}</th>
                        <th>${trad.catalogoColAutor}</th>
                        <th>${trad.catalogoColCategoria}</th>
                        <th>${trad.catalogoColIsbn}</th>
                        <th>${trad.catalogoColUbicacion}</th>
                        <th>${trad.catalogoColEjemplares}</th>
                        <th>${trad.catalogoColDisponibles}</th>
                        <th>${trad.catalogoColEstado}</th>
                        <th>${trad.catalogoColCodigo}</th>
                        <th>${trad.catalogoColAcciones}</th>
                    </tr>
                </thead>
                <tbody id="tablaLibrosBody"></tbody>
            </table>
        </div>
    `;
    renderTablaLibros();
}

function renderTablaLibros() {
    const tbody = document.getElementById("tablaLibrosBody");
    if (!tbody) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const busqueda = ((document.getElementById("buscarLibro") || {}).value || "").toLowerCase();
    const filtro = ((document.getElementById("filtroDisponibilidad") || {}).value) || "todos";
    const disponibles = librosDisponibles();
    let filtrados = disponibles.filter(l => {
        if (!busqueda) return true;
        return [l.titulo, l.autor, l.categoria, l.codigo, l.isbn].some(v => String(v || "").toLowerCase().includes(busqueda));
    });
    if (filtro === "disponibles") filtrados = filtrados.filter(l => l.disponibles > 0 && libroEsPrestable(l));
    else if (filtro === "prestados") filtrados = filtrados.filter(l => l.disponibles < (Number(l.ejemplares) || 0));

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="no-results">${trad.catalogoSinResultados}</td></tr>`;
        return;
    }

    const gestion = puedeGestionar();
    tbody.innerHTML = filtrados.map(libro => {
        const ubicacion = [libro.estante, libro.seccion, libro.nivel].filter(Boolean).join(" / ");
        const portada = libro.portada
            ? `<img src="${escaparHTML(libro.portada)}" alt="" style="width:36px; height:50px; object-fit:cover; border-radius:6px;" onerror="this.style.display='none'">`
            : `<i class="fas fa-book-open" style="font-size:20px; color:var(--text-secondary);"></i>`;
        const btnQR = `<button class="table-btn" style="color:#10b981;" onclick="mostrarQRLibro('${libro.id}')" title="${trad.qrVer}"><i class="fas fa-qrcode"></i></button>`;
        const btnFicha = `<button class="table-btn" style="color:#2b67ff;" onclick="mostrarFichaLibro('${libro.id}')" title="${trad.fichaVer}"><i class="fas fa-eye"></i></button>`;
        const btnReservar = `<button class="table-btn" style="color:#f59e0b;" onclick="reservarLibro('${libro.id}')" title="${trad.reservarLibro}"><i class="fas fa-bookmark"></i></button>`;
        return `
        <tr>
            <td>${portada}</td>
            <td>${escaparHTML(libro.titulo)}</td>
            <td>${escaparHTML(libro.autor)}</td>
            <td>${escaparHTML(libro.categoria || "—")}</td>
            <td>${escaparHTML(libro.isbn || "—")}</td>
            <td>${escaparHTML(ubicacion || "—")}</td>
            <td>${Number(libro.ejemplares) || 0}</td>
            <td>${libro.disponibles}</td>
            <td>${formatearEstadoLibro(libro)}</td>
            <td>${escaparHTML(libro.codigo || "—")}</td>
            <td>${gestion ? `
                ${btnQR}
                ${btnFicha}
                ${btnReservar}
                <button class="table-btn edit-btn" onclick="abrirFormLibro('${libro.id}')" title="${trad.catalogoColAcciones}"><i class="fas fa-edit"></i></button>
                <button class="table-btn" style="color:#fbbf24;" onclick="cambiarEstadoLibro('${libro.id}')" title="${trad.catalogoColEstado}"><i class="fas fa-tools"></i></button>
                <button class="table-btn delete-btn" onclick="eliminarLibro('${libro.id}')" title="${trad.catalogoColAcciones}"><i class="fas fa-trash-alt"></i></button>` : `${btnQR} ${btnFicha} ${btnReservar}`}
            </td>
        </tr>`;
    }).join("");
}

function abrirFormLibro(id) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    libroEditando = id ? libros.find(l => l.id === id) || null : null;

    document.getElementById("libroFormTitle").textContent = libroEditando ? trad.libroFormTitleEditar : trad.libroFormTitle;
    document.getElementById("libroTitulo").value = libroEditando ? libroEditando.titulo || "" : "";
    document.getElementById("libroAutor").value = libroEditando ? libroEditando.autor || "" : "";
    document.getElementById("libroCategoria").value = libroEditando ? libroEditando.categoria || "Novela" : "Novela";
    document.getElementById("libroEditorial").value = libroEditando ? libroEditando.editorial || "" : "";
    document.getElementById("libroAnio").value = libroEditando ? libroEditando.anio || "" : "";
    document.getElementById("libroEjemplares").value = libroEditando ? libroEditando.ejemplares || 1 : 1;
    document.getElementById("libroCodigo").value = libroEditando ? libroEditando.codigo || "" : "";
    document.getElementById("libroIsbn").value = libroEditando ? libroEditando.isbn || "" : "";
    document.getElementById("libroEstante").value = libroEditando ? libroEditando.estante || "" : "";
    document.getElementById("libroSeccion").value = libroEditando ? libroEditando.seccion || "" : "";
    document.getElementById("libroNivel").value = libroEditando ? libroEditando.nivel || "" : "";
    document.getElementById("libroPortada").value = libroEditando ? libroEditando.portada || "" : "";
    document.getElementById("libroEstado").value = libroEditando ? (libroEditando.estado || "Bueno") : "Bueno";
    document.getElementById("formLibro").classList.add("show");
}

function cerrarFormLibro() {
    document.getElementById("formLibro").classList.remove("show");
    libroEditando = null;
}

function guardarLibro() {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const titulo = document.getElementById("libroTitulo").value.trim();
    const autor = document.getElementById("libroAutor").value.trim();
    const codigo = document.getElementById("libroCodigo").value.trim();
    const ejemplares = Number(document.getElementById("libroEjemplares").value) || 1;
    if (!titulo || !autor || !codigo) {
        mostrarNotificacion(trad.notificacionCompleteCampos, "error");
        return;
    }
    const datos = {
        titulo,
        autor,
        categoria: document.getElementById("libroCategoria").value,
        editorial: document.getElementById("libroEditorial").value.trim(),
        anio: Number(document.getElementById("libroAnio").value) || 0,
        ejemplares,
        codigo,
        isbn: document.getElementById("libroIsbn").value.trim(),
        estante: document.getElementById("libroEstante").value.trim(),
        seccion: document.getElementById("libroSeccion").value.trim(),
        nivel: document.getElementById("libroNivel").value.trim(),
        portada: document.getElementById("libroPortada").value.trim(),
        estado: document.getElementById("libroEstado").value
    };

    mostrarLoading();
    const operacion = libroEditando
        ? db.collection("libros").doc(libroEditando.id).update(datos).then(() => trad.notificacionLibroActualizado)
        : db.collection("libros").add(datos).then(() => trad.notificacionLibroGuardado);

    operacion.then(mensaje => {
        ocultarLoading();
        mostrarNotificacion(mensaje, "ok");
        registrarActividad(libroEditando ? "editar_libro" : "agregar_libro", `${titulo} (${codigo})`);
        cerrarFormLibro();
        return cargarLibros();
    }).then(() => {
        renderTablaLibros();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

function eliminarLibro(id) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const tienePrestamosActivos = prestamos.some(p => p.libroId === id && !p.devuelto);
    if (tienePrestamosActivos) {
        mostrarNotificacion(trad.notificacionLibroEnPrestamo, "error");
        return;
    }
    if (!confirm(trad.confirmaEliminarLibro)) return;

    mostrarLoading();
    db.collection("libros").doc(id).delete().then(() => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionLibroEliminado, "ok");
        const libroElim = libros.find(l => l.id === id);
        registrarActividad("eliminar_libro", libroElim ? `${libroElim.titulo} (${libroElim.codigo})` : id);
        return cargarLibros();
    }).then(() => {
        renderTablaLibros();
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
    });
}

// =============================================
// FICHA COMPLETA DEL LIBRO
// =============================================

function mostrarFichaLibro(id) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const disponibles = librosDisponibles();
    const libro = disponibles.find(l => l.id === id);
    if (!libro) return;
    const prestamosDelLibro = prestamos.filter(p => p.libroId === id).sort((a, b) => (b.fechaPrestamo || "").localeCompare(a.fechaPrestamo || ""));
    const ubicacion = [libro.estante, libro.seccion, libro.nivel].filter(Boolean).join(" / ") || "—";

    const campos = `
        ${libro.categoria ? `<div class="ficha-item"><span>${trad.fichaCategoria}</span><span>${escaparHTML(libro.categoria)}</span></div>` : ""}
        ${libro.editorial ? `<div class="ficha-item"><span>${trad.fichaEditorial}</span><span>${escaparHTML(libro.editorial)}</span></div>` : ""}
        ${libro.anio ? `<div class="ficha-item"><span>${trad.fichaAnio}</span><span>${escaparHTML(String(libro.anio))}</span></div>` : ""}
        ${libro.isbn ? `<div class="ficha-item"><span>ISBN</span><span>${escaparHTML(libro.isbn)}</span></div>` : ""}
        ${libro.codigo ? `<div class="ficha-item"><span>${trad.fichaCodigo}</span><span>${escaparHTML(libro.codigo)}</span></div>` : ""}
        <div class="ficha-item"><span>${trad.fichaUbicacion}</span><span>${escaparHTML(ubicacion)}</span></div>
        <div class="ficha-item"><span>${trad.fichaEjemplares}</span><span>${Number(libro.ejemplares) || 0}</span></div>
        <div class="ficha-item"><span>${trad.fichaDisponibles}</span><span>${libro.disponibles}</span></div>
        <div class="ficha-item"><span>${trad.catalogoColEstado}</span><span>${formatearEstadoLibro(libro)}</span></div>
    `;

    const historialHtml = prestamosDelLibro.length === 0
        ? `<p style="color: var(--text-secondary); font-size: 13px; padding: 6px 0;">${trad.fichaHistorialVacio}</p>`
        : `<div style="max-height: 170px; overflow-y: auto;">
            ${prestamosDelLibro.slice(0, 10).map(p => `
                <div class="ficha-item">
                    <span>${escaparHTML(p.prestamistaNombre)}</span>
                    <span>${fechaLegible(p.fechaPrestamo)} → ${p.devuelto ? fechaLegible(p.fechaDevolucion) : (trad.historialEstadoPrestado + " · " + fechaLegible(p.fechaVencimiento))}</span>
                </div>
            `).join("")}
        </div>`;

    document.getElementById("fichaLibroContenido").innerHTML = `
        <h2 style="display:flex; align-items:center; gap:14px;">
            ${libro.portada
                ? `<img src="${escaparHTML(libro.portada)}" alt="" class="ficha-cover" onerror="this.style.display='none'">`
                : `<i class="fas fa-book-open" style="font-size:44px; color:var(--accent-color);"></i>`}
            <span>
                <span style="font-size:18px;">${escaparHTML(libro.titulo)}</span><br>
                <span style="font-size:13px; color: var(--text-secondary); font-weight:400;">${escaparHTML(libro.autor)}</span>
            </span>
        </h2>
        <div style="margin-top:14px;">${campos}</div>
        <h3 style="color: var(--accent-color); font-size:15px; margin-top:16px;">${trad.fichaHistorial}</h3>
        ${historialHtml}
        <div class="form-actions" style="margin-top:16px;">
            <button class="btn-save" onclick="reservarLibro('${libro.id}')"><i class="fas fa-bookmark"></i> ${trad.reservarLibro}</button>
            <button class="btn-save" style="background:#10b981;" onclick="mostrarQRLibro('${libro.id}')"><i class="fas fa-qrcode"></i> ${trad.qrVer}</button>
            <button class="btn-cancel" onclick="cerrarFichaLibro()">${trad.fichaCerrar}</button>
        </div>
    `;
    document.getElementById("modalFichaLibro").classList.add("show");
}

function cerrarFichaLibro() {
    document.getElementById("modalFichaLibro").classList.remove("show");
}
