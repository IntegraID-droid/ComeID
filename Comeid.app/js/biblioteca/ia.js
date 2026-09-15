// =============================================
// ComeID Biblioteca - IA (Gemini directo + fallback local)
// Reutiliza GEMINI_API_KEY_DIRECTO / GEMINI_MODELO_DIRECTO del comedor
// =============================================

const GEMINI_LIMITE_DIARIO = 20;
const GEMINI_MODELOS_RETRY = ["gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-pro-latest", "gemini-3.8-flash"];
let geminiUsado = false;

function esErrorTransitorioGemini(status) {
    const s = Number(status) || 0;
    return s === 429 || s === 500 || s === 502 || s === 503 || s === 504;
}

function esperarMs(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generarConReintentos(cuerpo) {
    const modelos = [GEMINI_MODELO_DIRECTO].concat(GEMINI_MODELOS_RETRY.filter(m => m !== GEMINI_MODELO_DIRECTO));
    let ultimoError = null;
    for (const modelo of modelos) {
        for (let intento = 1; intento <= 2; intento++) {
            try {
                const respuesta = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-goog-api-key": obtenerClaveGemini() },
                    body: JSON.stringify(cuerpo)
                });
                if (!respuesta.ok) {
                    const errData = await respuesta.json().catch(() => null);
                    const e = new Error((errData && errData.error && errData.error.message) || ("Gemini " + respuesta.status));
                    e.code = String(respuesta.status);
                    if (esErrorTransitorioGemini(respuesta.status)) { ultimoError = e; await esperarMs(intento * 900); continue; }
                    if (respuesta.status === 404 || respuesta.status === 403) { ultimoError = e; break; }
                    throw e;
                }
                const data = await respuesta.json();
                const partes = (data && data.candidates || [])
                    .map(c => (c.content && c.content.parts || []).map(p => p.text || "").join(""))
                    .join("\n");
                if (!partes) throw new Error("Gemini no devolvió respuesta");
                geminiUsado = true;
                gastarConsultaGemini();
                return partes;
            } catch (error) {
                if (error && error.code && esErrorTransitorioGemini(error.code)) {
                    ultimoError = error;
                    await esperarMs(500 * intento);
                    continue;
                }
                if (error && (String(error.code) === "404" || String(error.code) === "403")) {
                    ultimoError = error;
                    break;
                }
                throw error;
            }
        }
    }
    throw ultimoError || new Error("Gemini no disponible");
}

function geminiContadorDia() {
    const hoy = new Date().toISOString().slice(0, 10);
    let datos = { fecha: hoy, n: 0 };
    try {
        const guardado = JSON.parse(localStorage.getItem("geminiContadorDia") || "null");
        if (guardado && guardado.fecha === hoy) datos = guardado;
    } catch (e) { console.error("Error al leer contador de IA: ", e); }
    return datos;
}

function gastarConsultaGemini() {
    const datos = geminiContadorDia();
    datos.n++;
    localStorage.setItem("geminiContadorDia", JSON.stringify(datos));
    actualizarBadgeIA();
    return datos.n;
}

function consultasGeminiRestantes() {
    return Math.max(0, GEMINI_LIMITE_DIARIO - geminiContadorDia().n);
}

function geminiLimiteAlcanzado() {
    return consultasGeminiRestantes() <= 0;
}

function esErrorLimiteGemini(error) {
    return !!(error && (
        error.limite ||
        String(error.code || "").toLowerCase().includes("resource-exhausted") ||
        String(error.message || "").toLowerCase().includes("limite") ||
        String(error.message || "").toLowerCase().includes("limit")
    ));
}

function geminiDisponible() {
    const clave = obtenerClaveGemini();
    return typeof clave === "string" && clave.length > 10;
}

function llamarGemini(tipo, contexto, pregunta) {
    const idioma = configuracion.idioma;
    const idiomaRespuesta = (traducciones[idioma] || traducciones.Español).iaIdiomaRespuesta || "español";
    const instruccion = tipo === "chat"
        ? (pregunta
            ? "Responde la pregunta del usuario de forma clara, útil y amable. Si la respuesta se puede fundamentar con el CONTEXTO de la biblioteca, úsalo como fuente; si la pregunta no está relacionada con la biblioteca, respóndela igualmente con tu conocimiento general, sin inventar datos del catálogo.\nPREGUNTA: " + pregunta
            : "Preséntate brevemente y explica qué puedes hacer con los datos de la biblioteca.")
        : tipo === "descripcion"
            ? "Con base en el CONTEXTO, recomienda los libros del catálogo que mejor coincidan con esta descripción: " + pregunta +
              ". Devuelve una lista breve con título, autor y disponibilidad de cada uno."
            : "Analiza el CONTEXTO de la biblioteca y responde " +
              (tipo === "analisis"
                  ? "con un análisis claro, estructurado y breve."
                  : "con recomendaciones de lectura útiles para los estudiantes, breves y concretas.");

    const prompt = [
        "Eres el asistente de la biblioteca institucional de " + (configuracion.institucion || "la institución") + ".",
        "Responde SIEMPRE en " + idiomaRespuesta + ".",
        "En el chat responde CUALQUIER pregunta del usuario, esté o no relacionada con la biblioteca: si se puede responder con los datos del CONTEXTO, úsalos; si no, respóndela con tu conocimiento general.",
        "CONTEXTO (datos reales de la biblioteca):",
        "```json",
        JSON.stringify(contexto),
        "```",
        "INSTRUCCIÓN:",
        instruccion
    ].join("\n\n");

    const cuerpo = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
    };

    return generarConReintentos(cuerpo);
}

