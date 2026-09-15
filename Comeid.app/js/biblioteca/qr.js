// =============================================
// ComeID Biblioteca - QR de libros y escáner
// =============================================

let codeReader = null;
let zxingControls = null;
let tokenScanner = 0;
let ultimoCodigo = "";
let ultimoTiempo = 0;
let escaneoDestino = ""; // "" | "prestamo" | "devolucion"

// Crea un canvas con el QR (con zona blanca de seguridad)
function crearCanvasQR(contenido, cellSize, margin) {
    const qr = qrcode(0, "L");
    qr.addData(contenido);
    qr.make();
    const count = qr.getModuleCount();
    const tam = (count + margin * 2) * cellSize;
    const cv = document.createElement("canvas");
    cv.width = tam;
    cv.height = tam;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tam, tam);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < count; r += 1) {
        for (let c = 0; c < count; c += 1) {
            if (qr.isDark(r, c)) {
                ctx.fillRect(c * cellSize + margin * cellSize, r * cellSize + margin * cellSize, cellSize, cellSize);
            }
        }
    }
    return cv;
}

function payloadQRLibro(libro) {
    return "BIB|" + (libro.codigo || libro.id);
}

function libroDesdePayload(texto) {
    const contenido = String(texto || "").trim();
    let codigo = contenido;
    if (contenido.indexOf("BIB|") === 0) codigo = contenido.slice(4).trim();
    return libros.find(l => l.codigo === codigo) || libros.find(l => l.id === codigo);
}

// =============================================
// MOSTRAR E IMPRIMIR QR DE UN LIBRO
// =============================================

function mostrarQRLibro(id) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const libro = libros.find(l => l.id === id);
    if (!libro) {
        mostrarNotificacion(trad.scannerNoEncontrado, "error");
        return;
    }
    const cv = crearCanvasQR(payloadQRLibro(libro), 5, 4);
    cv.style.width = "180px";
    cv.style.height = "180px";
    const caja = document.getElementById("qrCanvasBox");
    if (!caja) return;
    caja.innerHTML = "";
    caja.appendChild(cv);
    document.getElementById("qrModalLibro").textContent =
        (libro.codigo || "") + " — " + libro.titulo;
    document.getElementById("modalQR").classList.add("show");
}

