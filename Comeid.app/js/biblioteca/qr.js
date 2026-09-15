// =============================================
// ComeID Biblioteca - QR de libros y escáner
// =============================================

let codeReader = null;
let zxingControls = null;
let tokenScanner = 0;
let ultimoCodigo = "";
let ultimoTiempo = 0;
let escaneoDestino = ""; // "" | "prestamo" | "devolucion"
let contextoAudioScanner = null;

// Preparar el audio dentro del gesto del usuario para que el beep funcione después
function prepararAudioScanner() {
    try {
        if (!contextoAudioScanner) {
            contextoAudioScanner = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (contextoAudioScanner.state === "suspended") contextoAudioScanner.resume();
    } catch (e) { /* sin audio */ }
}

// Beep de confirmación: "ok" o "error"
function reproducirSonidoScanner(tipo) {
    try {
        if (!contextoAudioScanner) return;
        if (contextoAudioScanner.state === "suspended") contextoAudioScanner.resume();
        const ahora = contextoAudioScanner.currentTime;
        const tocar = (frecuencia, inicio, duracion, volumen) => {
            const osc = contextoAudioScanner.createOscillator();
            const gan = contextoAudioScanner.createGain();
            osc.type = "sine";
            osc.frequency.value = frecuencia;
            gan.gain.setValueAtTime(0.0001, ahora + inicio);
            gan.gain.exponentialRampToValueAtTime(volumen, ahora + inicio + 0.01);
            gan.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + duracion);
            osc.connect(gan);
            gan.connect(contextoAudioScanner.destination);
            osc.start(ahora + inicio);
            osc.stop(ahora + inicio + duracion + 0.02);
        };
        if (tipo === "ok") {
            tocar(880, 0, 0.15, 0.3);
            tocar(1320, 0.12, 0.15, 0.25);
        } else {
            tocar(220, 0, 0.25, 0.28);
        }
    } catch (e) { /* sin audio */ }
}

function vibrarScanner(ms) {
    try {
        if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* sin vibración */ }
}

// Muestra el resultado del escaneo en grande para que se alcance a leer
function mostrarResultadoScanner(texto, ok) {
    const div = document.getElementById("scannerResultLibro");
    if (!div) return;
    div.innerHTML = texto;
    div.style.display = "block";
    div.style.background = ok
        ? "rgba(16,185,129,0.15)"
        : "rgba(239,68,68,0.15)";
    div.style.color = ok ? "#10b981" : "#ef5350";
    div.style.border = ok
        ? "1px solid rgba(16,185,129,0.4)"
        : "1px solid rgba(239,68,68,0.4)";
}

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
    const resultDiv = document.getElementById("scannerResultLibro");
    if (resultDiv) resultDiv.style.display = "none";
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
    prepararAudioScanner();

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
        reproducirSonidoScanner("error");
        vibrarScanner(200);
        mostrarResultadoScanner(`<i class="fas fa-times-circle"></i> ${trad.scannerNoEncontrado}`, false);
        return;
    }

    if (escaneoDestino === "prestamo") {
        const select = document.getElementById("prestamoLibro");
        if (select) {
            select.value = libro.id;
            if (select.value !== libro.id) {
                reproducirSonidoScanner("error");
                vibrarScanner(200);
                mostrarResultadoScanner(`<i class="fas fa-ban"></i> ${trad.prestamoSinDisponibles}`, false);
                return;
            }
        }
        reproducirSonidoScanner("ok");
        vibrarScanner(120);
        mostrarResultadoScanner(`<i class="fas fa-check-circle"></i> ${trad.scannerUsarEnPrestamo}: ${escaparHTML(libro.titulo)}`, true);
        setTimeout(() => cerrarModalScanner(), 800);
        return;
    }

    const activos = prestamos.filter(p => p.libroId === libro.id && !p.devuelto);
    if (activos.length === 0) {
        reproducirSonidoScanner("error");
        vibrarScanner(200);
        mostrarResultadoScanner(`<i class="fas fa-times-circle"></i> ${trad.scannerNoPrestamoActivo}`, false);
        return;
    }
    reproducirSonidoScanner("ok");
    vibrarScanner(120);
    if (activos.length === 1) {
        mostrarResultadoScanner(`<i class="fas fa-check-circle"></i> ${trad.scannerDevolverRegistrada}: ${escaparHTML(libro.titulo)}`, true);
        setTimeout(() => {
            cerrarModalScanner();
            devolverPrestamo(activos[0].id);
        }, 800);
        return;
    }
    // Varios ejemplares prestados: se elige cuál se devuelve
    mostrarResultadoScanner(`<i class="fas fa-check-circle"></i> Varios préstamos: elige el ejemplar`, true);
    setTimeout(() => {
        cerrarModalScanner();
        mostrarOpcionesDevolucion(libro, activos);
    }, 800);
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
