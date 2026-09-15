// =============================================
// ComeID Biblioteca - Firebase, base de datos y globales
// App independiente: comparte proyecto Firebase, auth
// y configuración (idioma/tema) con el comedor.
// =============================================

const firebaseConfig = {
    apiKey: "AIzaSyCP6Jjjn4H601ecoIw0oEVdI2gsqmnhYac",
    authDomain: "comeid-670b9.firebaseapp.com",
    projectId: "comeid-670b9",
    storageBucket: "comeid-670b9.firebasestorage.app",
    messagingSenderId: "908625018259",
    appId: "1:908625018259:web:401295fd3fb2ed06b67c66",
    measurementId: "G-0RWYEVYDRL"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

try {
    db.enablePersistence().catch(err => {
        if (err.code === "failed-precondition") {
            console.warn("Persistencia offline no disponible: hay más de una pestaña abierta.");
        } else if (err.code === "unimplemented") {
            console.warn("Este navegador no soporta la persistencia offline.");
        }
    });
} catch (e) {
    console.warn("Error al habilitar persistencia:", e);
}

// Datos globales
let libros = [];
let prestamos = [];
let estudiantes = [];
let profesores = [];
let bibliotecaEstudiantes = [];
let usuarioActual = null;
let vistaActual = "dashboard";
let libroEditando = null;
let listaPrestamistasActual = [];
let historialFiltro = "todos";
let historialFiltroLibro = "todos";
let actividad = [];
let notificaciones = [];
let reservas = [];

// Ajustes propios de la biblioteca (multas, etc.)
// Se sincronizan en Firestore (colección configuracion, doc biblioteca)
// con copia local en localStorage para funcionar sin conexión.
let ajustesBib = {
    multasActivas: false,
    montoMultaDiario: 0
};

const VERSION_BIBLIOTECA = "1.0.0";

// Configuración compartida con el comedor (idioma y tema)
let configuracion = {
    institucion: "CTP de Liberia",
    idioma: "Español",
    tema: "Oscuro"
};
try {
    const guardada = JSON.parse(localStorage.getItem("configuracionComeID") || "null");
    if (guardada) {
        if (guardada.idioma) configuracion.idioma = guardada.idioma;
        if (guardada.tema) configuracion.tema = guardada.tema;
        if (guardada.institucion) configuracion.institucion = guardada.institucion;
    }
} catch (e) {
    console.error("Error al leer configuración compartida:", e);
}

function guardarConfiguracionBib() {
    try {
        const actual = JSON.parse(localStorage.getItem("configuracionComeID") || "{}");
        actual.idioma = configuracion.idioma;
        actual.tema = configuracion.tema;
        actual.institucion = configuracion.institucion;
        localStorage.setItem("configuracionComeID", JSON.stringify(actual));
    } catch (e) {
        console.error("Error al guardar configuración:", e);
    }
}
