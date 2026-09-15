// =============================================
// Portal Estudiantes - Credencial digital con QR
// Misma tarjeta vertical (600x900) que se genera en
// el panel del comedor al crear/regenerar el QR.
// El QR usa el mismo formato que los escáneres de
// Integra ID (comedor y biblioteca): nombre|cedula|seccion|nivel|Tipo
// =============================================

function contenidoQR() {
    const est = App.estudiante;
    const nombre = limpiarTextoQR(est.nombre);
    const cedula = limpiarTextoQR(est.cedula);
    const seccion = limpiarTextoQR(est.seccion);
    const nivel = limpiarTextoQR(est.nivel) || "N/A";
    const tipo = est.tipo === "Becado" ? "B" : "P";
    return `${nombre}|${cedula}|${seccion}|${nivel}|${tipo}`;
}

// Crea un canvas con el QR (con zona blanca de seguridad)
function crearCanvasQR(contenido, cellSize, margin) {
    const qr = qrcode(0, "M");
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

// Traza un rectángulo redondeado en el contexto de dibujo
function redondearRuta(ctx, x, y, w, h, r) {
    const radio = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + w - radio, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radio);
    ctx.lineTo(x + w, y + h - radio);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radio, y + h);
    ctx.lineTo(x + radio, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radio);
    ctx.lineTo(x, y + radio);
    ctx.quadraticCurveTo(x, y, x + radio, y);
    ctx.closePath();
}

// Divide el texto en líneas que caben en el ancho máximo
function envolverTexto(ctx, texto, maxAncho, fuente) {
    const palabras = String(texto).split(" ");
    const lineas = [];
    let linea = "";
    ctx.font = fuente;
    palabras.forEach((palabra) => {
        const prueba = linea ? linea + " " + palabra : palabra;
        if (ctx.measureText(prueba).width <= maxAncho) {
            linea = prueba;
        } else {
            if (linea) lineas.push(linea);
            linea = palabra;
        }
    });
    if (linea) lineas.push(linea);
    return lineas;
}

// Dibuja la imagen ajustada al área (como object-fit: contain)
function dibujarImagenCentrada(ctx, img, x, y, w, h) {
    const escala = Math.min(w / img.width, h / img.height);
    const dw = img.width * escala;
    const dh = img.height * escala;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
}

// Dibuja la imagen recortada para cubrir el área (como object-fit: cover)
function dibujarImagenCubierta(ctx, img, x, y, w, h) {
    const escala = Math.max(w / img.width, h / img.height);
    const dw = img.width * escala;
    const dh = img.height * escala;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
}

// Carga una imagen y resuelve cuando está lista (null si falla o expira el tiempo)
function cargarImagen(src, timeout, usarCrossOrigin) {
    return new Promise((resolve) => {
        const img = new Image();
        let resuelto = false;
        const terminar = (valor) => {
            if (!resuelto) {
                resuelto = true;
                resolve(valor);
            }
        };
        img.onload = () => terminar(img);
        img.onerror = () => terminar(null);
        if (usarCrossOrigin && /^https?:/i.test(src)) img.crossOrigin = "anonymous";
        img.src = src;
        setTimeout(() => terminar(img.complete && img.naturalWidth > 0 ? img : null), timeout || 3000);
    });
}

