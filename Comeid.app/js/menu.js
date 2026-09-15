// =============================================
// ComeID - Menú del comedor (plan semanal)
// Fuente de verdad: Firestore "configuracion/menu".
// Copia local: localStorage "menuComeID" (sin conexión).
// =============================================

let menuComeID = [];

// Días con servicio: Lunes (1) a Viernes (5). (0=Domingo, 6=Sábado quedan fuera)
const DIAS_MENU = [1, 2, 3, 4, 5];

function cargarMenuComeID() {
    let cargados = [];
    const guardado = localStorage.getItem("menuComeID");
    if (guardado) {
        try {
            const parseado = JSON.parse(guardado);
            if (Array.isArray(parseado)) cargados = parseado;
        } catch (e) { cargados = []; }
    }
    const porDia = {};
    cargados.forEach(d => {
        if (d && DIAS_MENU.indexOf(Number(d.dia)) !== -1) {
            porDia[d.dia] = { dia: Number(d.dia), desayuno: d.desayuno || "", almuerzo: d.almuerzo || "" };
        }
    });
    menuComeID = DIAS_MENU.map(dia => porDia[dia] || { dia: dia, desayuno: "", almuerzo: "" });
}

function nombresDiasMenu() {
    const trad = traducciones[configuracion.idioma];
    return [
        trad.menuDiaLunes || "Lunes",
        trad.menuDiaMartes || "Martes",
        trad.menuDiaMiercoles || "Miércoles",
        trad.menuDiaJueves || "Jueves",
        trad.menuDiaViernes || "Viernes"
    ];
}

// Carga el menú desde Firestore (configuracion/menu). Si existe,
// es la fuente de verdad y se cachea en localStorage.
function cargarMenuFirestore() {
    return db.collection("configuracion").doc("menu").get().then(doc => {
        if (doc.exists && Array.isArray(doc.data().plan) && doc.data().plan.length > 0) {
            const porDia = {};
            doc.data().plan.forEach(d => {
                if (d && DIAS_MENU.indexOf(Number(d.dia)) !== -1) {
                    porDia[d.dia] = Object.assign({ desayuno: "", almuerzo: "" }, d, { dia: Number(d.dia) });
                }
            });
            menuComeID = DIAS_MENU.map(dia => porDia[dia] || { dia: dia, desayuno: "", almuerzo: "" });
            localStorage.setItem("menuComeID", JSON.stringify(menuComeID));
        }
    }).catch(error => {
        console.warn("No se pudo cargar el menú desde Firestore:", error.message);
    });
}

// Muestra el plan semanal; solo gestores pueden editar
function mostrarMenu() {
    vistaActual = "menu";
    const trad = traducciones[configuracion.idioma];
    const gestion = usuarioActual && usuarioActual.rol && (usuarioActual.rol.toLowerCase() === "admin" || usuarioActual.rol.toLowerCase() === "profesor");
    cargarMenuComeID();
    renderMenu();
    // Fuente de verdad: Firestore (el portal ComeID Estudiantes lo lee de aquí)
    cargarMenuFirestore().then(() => {
        if (vistaActual === "menu") renderMenu();
    });
}

function renderMenu() {
    const trad = traducciones[configuracion.idioma];
    const gestion = usuarioActual && usuarioActual.rol && (usuarioActual.rol.toLowerCase() === "admin" || usuarioActual.rol.toLowerCase() === "profesor");
    const hoy = new Date().getDay();
    const nombres = nombresDiasMenu();
    const readonly = gestion ? "" : "disabled";

    document.getElementById("contenido").innerHTML = `
        <h1 class="title">${trad.menuPlanTitle}</h1>
        <p style="color: var(--text-secondary); margin-top: 4px;">${trad.menuPlanSubtitle}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 18px;">
            ${menuComeID.map((d, i) => `
                <div class="panel" style="padding: 16px; ${d.dia === hoy ? "border: 2px solid var(--accent-color);" : ""}">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h2 style="color: var(--accent-color); font-size:16px;">${nombres[i]}</h2>
                        ${d.dia === hoy ? `<span style="background:#28a745; color:#fff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px;">${trad.menuHoy || "Hoy"}</span>` : ""}
                    </div>
                    <label style="color: var(--text-secondary); font-weight:600; font-size:13px;">${trad.menuDesayuno}</label>
                    <input type="text" id="menuDesayuno_${d.dia}" class="config-input" value="${escaparHTML(d.desayuno || "")}" ${readonly} style="margin-bottom:10px;">
                    <label style="color: var(--text-secondary); font-weight:600; font-size:13px;">${trad.menuAlmuerzo}</label>
                    <input type="text" id="menuAlmuerzo_${d.dia}" class="config-input" value="${escaparHTML(d.almuerzo || "")}" ${readonly}>
                </div>
            `).join("")}
        </div>
        ${gestion ? `<div style="text-align:center; margin-top:18px;">
            <button class="save-config-btn" onclick="guardarMenuComeID()" style="background: var(--accent-color);">
                <i class="fas fa-save"></i> ${trad.menuGuardar}
            </button>
        </div>` : ""}
    `;
}

// Guarda el plan semanal: en localStorage (copia local) y en
// Firestore (configuracion/menu), que consume el portal ComeID Estudiantes.
function guardarMenuComeID() {
    const trad = traducciones[configuracion.idioma];
    menuComeID.forEach(d => {
        const desayuno = document.getElementById("menuDesayuno_" + d.dia);
        const almuerzo = document.getElementById("menuAlmuerzo_" + d.dia);
        if (desayuno) d.desayuno = desayuno.value.trim();
        if (almuerzo) d.almuerzo = almuerzo.value.trim();
    });
    localStorage.setItem("menuComeID", JSON.stringify(menuComeID));
    db.collection("configuracion").doc("menu").set({
        plan: menuComeID,
        actualizado: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        mostrarNotificacion(trad.menuGuardado || "Menú guardado");
    }).catch(error => {
        mostrarNotificacion((trad.menuGuardado || "Menú guardado") + " (sin conexión)", "error");
        console.warn("No se pudo guardar el menú en Firestore:", error.message);
    });
}
