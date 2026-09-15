// =============================================
// Portal Estudiantes - Notificaciones
// =============================================

function iconoNotificacion(tipo) {
    const t = String(tipo || "generico").toLowerCase();
    const iconos = {
        biblioteca: "fa-book-open",
        comedor: "fa-utensils",
        sistema: "fa-circle-info",
        generico: "fa-bell"
    };
    return iconos[t] || "fa-bell";
}

function renderNotificaciones(lista) {
    const c = document.getElementById("contenido");
    const ordenadas = lista.slice().sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));

    c.innerHTML = `
        <div class="page-title">Notificaciones</div>
        <p class="page-subtitle">Avisos de la biblioteca, el comedor y el sistema.</p>
        ${lista.some(n => !n.leida) ? `
        <button class="btn btn-ghost btn-sm" style="margin-bottom:14px;" onclick="marcarTodasLeidas()">
            <i class="fa-solid fa-check-double"></i> Marcar todas como leídas
        </button>` : ""}

        ${ordenadas.length === 0
            ? `<div class="card empty"><i class="fa-solid fa-bell"></i> No tienes notificaciones.</div>`
            : ordenadas.map(n => {
                const color = NOTIF_COLORS[String(n.tipo || "generico").toLowerCase()] || NOTIF_COLORS.generico;
                const titulo = n.titulo || (String(n.tipo || "sistema")[0].toUpperCase() + String(n.tipo || "sistema").slice(1));
                return `
                <div class="notif-item ${n.leida ? "" : "unread"}" data-id="${escaparHTML(n.id)}">
                    <div class="notif-ico" style="background:${color};"><i class="fa-solid ${iconoNotificacion(n.tipo)}"></i></div>
                    <div class="notif-body">
                        <div class="notif-title">${escaparHTML(titulo)}</div>
                        <div class="notif-msg">${escaparHTML(n.mensaje || "")}</div>
                        <div class="notif-date"><i class="fa-solid fa-clock"></i> ${fechaHoraLegible(n.fecha)}</div>
                    </div>
                </div>`;
            }).join("")}
    `;
    c.querySelectorAll(".notif-item").forEach(item => {
        item.addEventListener("click", () => marcarLeida(item.dataset.id, item));
    });
}

function cargarNotificacionesPropias() {
    const paras = [App.uid, App.estudiante.id, "todos"];
    return db.collection("notificaciones").where("para", "in", paras).get()
        .then(qs => {
            const lista = [];
            qs.forEach(d => lista.push(Object.assign({ id: d.id }, d.data())));
            App.notificaciones = lista;
            return lista;
        })
        .catch(() => { App.notificaciones = []; return []; });
}

function marcarLeida(id, el) {
    const n = App.notificaciones.find(x => x.id === id);
    if (!n || n.leida) return;
    db.collection("notificaciones").doc(id).update({ leida: true })
        .then(() => {
            n.leida = true;
            if (el) el.classList.remove("unread");
            cargarContadorNoLeidas();
        })
        .catch(() => {});
}

function marcarTodasLeidas() {
    const pendientes = App.notificaciones.filter(n => !n.leida);
    const ops = pendientes.map(n => db.collection("notificaciones").doc(n.id).update({ leida: true }));
    Promise.all(ops)
        .then(() => {
            pendientes.forEach(n => { n.leida = true; });
            renderNotificaciones(App.notificaciones);
            cargarContadorNoLeidas();
            toast("Notificaciones marcadas como leídas");
        })
        .catch(() => toast("No se pudieron marcar las notificaciones", "error"));
}

const PAGE = {
    init: function () {
        mostrarCargando();
        cargarNotificacionesPropias().then(renderNotificaciones).catch(() => renderNotificaciones([]));
    }
};

iniciarApp(PAGE.init);