function imprimirQRLibro() {
    const cv = document.getElementById("qrCanvasBox").querySelector("canvas");
    if (!cv) return;
    const ventana = window.open("", "_blank", "width=400,height=520");
    if (!ventana) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const libro = document.getElementById("qrModalLibro").textContent;
    ventana.document.write(`<!DOCTYPE html><html><head><title>QR</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:20px;">
            <h3 style="margin:0;">ComeID ${trad.headerLogo}</h3>
            ${cv.outerHTML}
            <p style="font-weight:700;font-size:16px;margin:8px 0;">${libro}</p>
            <p style="color:#666;font-size:13px;">${trad.qrModalLibro}</p>
        </body></html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
}

function cerrarModalQR() {
    document.getElementById("modalQR").classList.remove("show");
}

// =============================================
// ESCÁNER DE QR (ZXing)
// =============================================

async function abrirScanner(destino) {
    if (!puedeGestionar()) {
        mostrarNotificacion((traducciones[configuracion.idioma] || traducciones.Español).permisoDenegado, "error");
        return;
    }
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    escaneoDestino = destino;
    const statusDiv = document.getElementById("scannerStatus");
    statusDiv.textContent = trad.scannerStatus;
    statusDiv.style.display = "block";
    document.getElementById("modalScanner").classList.add("show");
    try {
        await cargarScript(URL_ZXING);
    } catch (e) {
        mostrarNotificacion(e.message, "error");
        return;
    }
    iniciarEscaneoLibro();
}

function iniciarEscaneoLibro() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    if (typeof ZXing === "undefined" || !ZXing.BrowserQRCodeReader) {
        mostrarNotificacion(trad.scannerCamaraNoSoportada, "error");
        return;
    }
    detenerEscaneoLibro();
    ultimoCodigo = "";
    ultimoTiempo = 0;

    const video = document.getElementById("scannerVideo");
    const statusDiv = document.getElementById("scannerStatus");
    codeReader = new ZXing.BrowserQRCodeReader();
    const token = ++tokenScanner;

    let intentos = 0;
    let ultimoUpdate = 0;

    const manejador = (result, err) => {
        if (result && result.text) {
            if (statusDiv) statusDiv.style.display = "none";
            procesarCodigoLibro(result.text);
        } else if (statusDiv) {
            const ahora = Date.now();
            if (ahora - ultimoUpdate > 500) {
                ultimoUpdate = ahora;
                intentos++;
                statusDiv.textContent = (trad.scannerEscaneando || "Escaneando") + " (" + intentos + ")";
                statusDiv.style.display = "block";
            }
        }
    };

    const scannerListo = controls => {
        if (token !== tokenScanner) {
            try { controls.stop(); } catch (e) {}
            return;
        }
        zxingControls = controls;
        document.getElementById("startScannerBtn").style.display = "none";
        document.getElementById("stopScannerBtn").style.display = "inline-block";
    };

    const mostrarError = err => {
        if (token !== tokenScanner) return;
        console.error("Error al acceder a la cámara: ", err);
        statusDiv.textContent = trad.scannerErrorCamara + (err.message || err);
        statusDiv.style.display = "block";
        mostrarNotificacion(trad.scannerErrorCamara + (err.message || err), "error");
    };

    codeReader.decodeFromVideoDevice(undefined, video, manejador).then(scannerListo).catch(err => {
        if (token !== tokenScanner) return;
        console.warn("Cámara trasera no disponible, intentando cualquier cámara: ", err);
        codeReader.getVideoInputDevices().then(devices => {
            if (token !== tokenScanner) return;
            if (!devices || devices.length === 0) {
                statusDiv.textContent = trad.scannerCamaraNoEncontrada;
                statusDiv.style.display = "block";
                mostrarNotificacion(trad.scannerCamaraNoEncontrada, "error");
                return;
            }
            codeReader.decodeFromVideoDevice(devices[0].deviceId, video, manejador).then(scannerListo).catch(mostrarError);
        }).catch(mostrarError);
    });
}

function detenerEscaneoLibro() {
    tokenScanner++;
    ultimoCodigo = "";
    ultimoTiempo = 0;
    if (zxingControls) {
        try { zxingControls.stop(); } catch (e) {}
        zxingControls = null;
    }
    if (codeReader) {
        try { codeReader.reset(); } catch (e) {}
        codeReader = null;
    }
    const video = document.getElementById("scannerVideo");
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    const startBtn = document.getElementById("startScannerBtn");
    const stopBtn = document.getElementById("stopScannerBtn");
    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";
}

function cerrarModalScanner() {
    detenerEscaneoLibro();
    document.getElementById("modalScanner").classList.remove("show");
    escaneoDestino = "";
}

function procesarCodigoLibro(texto) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const ahora = Date.now();
    if (texto === ultimoCodigo && ahora - ultimoTiempo < 5000) return;
    ultimoCodigo = texto;
    ultimoTiempo = ahora;

    const libro = libroDesdePayload(texto);
    if (!libro) {
        mostrarNotificacion(trad.scannerNoEncontrado, "error");
        return;
    }

    if (escaneoDestino === "prestamo") {
        const select = document.getElementById("prestamoLibro");
        if (select) {
            select.value = libro.id;
            if (select.value !== libro.id) {
                mostrarNotificacion(trad.prestamoSinDisponibles, "error");
                return;
            }
        }
        mostrarNotificacion(trad.scannerUsarEnPrestamo + ": " + libro.titulo, "ok");
        cerrarModalScanner();
        return;
    }

    const activos = prestamos.filter(p => p.libroId === libro.id && !p.devuelto);
    if (activos.length === 0) {
        mostrarNotificacion(trad.scannerNoPrestamoActivo, "error");
        return;
    }
    cerrarModalScanner();
    if (activos.length === 1) {
        mostrarNotificacion(trad.scannerDevolverRegistrada + ": " + libro.titulo, "ok");
        devolverPrestamo(activos[0].id);
        return;
    }
    // Varios ejemplares prestados: se elige cuál se devuelve
    mostrarOpcionesDevolucion(libro, activos);
}

// Muestra la lista de préstamos activos del libro para elegir cuál devolver
function mostrarOpcionesDevolucion(libro, activos) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const modal = document.getElementById("modalDevolverEjemplar");
    if (!modal) return;
    const titulo = document.getElementById("devolverEjemplarTitulo");
    if (titulo) titulo.textContent = trad.devolverElegirEjemplar + ": " + libro.titulo;
    const subtitulo = document.getElementById("devolverEjemplarSubtitulo");
    if (subtitulo) subtitulo.textContent = activos.length + " " + (trad.prestamoActivos || "préstamos activos");
    const cerrarBtn = document.getElementById("devolverEjemplarCerrar");
    if (cerrarBtn) cerrarBtn.textContent = trad.devolverEjemplarCerrar;
    const lista = document.getElementById("devolverEjemplarLista");
    if (lista) {
        lista.innerHTML = activos.map(p => `
            <div class="scanner-lista-item" style="cursor:pointer;" onclick="devolverPrestamo('${p.id}')">
                <div class="scanner-lista-info">
                    <span class="scanner-lista-nombre">${escaparHTML(p.prestamistaNombre)}</span>
                    <span class="scanner-lista-detalle">${fechaLegible(p.fechaPrestamo)} → ${fechaLegible(p.fechaVencimiento)}</span>
                </div>
                <i class="fas fa-undo-alt" style="color:var(--accent-color);"></i>
            </div>
        `).join("");
    }
    modal.classList.add("show");
}

function cerrarModalDevolverEjemplar() {
    document.getElementById("modalDevolverEjemplar").classList.remove("show");
}