function intentarGemini(tipo, contexto, pregunta) {
    if (geminiLimiteAlcanzado()) {
        const e = new Error("Limite diario alcanzado");
        e.limite = true;
        return Promise.reject(e);
    }
    return llamarGemini(tipo, contexto, pregunta);
}

function actualizarBadgeIA() {
    const badge = document.getElementById("iaEstadoBadge");
    if (!badge) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    if (geminiDisponible() && !geminiLimiteAlcanzado()) {
        const restantes = consultasGeminiRestantes();
        badge.textContent = (trad.iaBadgeGemini || "IA Gemini activa") + (restantes > 0 ? ` (${restantes} hoy)` : "");
        badge.style.background = "rgba(16,185,129,0.15)";
        badge.style.color = "#10b981";
    } else if (geminiDisponible() && geminiLimiteAlcanzado()) {
        badge.textContent = trad.iaBadgeLocal || "IA local";
        badge.style.background = "var(--bg-tertiary)";
        badge.style.color = "#fbbf24";
    } else {
        badge.textContent = trad.iaBadgeLocal || "IA local";
        badge.style.background = "var(--bg-tertiary)";
        badge.style.color = "var(--text-secondary)";
    }
}

// =============================================
// VISTA DE IA
// =============================================

function mostrarBibIA() {
    activarVista("ia");
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    document.getElementById("contenido").innerHTML = `
        <div class="student-header">
            <h1 class="title">${trad.iaSectionTitle}</h1>
            <span class="badge-ia" id="iaEstadoBadge"></span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-top: 18px;">
            <div class="panel">
                <div class="ia-tabs">
                    <button class="add-btn" onclick="analizarBiblioteca()"><i class="fas fa-chart-bar"></i> ${trad.iaAnalizarBtn}</button>
                    <button class="add-btn" style="background:#10b981;" onclick="recomendarBiblioteca()"><i class="fas fa-lightbulb"></i> ${trad.iaRecomendacionesBtn}</button>
                    <button class="add-btn" style="background:#a78bfa;" onclick="toggleDescripcionIA()"><i class="fas fa-search"></i> ${trad.iaDescripcionBtn}</button>
                </div>
                <div id="iaDescripcionBox" style="display:none; margin-top:14px;">
                    <textarea id="iaDescripcionInput" class="search-box" rows="3" style="width:100%; resize:vertical;" placeholder="${trad.iaDescripcionPlaceholder}"></textarea>
                    <button class="add-btn" style="margin-top:8px; background:#a78bfa;" onclick="buscarPorDescripcion()"><i class="fas fa-search"></i> ${trad.iaDescripcionBtn}</button>
                </div>
                <div class="ia-mensaje" id="iaResultado" style="margin-top: 14px;">${trad.iaChatInicial}</div>
            </div>
            <div class="panel">
                <h2 style="color: var(--accent-color); margin-bottom: 10px;">${trad.iaChatTitle}</h2>
                <div class="ia-chat" id="iaChatBox">
                    <div class="chat-burbuja chat-ia">${trad.iaChatInicial}</div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <input type="text" id="iaChatInput" class="search-box" placeholder="${trad.iaChatPlaceholder}">
                    <button class="add-btn" onclick="enviarChatIA()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;
    actualizarBadgeIA();
}

// =============================================
// CONTEXTO Y ACCIONES
// =============================================

function contextoBiblioteca() {
    const disponibles = librosDisponibles();
    const conteoPorLibro = {};
    const conteoPorPrestamista = {};
    prestamos.forEach(p => {
        const k = p.libroTitulo || "—";
        conteoPorLibro[k] = (conteoPorLibro[k] || 0) + 1;
        const p2 = p.prestamistaNombre || "—";
        conteoPorPrestamista[p2] = (conteoPorPrestamista[p2] || 0) + 1;
    });
    return {
        institucion: configuracion.institucion,
        fechaConsulta: new Date().toISOString().slice(0, 10),
        catalogo: {
            totalLibros: libros.length,
            totalEjemplares: disponibles.reduce((s, l) => s + (Number(l.ejemplares) || 0), 0),
            ejemplaresDisponibles: disponibles.reduce((s, l) => s + l.disponibles, 0),
            titulos: libros.map(l => l.titulo)
        },
        prestamos: {
            total: prestamos.length,
            activos: prestamos.filter(p => !p.devuelto).length,
            atrasados: prestamos.filter(p => !p.devuelto && esPrestamoAtrasado(p)).length,
            devueltos: prestamos.filter(p => p.devuelto).length
        },
        librosMasPrestados: Object.entries(conteoPorLibro).sort((a, b) => b[1] - a[1]).slice(0, 5),
        personasMasPrestan: Object.entries(conteoPorPrestamista).sort((a, b) => b[1] - a[1]).slice(0, 5),
        prestamistas: { estudiantes: estudiantes.length, profesores: profesores.length }
    };
}

function analizarBiblioteca() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const box = document.getElementById("iaResultado");
    if (!box) return;
    box.className = "ia-mensaje";
    box.textContent = trad.iaAnalizando;
    intentarGemini("analisis", contextoBiblioteca()).then(texto => {
        box.className = "ia-mensaje ia-gemini";
        box.innerHTML = "<strong>" + escaparHTML(trad.iaAnalisis) + "</strong><br>" + texto.replace(/\n/g, "<br>");
    }).catch(error => {
        box.className = "ia-mensaje ia-local";
        box.innerHTML = analisisLocal(trad) + (esErrorLimiteGemini(error) ? "" : "<br><br><small>Gemini: " + escaparHTML(error.message) + "</small>");
    });
}

function analisisLocal(trad) {
    const disponibles = librosDisponibles();
    const activos = prestamos.filter(p => !p.devuelto);
    const atrasados = activos.filter(esPrestamoAtrasado);
    const totalEjemplares = disponibles.reduce((s, l) => s + (Number(l.ejemplares) || 0), 0);
    const cats = {};
    libros.forEach(l => {
        const c = l.categoria || "Otro";
        cats[c] = (cats[c] || 0) + 1;
    });
    const principal = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    const consejo = atrasados.length > 0 ? trad.iaConsejoAtrasos : trad.iaConsejoBien;
    return `<strong>${escaparHTML(trad.iaAnalisis)}</strong>
        <ul style="margin:10px 0 0 18px;">
            <li>${libros.length} ${trad.iaLibrosCat}</li>
            <li>${totalEjemplares} ${trad.iaEjemplares}</li>
            <li>${disponibles.filter(l => l.disponibles > 0).length} ${trad.iaConStock}</li>
            <li>${activos.length} ${trad.iaPrestamosActivos}</li>
            <li>${atrasados.length} ${trad.iaPrestamosAtrasados}</li>
            <li>${prestamos.filter(p => p.devuelto).length} ${trad.iaPrestamosDevueltos}</li>
            <li>${trad.iaCategoria}: ${principal ? escaparHTML(principal[0]) : "—"}</li>
        </ul>
        <p style="margin-top:10px;">${consejo}</p>`;
}

function recomendarBiblioteca() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const box = document.getElementById("iaResultado");
    if (!box) return;
    box.className = "ia-mensaje";
    box.textContent = trad.iaAnalizando;
    intentarGemini("recomendaciones", contextoBiblioteca()).then(texto => {
        box.className = "ia-mensaje ia-gemini";
        box.innerHTML = "<strong>" + escaparHTML(trad.iaRecomendacionesBtn) + "</strong><br>" + texto.replace(/\n/g, "<br>");
    }).catch(error => {
        box.className = "ia-mensaje ia-local";
        box.innerHTML = recomendacionesLocal(trad);
    });
}

function recomendacionesLocal(trad) {
    const conStock = librosDisponibles().filter(l => l.disponibles > 0);
    if (conStock.length === 0) return trad.iaRecomendacionSinDatos;
    const sugeridos = conStock.slice().sort((a, b) => b.disponibles - a.disponibles).slice(0, 4);
    return `<strong>${escaparHTML(trad.iaSugerencia)}</strong>
        <ul style="margin:10px 0 0 18px;">
            ${sugeridos.map(l => `<li><strong>${escaparHTML(l.titulo)}</strong> — ${escaparHTML(l.autor || "")} (${l.disponibles} ${trad.iaDisponibles})</li>`).join("")}
        </ul>`;
}

// =============================================
// BÚSQUEDA POR DESCRIPCIÓN
// =============================================

function toggleDescripcionIA() {
    const box = document.getElementById("iaDescripcionBox");
    if (box) box.style.display = box.style.display === "none" ? "block" : "none";
}

function buscarPorDescripcion() {
    const input = document.getElementById("iaDescripcionInput");
    const box = document.getElementById("iaResultado");
    if (!input || !box) return;
    const descripcion = input.value.trim();
    if (!descripcion) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    box.className = "ia-mensaje";
    box.textContent = trad.iaDescripcionBuscando;
    intentarGemini("descripcion", contextoBiblioteca(), descripcion).then(texto => {
        box.className = "ia-mensaje ia-gemini";
        box.innerHTML = "<strong>" + escaparHTML(trad.iaDescripcionResultados) + "</strong><br>" + texto.replace(/\n/g, "<br>");
    }).catch(() => {
        box.className = "ia-mensaje ia-local";
        box.innerHTML = buscarDescripcionLocal(descripcion, trad);
    });
}

function buscarDescripcionLocal(descripcion, trad) {
    const disponibles = librosDisponibles();
    const tokens = descripcion.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const puntuados = disponibles.map(l => {
        const texto = [l.titulo, l.autor, l.categoria, l.editorial, l.isbn, l.estante, l.seccion, l.nivel]
            .filter(Boolean).join(" ").toLowerCase();
        let puntos = 0;
        tokens.forEach(t => { if (texto.includes(t)) puntos++; });
        return { libro: l, puntos };
    }).filter(x => x.puntos > 0)
        .sort((a, b) => b.puntos - a.puntos || b.libro.disponibles - a.libro.disponibles)
        .slice(0, 5);

    if (puntuados.length === 0) return trad.iaDescripcionSinResultados;
    return `<strong>${escaparHTML(trad.iaDescripcionResultados)}</strong>
        <ul style="margin:10px 0 0 18px;">
            ${puntuados.map(x => `<li><strong>${escaparHTML(x.libro.titulo)}</strong> — ${escaparHTML(x.libro.autor || "")} (${x.libro.disponibles} ${trad.iaDisponibles})</li>`).join("")}
        </ul>`;
}

// =============================================
// CHAT
// =============================================

function enviarChatIA() {
    const input = document.getElementById("iaChatInput");
    const box = document.getElementById("iaChatBox");
    if (!input || !box) return;
    const pregunta = input.value.trim();
    if (!pregunta) return;
    const trad = traducciones[configuracion.idioma] || traducciones.Español;

    box.innerHTML += `<div class="chat-burbuja chat-usuario">${escaparHTML(pregunta)}</div>`;
    box.innerHTML += `<div class="chat-burbuja chat-ia">${trad.iaAnalizando}</div>`;
    const ultima = box.lastElementChild;
    box.scrollTop = box.scrollHeight;
    input.value = "";

    const responder = (texto) => {
        if (ultima) {
            ultima.className = "chat-burbuja chat-ia";
            ultima.innerHTML = texto;
            box.scrollTop = box.scrollHeight;
        }
    };

    intentarGemini("chat", contextoBiblioteca(), pregunta).then(texto => {
        responder(texto.replace(/\n/g, "<br>"));
    }).catch(() => {
        responder(respuestaLocalChat(pregunta));
    });
}

function respuestaLocalChat(pregunta) {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    const q = (pregunta || "").toLowerCase();
    const atrasados = prestamos.filter(p => !p.devuelto && esPrestamoAtrasado(p));
    const disponibles = librosDisponibles();

    const libro = libros.find(l => l.titulo && l.titulo.toLowerCase().includes(q)) ||
        libros.find(l => l.autor && l.autor.toLowerCase().includes(q));
    if (libro) {
        const disp = (disponibles.find(l => l.id === libro.id) || libro).disponibles;
        return `<strong>${escaparHTML(libro.titulo)}</strong><br>${escaparHTML(libro.autor || "")}<br>${trad.iaDisponibles}: ${disp} de ${Number(libro.ejemplares) || 0}`;
    }
    if (/(atrasad|overdue|retard)/i.test(pregunta)) {
        if (atrasados.length === 0) return trad.iaLocalSinAtrasos;
        return trad.iaLocalAtrasos + " (" + atrasados.length + "):<br>" +
            atrasados.map(p => "• " + escaparHTML(p.libroTitulo) + " — " + escaparHTML(p.prestamistaNombre)).join("<br>");
    }
    if (/(libro|book|cat[aá]logo|catalog)/i.test(pregunta)) {
        if (disponibles.length === 0) return trad.iaLocalNoEncontrado;
        return disponibles.slice(0, 5).map(l => "• " + escaparHTML(l.titulo) + " (" + l.disponibles + ")").join("<br>");
    }
    return trad.iaLocalGeneral;
}
