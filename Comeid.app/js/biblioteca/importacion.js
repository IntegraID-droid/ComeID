// =============================================
// ComeID Biblioteca - Importación desde Excel/CSV
// Permite pasar el catálogo y los socios desde un
// archivo Excel/CSV sin digitar uno a uno.
// Para los libros, el código de barras (columna
// "código") es la llave única: puede haber dos
// libros con el mismo título pero distintos.
// Si el código ya existe se actualiza; si no, se agrega.
// =============================================

let importacionModo = "libros"; // "libros" | "socios"
let importacionFilas = [];      // { datos, accion }
let importacionErrores = [];    // { fila, motivo }

// ---------- Apertura / cierre ----------
function abrirImportacion(modo) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    importacionModo = modo;
    importacionFilas = [];
    importacionErrores = [];
    const esLibros = modo === "libros";
    document.getElementById("importacionTitle").textContent = esLibros
        ? "Importar libros desde Excel / CSV"
        : "Importar socios desde Excel / CSV";
    document.getElementById("importacionAyudaLibros").style.display = esLibros ? "" : "none";
    document.getElementById("importacionAyudaSocios").style.display = esLibros ? "none" : "";
    document.getElementById("importacionArchivo").value = "";
    document.getElementById("importacionPreview").innerHTML = "";
    document.getElementById("btnImportarArchivo").style.display = "none";
    document.getElementById("formImportacion").style.display = "flex";
}

function cerrarImportacion() {
    const cont = document.getElementById("formImportacion");
    if (cont) cont.style.display = "none";
    importacionFilas = [];
    importacionErrores = [];
}

// ---------- Lectura del archivo ----------
function manejarArchivoImportacion(input) {
    const file = input.files[0];
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name || "")) {
        const lector = new FileReader();
        lector.onload = e => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                const hoja = wb.Sheets[wb.SheetNames[0]];
                procesarImportacion(XLSX.utils.sheet_to_json(hoja, { defval: "" }));
            } catch (err) {
                mostrarErrorImportacion("No se pudo leer el archivo de Excel: " + err.message);
            }
        };
        lector.onerror = () => mostrarErrorImportacion("No se pudo leer el archivo seleccionado.");
        lector.readAsArrayBuffer(file);
        return;
    }
    const lector = new FileReader();
    lector.onload = e => {
        procesarImportacionCSV(String(e.target.result || "").replace(/^\uFEFF/, ""));
    };
    lector.onerror = () => mostrarErrorImportacion("No se pudo leer el archivo seleccionado.");
    lector.readAsText(file);
}

function procesarImportacionCSV(texto) {
    if (!texto.trim()) {
        mostrarErrorImportacion("El archivo está vacío.");
        return;
    }
    const lineas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
    if (lineas.length < 2) {
        mostrarErrorImportacion("El archivo solo tiene una línea: se necesita una fila de encabezados y al menos un dato.");
        return;
    }
    const delim = detectarDelimitador(lineas[0]);
    const cab = splitCSVLinea(lineas[0], delim);
    const filas = [];
    for (let i = 1; i < lineas.length; i++) {
        const celdas = splitCSVLinea(lineas[i], delim);
        const obj = {};
        cab.forEach((h, j) => {
            obj[String(h || "col_" + j).trim()] = celdas[j] !== undefined ? celdas[j].trim() : "";
        });
        filas.push(obj);
    }
    procesarImportacion(filas);
}

function detectarDelimitador(cabecera) {
    return (cabecera.match(/;/g) || []).length > (cabecera.match(/,/g) || []).length ? ";" : ",";
}

function splitCSVLinea(linea, delim) {
    const celdas = [];
    let actual = "", entre = false;
    for (let i = 0; i < linea.length; i++) {
        const c = linea[i];
        if (c === '"') {
            if (entre && linea[i + 1] === '"') { actual += '"'; i++; }
            else entre = !entre;
        } else if (c === delim && !entre) {
            celdas.push(actual.trim());
            actual = "";
        } else {
            actual += c;
        }
    }
    celdas.push(actual.trim());
    return celdas;
}

