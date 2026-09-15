// =============================================
// ComeID Biblioteca - Ayuda (guía rápida)
// =============================================

function mostrarAyudaBib() {
    const trad = traducciones[configuracion.idioma] || traducciones.Español;
    document.getElementById("ayudaTitulo").textContent = trad.ayudaTitle || "Ayuda";
    document.getElementById("ayudaSubtitle").textContent = trad.ayudaSubtitle || "";
    document.getElementById("ayudaEntendidoBtn").textContent = trad.ayudaEntendido || "Entendido";

    const pasos = [
        [trad.ayudaPaso1Titulo, trad.ayudaPaso1Texto, "fas fa-book-open"],
        [trad.ayudaPaso2Titulo, trad.ayudaPaso2Texto, "fas fa-chart-pie"],
        [trad.ayudaPaso3Titulo, trad.ayudaPaso3Texto, "fas fa-book"],
        [trad.ayudaPaso4Titulo, trad.ayudaPaso4Texto, "fas fa-hand-holding"],
        [trad.ayudaPaso5Titulo, trad.ayudaPaso5Texto, "fas fa-bookmark"],
        [trad.ayudaPaso6Titulo, trad.ayudaPaso6Texto, "fas fa-bell"],
        [trad.ayudaPaso7Titulo, trad.ayudaPaso7Texto, "fas fa-file-alt"],
        [trad.ayudaPaso8Titulo, trad.ayudaPaso8Texto, "fas fa-robot"]
    ];

    document.getElementById("ayudaContenido").innerHTML = pasos.map((paso, i) => `
        <div style="display:flex; gap:14px; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--border-color);">
            <div style="flex-shrink:0; width:38px; height:38px; border-radius:10px; background: var(--bg-tertiary); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; color:var(--accent-color);">
                <i class="${paso[2]}"></i>
            </div>
            <div>
                <h3 style="color: var(--text-primary); font-size: 15px; margin-bottom: 4px;">${i + 1}. ${escaparHTML(paso[0])}</h3>
                <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">${escaparHTML(paso[1])}</p>
            </div>
        </div>
    `).join("");

    document.getElementById("modalAyudaBib").classList.add("show");
}

function cerrarAyudaBib() {
    document.getElementById("modalAyudaBib").classList.remove("show");
}
