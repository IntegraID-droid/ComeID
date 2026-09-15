// =============================================
// Portal Estudiantes - Autenticación
// Solo cuentas con rol "estudiante" pueden usar el portal.
// =============================================

function mensajeErrorPortal(error) {
    switch (error && error.code) {
        case "auth/invalid-email":
            return "Correo electrónico inválido.";
        case "auth/user-disabled":
            return "Esta cuenta ha sido deshabilitada.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
            return "Correo o contraseña incorrectos.";
        case "auth/too-many-requests":
            return "Demasiados intentos fallidos. Inténtalo más tarde.";
        case "auth/network-request-failed":
            return "Sin conexión a internet. Verifica tu conexión e inténtalo de nuevo.";
        default:
            return "Ocurrió un error. Inténtalo de nuevo.";
    }
}

function mostrarErrorLogin(mensaje) {
    const div = document.getElementById("loginError");
    if (!div) return;
    div.textContent = mensaje;
    div.style.display = "block";
}

function ocultarErrorLogin() {
    const div = document.getElementById("loginError");
    if (div) div.style.display = "none";
}

function mostrarLoading(b) {
    const el = document.getElementById("loading");
    if (el) el.style.display = b ? "flex" : "none";
    const btn = document.getElementById("btnIniciarSesion");
    if (btn) btn.disabled = b;
}

// El usuario autenticado debe tener rol "estudiante"
function verificarRolEstudiante(user) {
    return db.collection("usuarios").doc(user.uid).get().then(doc => {
        const rol = doc.exists ? String(doc.data().rol || "").toLowerCase() : "";
        if (rol !== "estudiante") {
            return firebase.auth().signOut().then(() => {
                throw { code: "no-estudiante" };
            });
        }
        return doc.data();
    });
}

function iniciarSesionPortal() {
    ocultarErrorLogin();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const recordarme = document.getElementById("recordarme").checked;

    if (!email || !password) {
        mostrarErrorLogin("Ingresa tu correo y tu contraseña.");
        return;
    }

    mostrarLoading(true);
    const persistencia = recordarme
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;

    firebase.auth().setPersistence(persistencia)
        .then(() => firebase.auth().signInWithEmailAndPassword(email, password))
        .then(result => verificarRolEstudiante(result.user))
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(error => {
            mostrarLoading(false);
            if (error && error.code === "no-estudiante") {
                mostrarErrorLogin("Esta cuenta no tiene perfil de estudiante. Usa el sistema administrativo de Integra ID.");
            } else {
                mostrarErrorLogin(mensajeErrorPortal(error));
            }
        });
}

// Recuperación de contraseña (enlace por correo)
function recuperarContraseña() {
    ocultarErrorLogin();
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
        mostrarErrorLogin("Escribe primero tu correo electrónico para recuperar la contraseña.");
        return;
    }
    mostrarLoading(true);
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            mostrarLoading(false);
            const div = document.getElementById("loginError");
            if (div) {
                div.style.borderColor = "#28a745";
                div.style.color = "#7fe08a";
                div.style.background = "rgba(40,167,69,0.14)";
                div.textContent = "Si el correo existe, te enviamos un enlace para restablecer tu contraseña.";
                div.style.display = "block";
            }
        })
        .catch(error => {
            mostrarLoading(false);
            mostrarErrorLogin(mensajeErrorPortal(error));
        });
}

function cerrarSesionPortal() {
    firebase.auth().signOut()
        .then(() => { window.location.href = "index.html"; })
        .catch(() => { window.location.href = "index.html"; });
}
