// =============================================
// Portal Estudiantes - Registro y auto-vinculación
// El estudiante crea su propia cuenta con cédula +
// nombre y se vincula automáticamente a su registro
// en la colección "estudiantes" del sistema integrado.
// =============================================

function normalizarNombre(n) {
    return String(n || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function mostrarErrorReg(mensaje) {
    const div = document.getElementById("registroError");
    if (!div) return;
    div.style.borderColor = "";
    div.style.color = "";
    div.style.background = "";
    div.textContent = mensaje;
    div.style.display = "block";
}

function ocultarErrorReg() {
    const div = document.getElementById("registroError");
    if (div) div.style.display = "none";
}

function mostrarLoadingReg(b) {
    const el = document.getElementById("loading");
    if (el) el.style.display = b ? "flex" : "none";
    const btn = document.getElementById("btnRegistrar");
    if (btn) btn.disabled = b;
}

function limpiarCuentaRegistrada() {
    const user = firebase.auth().currentUser;
    if (!user) return Promise.resolve();
    const uid = user.uid;
    return db.collection("usuarios").doc(uid).delete().catch(() => {})
        .then(() => user.delete())
        .then(() => firebase.auth().signOut())
        .catch(() => firebase.auth().signOut());
}

function registrarEstudiante() {
    ocultarErrorReg();
    const cedula = document.getElementById("regCedula").value.trim();
    const nombre = document.getElementById("regNombre").value.trim();
    const correo = document.getElementById("regCorreo").value.trim();
    const clave = document.getElementById("regClave").value;
    const confirmar = document.getElementById("regClave2").value;

    if (!cedula || !nombre || !correo || !clave || !confirmar) {
        mostrarErrorReg("Completa todos los campos.");
        return;
    }
    if (!/^\d{9}$/.test(cedula)) {
        mostrarErrorReg("La cédula debe tener exactamente 9 dígitos (sin guiones ni espacios).");
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarErrorReg("El correo electrónico no es válido.");
        return;
    }
    if (clave.length < 6) {
        mostrarErrorReg("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    if (clave !== confirmar) {
        mostrarErrorReg("Las contraseñas no coinciden.");
        return;
    }

    mostrarLoadingReg(true);
    window.registroEnProceso = true;

    firebase.auth().createUserWithEmailAndPassword(correo, clave)
        .then(credencial => {
            const uid = credencial.user.uid;
            // 1) Crea el perfil del portal (permite que las reglas vinculen por cédula)
            return db.collection("usuarios").doc(uid).set({
                rol: "estudiante",
                nombre,
                correo,
                cedula,
                estudiantesId: ""
            }).then(() => {
                // 2) Busca su registro en "estudiantes" por cédula
                return db.collection("estudiantes").where("cedula", "==", cedula).limit(5).get();
            }).then(qs => {
                const candidatos = [];
                qs.forEach(d => candidatos.push(Object.assign({ id: d.id }, d.data())));
                const norm = normalizarNombre(nombre);
                const match = candidatos.find(d =>
                    normalizarNombre(d.nombre) === norm && (!d.uid || d.uid === uid)
                );
                if (!match) {
                    const ocupada = candidatos.some(d => normalizarNombre(d.nombre) === norm && d.uid && d.uid !== uid);
                    const e = new Error(ocupada ? "cédula ya vinculada" : "registro no encontrado");
                    e.code = ocupada ? "ya-vinculada" : "no-encontrado";
                    throw e;
                }
                return match;
            }).then(match => {
                // 3) Valida el correo antes de vincular: si el registro ya tiene
                // un correo asignado, la cuenta debe coincidir; si no, exige el
                // correo institucional para evitar que terceros reclamen el registro.
                const correoRegistrado = String(match.correo || "").trim().toLowerCase();
                const correoIngresado = String(correo).trim().toLowerCase();
                if (correoRegistrado && correoRegistrado !== correoIngresado) {
                    const e = new Error("correo ya asignado");
                    e.code = "correo-distinto";
                    throw e;
                }
                if (!correoRegistrado && !/@ctpliberia\.ed\.cr$/i.test(correoIngresado)) {
                    const e = new Error("se requiere correo institucional");
                    e.code = "correo-institucional";
                    throw e;
                }
                // 4) Vincula la cuenta al registro del estudiante
                return db.collection("estudiantes").doc(match.id).update({
                    uid,
                    correo
                }).then(() => db.collection("usuarios").doc(uid).update({
                    estudiantesId: match.id
                }));
            });
        })
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(error => {
            limpiarCuentaRegistrada().finally(() => {
                mostrarLoadingReg(false);
                let mensaje;
                switch (error && error.code) {
                    case "no-encontrado":
                        mensaje = "No encontramos tu registro en el sistema del CTP de Liberia. Verifica tu cédula y tu nombre tal como están registrados, o pide ayuda a la administración.";
                        break;
                    case "ya-vinculada":
                        mensaje = "Esa cédula ya está vinculada a otra cuenta. Contacta a la administración del CTP de Liberia.";
                        break;
                    case "correo-distinto":
                        mensaje = "Esa cédula ya está vinculada a un correo. Usa ese mismo correo para crear tu cuenta.";
                        break;
                    case "correo-institucional":
                        mensaje = "Para crear tu cuenta usa tu correo institucional @ctpliberia.ed.cr.";
                        break;
                    case "auth/email-already-in-use":
                        mensaje = "Ese correo ya tiene una cuenta. Inicia sesión o usa la opción de recuperar contraseña.";
                        break;
                    case "auth/weak-password":
                        mensaje = "La contraseña es muy débil (mínimo 6 caracteres).";
                        break;
                    case "auth/invalid-email":
                        mensaje = "El correo electrónico no es válido.";
                        break;
                    case "auth/network-request-failed":
                        mensaje = "Sin conexión a internet. Verifica tu conexión e inténtalo de nuevo.";
                        break;
                    default:
                        mensaje = "Ocurrió un error. Inténtalo de nuevo.";
                }
                mostrarErrorReg(mensaje);
            });
        });
}
