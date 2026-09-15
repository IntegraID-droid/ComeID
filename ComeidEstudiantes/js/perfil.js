// =============================================
// Portal Estudiantes - Mi información (solo lectura)
// =============================================

function renderPerfil() {
    const est = App.estudiante;
    const c = document.getElementById("contenido");

    const filas = [
        { i: "fa-solid fa-user", label: "Nombre completo", valor: est.nombre },
        { i: "fa-solid fa-id-card", label: "Cédula", valor: est.cedula },
        { i: "fa-solid fa-envelope", label: "Correo", valor: App.usuario.correo || "—" },
        { i: "fa-solid fa-school", label: "Colegio", valor: "CTP de Liberia" },
        { i: "fa-solid fa-layer-group", label: "Sección", valor: est.seccion || "—" },
        { i: "fa-solid fa-graduation-cap", label: "Nivel", valor: est.nivel || "—" },
        { i: "fa-solid fa-suitcase", label: "Especialidad", valor: est.especialidad || "—" },
        { i: "fa-solid fa-circle-check", label: "Estado", valor: estadoBecario() }
    ];

    c.innerHTML = `
        <div class="page-title">Mi información</div>
        <p class="page-subtitle">Estos son los datos que la institución tiene registrados. Son de solo consulta.</p>

        <div class="card">
            ${filas.map(f => `
                <div class="stat-line">
                    <span class="label"><i class="${f.i}"></i> ${f.label}</span>
                    <span class="value">${escaparHTML(f.valor)}</span>
                </div>`).join("")}
        </div>

        <div class="section-title"><i class="fa-solid fa-shield-halved"></i> Seguridad</div>
        <div class="card" style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
            Solo tú puedes ver esta información. Si algún dato es incorrecto, solicita la corrección
            en la administración del CTP de Liberia.
        </div>
    `;
}

const PAGE = {
    init: renderPerfil
};

iniciarApp(PAGE.init);