// Dibuja la credencial digital (tarjeta vertical 600x900) y devuelve el canvas
async function dibujarCredencial(est) {
    const W = 600;
    const H = 900;
    const headerAltura = 580;
    const colorAzul = "#1b2f7a";
    const colorAzulOscuro = "#0e1b4d";

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const logoImg = await cargarImagen("assets/logo.png", 3000);
    const fotoImg = est.foto ? await cargarImagen(est.foto, 4000, true) : null;

    // Recortar todo el dibujo a la forma redondeada de la tarjeta
    redondearRuta(ctx, 0, 0, W, H, 28);
    ctx.save();
    ctx.clip();

    // Cabecera azul oscuro (gradiente)
    const grad = ctx.createLinearGradient(0, 0, 0, headerAltura);
    grad.addColorStop(0, colorAzul);
    grad.addColorStop(1, colorAzulOscuro);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, headerAltura);

    // ---- QR (arriba, en la cabecera azul) ----
    const textoQR = contenidoQR();
    const qrCanvas = crearCanvasQR(textoQR, 8, 5);
    const qrTam = 270;
    const qrX = (W - qrTam) / 2;
    const qrY = 30;
    redondearRuta(ctx, qrX - 10, qrY - 10, qrTam + 20, qrTam + 20, 18);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.drawImage(qrCanvas, qrX, qrY, qrTam, qrTam);

    // ---- NOMBRE ----
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    const nombre = String(est.nombre || "");
    const nombreY = qrY + qrTam + 24;
    ctx.font = "bold 44px 'Segoe UI', sans-serif";
    const lineasNombre = envolverTexto(ctx, nombre, 480, "bold 44px 'Segoe UI', sans-serif").slice(0, 2);
    lineasNombre.forEach((linea, i) => {
        ctx.fillText(linea, W / 2, nombreY + i * 54);
    });

    // ---- DATOS SECUNDARIOS ----
    const nivelDisplay = est.nivel || "N/A";
    const tipoDisplay = est.tipo === "Becado" ? "Becado" : "Paga";
    const lineaDatos1 = "Sección: " + (est.seccion || "N/A");
    const lineaDatos2 = "Nivel: " + nivelDisplay + "  •  " + tipoDisplay;
    const datosY = nombreY + lineasNombre.length * 54 + 12;
    ctx.font = "500 27px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(lineaDatos1, W / 2, datosY);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(lineaDatos2, W / 2, datosY + 40);

    // ---- Pie de la cabecera (rellena el espacio) ----
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "600 15px 'Segoe UI', sans-serif";
    ctx.fillText("CREDENCIAL ESTUDIANTIL", W / 2, headerAltura - 42);

    // ---- PARTE INFERIOR BLANCA ----
    const parteBajaY = headerAltura;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, parteBajaY, W, H - parteBajaY);
    ctx.fillStyle = "#e6e9f2";
    ctx.fillRect(0, parteBajaY, W, 3);

    // Logo Integra ID (izquierda)
    const logoBox = { x: 80, y: parteBajaY + 55, w: 180, h: 180 };
    if (logoImg) {
        dibujarImagenCentrada(ctx, logoImg, logoBox.x, logoBox.y, logoBox.w, logoBox.h);
    } else {
        const badge = 72;
        const badgeX = logoBox.x + (logoBox.w - badge) / 2;
        const badgeY = logoBox.y + 8;
        redondearRuta(ctx, badgeX, badgeY, badge, badge, 18);
        ctx.fillStyle = colorAzul;
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 46px 'Segoe UI', sans-serif";
        ctx.fillText("C", badgeX + badge / 2, badgeY + badge / 2 + 4);
        ctx.font = "bold 30px 'Segoe UI', sans-serif";
        ctx.fillText("ComeID", badgeX + badge / 2, badgeY + badge + 34);
    }

    // ---- FOTO (derecha) ----
    const fotoTam = 230;
    const fotoX = 290;
    const fotoY = parteBajaY + (H - parteBajaY - fotoTam) / 2;
    redondearRuta(ctx, fotoX - 6, fotoY - 6, fotoTam + 12, fotoTam + 12, 26);
    ctx.fillStyle = colorAzul;
    ctx.fill();
    redondearRuta(ctx, fotoX, fotoY, fotoTam, fotoTam, 20);
    ctx.save();
    ctx.clip();
    if (fotoImg) {
        dibujarImagenCubierta(ctx, fotoImg, fotoX, fotoY, fotoTam, fotoTam);
    } else {
        ctx.fillStyle = "#d7deff";
        ctx.fillRect(fotoX, fotoY, fotoTam, fotoTam);
        ctx.fillStyle = "#5d6ea8";
        ctx.font = "bold 96px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const inicial = (est.nombre || "?").trim().charAt(0).toUpperCase() || "?";
        ctx.fillText(inicial, fotoX + fotoTam / 2, fotoY + fotoTam / 2 + 6);
    }
    ctx.restore();

    ctx.restore();
    return canvas;
}

function nombreArchivoCredencial() {
    const est = App.estudiante;
    return "Credencial_" + limpiarTextoQR(est.nombre).replace(/\s+/g, "_") + "_" + (est.cedula || "") + ".png";
}

async function renderQR() {
    const est = App.estudiante;
    const c = document.getElementById("contenido");

    c.innerHTML = `
        <div class="page-title">Mi código QR</div>
        <p class="page-subtitle">Tu credencial estudiantil única para el comedor y la biblioteca.</p>

        <div class="card qr-card" style="text-align:center;">
            <div id="credencialBox" style="display:inline-block; width:100%; max-width:320px;"></div>
            <div class="grid" style="grid-template-columns:1fr 1fr; margin-top:14px;">
                <button class="btn btn-ghost" onclick="descargarCredencialPNG()"><i class="fa-solid fa-download"></i> Descargar credencial</button>
                <button class="btn" onclick="imprimirCredencial()"><i class="fa-solid fa-print"></i> Imprimir</button>
            </div>
            <div style="margin-top:14px; font-size:12px; color:var(--text-secondary);">
                Muestra esta credencial al personal del comedor o de la biblioteca para identificarte.
            </div>
        </div>

        <div class="section-title"><i class="fa-solid fa-circle-info"></i> ¿Para qué sirve?</div>
        <div class="card" style="font-size:13px; color:var(--text-secondary); line-height:1.7;">
            <div><i class="fa-solid fa-utensils"></i> Comedor: registra tu asistencia al marcar tu comida.</div>
            <div style="margin-top:8px;"><i class="fa-solid fa-book-open"></i> Biblioteca: identifica tus préstamos y devoluciones.</div>
        </div>
    `;

    const canvas = await dibujarCredencial(est);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    canvas.style.borderRadius = "16px";
    canvas.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
    document.getElementById("credencialBox").appendChild(canvas);
}

function descargarCredencialPNG() {
    const canvas = document.querySelector("#credencialBox canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = nombreArchivoCredencial();
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Credencial descargada");
}

function imprimirCredencial() {
    const canvas = document.querySelector("#credencialBox canvas");
    if (!canvas) return;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Credencial Integra ID</title></head><body style="margin:0;text-align:center;"><img src="${canvas.toDataURL("image/png")}" style="max-width:100%;"></body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
}

const PAGE = {
    init: renderQR
};

iniciarApp(PAGE.init);