// ---------- Normalización y vista previa ----------
const ALIASES_LIBROS = {
    codigo: ["codigo", "código", "cod", "barcode", "codigo de barras", "código de barras", "codigo de barra", "código de barra", "barras", "identificador"],
    titulo: ["titulo", "título", "libro", "nombre", "nombre del libro", "titulo del libro", "título del libro", "obra"],
    autor: ["autor", "autores", "escritor", "escritores", "autora"],
    categoria: ["categoria", "categoría", "tipo", "genero", "género", "clasificacion", "clasificación"],
    editorial: ["editorial", "editora", "editor"],
    anio: ["anio", "año", "anno", "fecha publicacion", "año de publicacion", "año publicacion"],
    ejemplares: ["ejemplares", "ejemplar", "cantidad", "copias", "unidades", "n ejemplares", "total"],
    isbn: ["isbn", "n isbn", "codigo isbn"],
    estante: ["estante", "estantes", "estanteria", "estantería", "ubicacion", "ubicación", "lugar"],
    seccion: ["seccion", "sección", "area", "área", "sala"],
    nivel: ["nivel", "piso", "planta"],
    estado: ["estado", "condicion", "condición", "estado fisico", "estado físico"],
    portada: ["portada", "imagen", "url", "url portada", "foto", "link"]
};

const ALIASES_SOCIOS = {
    nombre: ["nombre", "nombre de la persona", "persona", "nombre completo", "nombre y apellidos", "apellidos"],
    cedula: ["cedula", "cédula", "numero de cedula", "número de cédula", "ci", "identificacion", "identificación", "dni"],
    seccion: ["seccion", "sección", "grupo", "clase", "aula"],
    correo: ["correo", "email", "correo electronico", "correo electrónico", "e-mail", "mail"]
};

function normalizarClave(clave) {
    return String(clave || "").toLowerCase().trim();
}

function libroClave(codigo) {
    return normalizarClave(String(codigo || "").replace(/\s+/g, ""));
}

function mapearAlias(cab, alias) {
    const mapeo = {};
    cab.forEach((h, idx) => {
        const clave = normalizarClave(h);
        if (!clave) return;
        for (const campo in alias) {
            if (alias[campo].indexOf(clave) !== -1) { mapeo[campo] = idx; break; }
        }
    });
    return mapeo;
}

function procesarImportacion(filasObj) {
    importacionFilas = [];
    importacionErrores = [];
    const cabecera = filasObj.length ? Object.keys(filasObj[0]) : [];
    const mapeo = mapearAlias(cabecera, importacionModo === "libros" ? ALIASES_LIBROS : ALIASES_SOCIOS);
    filasObj.forEach((fila, i) => {
        const filaNum = i + 2;
        const datos = {};
        for (const campo in mapeo) {
            const v = fila[cabecera[mapeo[campo]]];
            datos[campo] = v === undefined || v === null ? "" : String(v).trim();
        }
        if (importacionModo === "libros") normalizarFilaLibro(datos, filaNum);
        else normalizarFilaSocio(datos, filaNum);
    });
    renderVistaPreviaImportacion();
}

function normalizarFilaLibro(datos, filaNum) {
    datos.codigo = String(datos.codigo || "").replace(/\s+/g, " ").trim();
    datos.titulo = String(datos.titulo || "").replace(/\s+/g, " ").trim();
    datos.autor = String(datos.autor || "").replace(/\s+/g, " ").trim();
    if (!datos.codigo || !datos.titulo) {
        importacionErrores.push({
            fila: filaNum,
            motivo: datos.codigo ? "falta el título" : (datos.titulo ? "falta el código de barras" : "faltan el código de barras y el título")
        });
        return;
    }
    importacionFilas.push({ datos, accion: null });
}

function normalizarFilaSocio(datos, filaNum) {
    datos.cedula = String(datos.cedula || "").trim();
    datos.nombre = String(datos.nombre || "").replace(/\s+/g, " ").trim();
    if (!datos.cedula || !datos.nombre) {
        importacionErrores.push({
            fila: filaNum,
            motivo: datos.cedula ? "falta el nombre" : (datos.nombre ? "falta la cédula" : "faltan la cédula y el nombre")
        });
        return;
    }
    importacionFilas.push({ datos, accion: null });
}

