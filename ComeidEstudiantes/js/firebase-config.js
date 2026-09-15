// =============================================
// Portal Estudiantes - Configuración de Firebase
// Comparte el mismo proyecto Firebase que el sistema administrativo Integra ID (comedor y biblioteca).
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

// Persistencia offline: las lecturas se guardan localmente (IndexedDB) y se
// sincronizan automáticamente, para que el portal responda rápido aunque la
// conexión sea lenta. Mismo comportamiento que el panel administrativo.
db.enablePersistence().catch(err => {
    if (err.code === "failed-precondition") {
        console.warn("Persistencia offline no disponible: hay más de una pestaña abierta con el portal.");
    } else if (err.code === "unimplemented") {
        console.warn("Este navegador no soporta la persistencia offline.");
    } else {
        console.error("Error al habilitar persistencia offline: ", err);
    }
});

// Datos compartidos del portal
const App = {
    uid: null,
    usuario: null,      // documento usuarios/{uid}
    estudiante: null,   // documento estudiantes/{estudiantesId}
    configuracion: null // configuracion/comedor + /menu
};

// Índices de colores para las notificaciones
const NOTIF_COLORS = {
    biblioteca: "#2b67ff",
    comedor: "#10b981",
    sistema: "#f59e0b",
    generico: "#8b5cf6"
};
