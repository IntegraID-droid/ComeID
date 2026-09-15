// =============================================
// ComeID - Firebase, base de datos y variables globales
// =============================================


        // =============================================
        // CONFIGURACIÓN Y VARIABLES GLOBALES
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

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        // Persistencia offline: los registros se guardan localmente (IndexedDB) y
        // se sincronizan automáticamente cuando vuelve el internet
        db.enablePersistence().catch(err => {
            if (err.code === "failed-precondition") {
                console.warn("Persistencia offline no disponible: hay más de una pestaña abierta con ComeID.");
            } else if (err.code === "unimplemented") {
                console.warn("Este navegador no soporta la persistencia offline.");
            } else {
                console.error("Error al habilitar persistencia offline: ", err);
            }
        });

        // Datos globales
        let estudiantes = [];
        let codeReader = null;
        let zxingControls = null;
        let tokenScanner = 0; // para ignorar respuestas de cámaras ya detenidas
        let ultimoCodigo = "";
        let ultimoTiempo = 0;
        let estudianteSeleccionadoHistorial = null;
        let registrosPendientes = Number(localStorage.getItem("registrosPendientes") || 0);
        let estadoConexionAnterior = null;
        let fotoTemp = "";
        let configuracion = {
            institucion: "CTP de Liberia",
            comedor: "Comedor Institucional",
            idioma: "Español",
            tema: "Oscuro",
            apertura: "10:00",
            cierre: "13:00",
            precio: 1000,
            version: "1.12.0"
        };
        let indiceEditar = -1;
        let usuarioActual = null;
        let usuarios = [];
        let rolesModificados = {};
        let vistaActual = "dashboard";