function renderVistaPreviaImportacion() {
    const cont = document.getElementById("importacionPreview");
    if (!cont) return;
    if (!importacionFilas.length && !importacionErrores.length) {
        cont.innerHTML = `<div class="no-results">No se encontró ninguna columna válida. Revisa que la primera fila contenga los encabezados (por ejemplo: código, título, autor).</div>`;
        document.getElementById("btnImportarArchivo").style.display = "none";
        return;
    }

    const modo = importacionModo;
    const existentes = new Map();
    if (modo === "libros") libros.forEach(l => existentes.set(libroClave(l.codigo), l));
    else bibliotecaEstudiantes.forEach(s => existentes.set(normalizarClave(s.cedula), s));

    let crear = 0, actualizar = 0;
    importacionFilas.forEach(f => {
        const clave = modo === "libros" ? libroClave(f.datos.codigo) : normalizarClave(f.datos.cedula);
        f.accion = existentes.has(clave) ? "actualizar" : "crear";
        if (f.accion === "crear") crear++;
        else actualizar++;
    });

    const badgeNuevo = '<span class="estado-semaforo estado-bueno">NUEVO</span>';
    const badgeActualizar = '<span class="estado-semaforo estado-danado">ACTUALIZAR</span>';
    const cabeceras = modo === "libros"
        ? "<th>Código</th><th>Título</th><th>Autor</th><th>Acción</th>"
        : "<th>Cédula</th><th>Nombre</th><th>Sección</th><th>Acción</th>";

    const filasHtml = importacionFilas.slice(0, 50).map(f => {
        if (modo === "libros") {
            return `<tr>
                <td>${escaparHTML(f.datos.codigo)}</td>
                <td>${escaparHTML(f.datos.titulo)}</td>
                <td>${escaparHTML(f.datos.autor)}</td>
                <td>${f.accion === "crear" ? badgeNuevo : badgeActualizar}</td>
            </tr>`;
        }
        return `<tr>
            <td>${escaparHTML(f.datos.cedula)}</td>
            <td>${escaparHTML(f.datos.nombre)}</td>
            <td>${escaparHTML(f.datos.seccion || "")}</td>
            <td>${f.accion === "crear" ? badgeNuevo : badgeActualizar}</td>
        </tr>`;
    }).join("");

    const erroresHtml = importacionErrores.length
        ? `<p style="color:#ff6b6b; margin-top:10px;">${importacionErrores.length} fila(s) ignoradas: ${importacionErrores.slice(0, 10).map(e => "fila " + e.fila + " (" + e.motivo + ")").join(", ")}${importacionErrores.length > 10 ? "…" : ""}</p>`
        : "";

    cont.innerHTML = `
        <div style="font-weight:700; margin-bottom:8px;">
            Se importarán <span class="estado-semaforo estado-bueno">${crear} nuevo(s)</span> y
            <span class="estado-semaforo estado-danado">${actualizar} actualización(es)</span>${importacionFilas.length > 50 ? " (mostrando las primeras 50 de " + importacionFilas.length + ")" : ""}.
        </div>
        <table class="student-table" style="font-size:13px;">
            <thead><tr>${cabeceras}</tr></thead>
            <tbody>${filasHtml}</tbody>
        </table>
        ${erroresHtml}`;
    document.getElementById("btnImportarArchivo").style.display = "inline-block";
}

// ---------- Ejecución ----------
function ejecutarImportacion() {
    if (!importacionFilas.length) {
        mostrarNotificacion("No hay filas válidas para importar.", "error");
        return;
    }
    mostrarLoading();
    const modo = importacionModo;
    const registrados = new Map();
    const conteo = { crear: 0, actualizar: 0 };
    let promesa = Promise.resolve();
    importacionFilas.forEach(fila => {
        promesa = promesa.then(() => aplicarFilaImportacion(modo, fila.datos, registrados, conteo));
    });
    promesa.then(() => {
        ocultarLoading();
        mostrarNotificacion("Importación completada: " + conteo.crear + " nuevo(s) y " + conteo.actualizar + " actualizado(s).", "ok");
        registrarActividad(modo === "libros" ? "importar_libros" : "importar_socios", conteo.crear + " nuevos, " + conteo.actualizar + " actualizados");
        cerrarImportacion();
        if (modo === "libros") {
            cargarLibros().then(renderTablaLibros);
        } else {
            cargarBibliotecaEstudiantes().then(() => {
                sincronizarEstudiantesBib();
                renderEstudiantesBib();
            });
        }
    }).catch(error => {
        ocultarLoading();
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).notificacionError + ": " + error.message, "error");
    });
}

function aplicarFilaImportacion(modo, datos, registrados, conteo) {
    return modo === "libros"
        ? aplicarFilaLibro(datos, registrados, conteo)
        : aplicarFilaSocio(datos, registrados, conteo);
}

function campoLibro(datos) {
    const p = { titulo: datos.titulo, codigo: datos.codigo };
    if (datos.autor) p.autor = datos.autor;
    if (datos.categoria) p.categoria = datos.categoria;
    if (datos.editorial) p.editorial = datos.editorial;
    if (datos.isbn) p.isbn = datos.isbn;
    if (datos.estante) p.estante = datos.estante;
    if (datos.seccion) p.seccion = datos.seccion;
    if (datos.nivel) p.nivel = datos.nivel;
    if (datos.portada) p.portada = datos.portada;
    const ej = parseInt(datos.ejemplares, 10);
    if (datos.ejemplares !== "" && !isNaN(ej) && ej > 0) p.ejemplares = ej;
    const anio = parseInt(datos.anio, 10);
    if (datos.anio !== "" && !isNaN(anio)) p.anio = anio;
    if (datos.estado) {
        const estado = normalizarClave(datos.estado);
        p.estado = (estado === "dañado" || estado === "danado" || estado === "deteriorado")
            ? "Dañado"
            : (estado === "perdido" || estado === "extraviado") ? "Perdido" : "Bueno";
    }
    return p;
}

function aplicarFilaLibro(datos, registrados, conteo) {
    const clave = libroClave(datos.codigo);
    const p = campoLibro(datos);
    const existente = registrados.get(clave) || libros.find(l => libroClave(l.codigo) === clave);
    if (existente) {
        return db.collection("libros").doc(existente.id).update(p).then(() => {
            Object.assign(existente, p);
            registrados.set(clave, existente);
            conteo.actualizar++;
        });
    }
    const nuevoLibro = Object.assign({
        autor: "", categoria: "", editorial: "", anio: 0, ejemplares: 1,
        isbn: "", estante: "", seccion: "", nivel: "", estado: "Bueno", portada: ""
    }, p);
    return db.collection("libros").add(nuevoLibro).then(ref => {
        const nuevo = Object.assign({ id: ref.id }, nuevoLibro);
        registrados.set(clave, nuevo);
        libros.push(nuevo);
        conteo.crear++;
    });
}

function campoSocio(datos) {
    const p = { cedula: datos.cedula };
    if (datos.nombre) p.nombre = datos.nombre;
    if (datos.seccion) p.seccion = datos.seccion;
    if (datos.correo) p.correo = datos.correo;
    return p;
}

function aplicarFilaSocio(datos, registrados, conteo) {
    const clave = normalizarClave(datos.cedula);
    const p = campoSocio(datos);
    if (!p.nombre) p.nombre = datos.cedula;
    const existente = registrados.get(clave) || bibliotecaEstudiantes.find(s => normalizarClave(s.cedula) === clave);
    if (existente) {
        return db.collection("bibliotecaEstudiantes").doc(existente.id).update(p).then(() => {
            Object.assign(existente, p);
            registrados.set(clave, existente);
            conteo.actualizar++;
        });
    }
    const nuevoSocio = Object.assign({ seccion: "", correo: "", fechaAlta: new Date().toISOString() }, p);
    return db.collection("bibliotecaEstudiantes").add(nuevoSocio).then(ref => {
        const nuevo = Object.assign({ id: ref.id }, nuevoSocio);
        registrados.set(clave, nuevo);
        bibliotecaEstudiantes.push(nuevo);
        conteo.crear++;
    });
}