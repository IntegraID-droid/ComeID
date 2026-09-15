// =============================================
// ComeID - Cloud Functions: IA real con Gemini
// La clave de Gemini se guarda en el servidor
// (secreto de Cloud Functions), nunca en el cliente.
// =============================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/v2/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Secreto de Cloud Functions: se configura con:
//   firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const MODELO_POR_DEFECTO = "gemini-2.0-flash";
const LIMITE_DIARIO_IA = 60;

const PROMPT_SISTEMA = (idioma) => [
    "Eres el asistente inteligente del comedor estudiantil de ComeID.",
    "Tu nombre es ComeID IA. Atiendes al encargado/administrador del comedor escolar.",
    "",
    "## Reglas fundamentales:",
    "- En análisis, predicciones y recomendaciones trabaja ÚNICAMENTE con los datos reales del CONTEXTO. Nunca inventes cifras, fechas ni estadísticas del comedor.",
    "- Si no hay datos suficientes para responder, dilo claramente y sugiere qué datos se necesitan.",
    "- Distingue siempre entre datos reales y estimaciones.",
    "- Responde en el idioma del usuario: " + idioma + ".",
    "- Sé conciso pero completo. Usa viñetas o listas cuando sea útil.",
    "- No reveles nombres ni datos personales de estudiantes; trabaja solo con datos agregados y estadísticas.",
    "- En el chat responde CUALQUIER pregunta del usuario, esté o no relacionada con el comedor. Si la pregunta puede responderse con los datos del CONTEXTO, úsalos; si no, respóndela igualmente de forma útil y amable con tu conocimiento general, sin inventar datos del comedor.",
    "",
    "## Capacidades:",
    "- Puedes responder preguntas sobre: asistencia de estudiantes, becados vs de pago, predicciones, tendencias, raciones a preparar, comparar días o periodos, patrones de asistencia, desperdicio de alimentos.",
    "- Puedes hacer análisis, predicciones, recomendaciones y resúmenes basados en los datos del CONTEXTO.",
    "- Si el usuario pregunta por un día, semana o periodo específico, busca los datos correspondientes en el CONTEXTO.",
    "- Si el usuario hace una comparación, calcula la diferencia porcentual cuando sea posible.",
    "",
    "## Formato de respuesta:",
    "- Usa negrita para números importantes.",
    "- Usa emojis con moderación para hacer la respuesta más amigable.",
    "- Si la respuesta es larga, organiza en secciones con títulos cortos."
].join("\n");

const INSTRUCCIONES = {
    analisis: [
        "Realiza un análisis completo y detallado del comedor con los datos reales del CONTEXTO.",
        "Estructura tu respuesta así:",
        "1. **Resumen general**: total de estudiantes (becados y de pago), total de registros de asistencia.",
        "2. **Asistencia promedio**: por jornada y por día de la semana.",
        "3. **Días destacados**: día con mayor y menor asistencia, con las cifras exactas.",
        "4. **Tendencia**: si la asistencia está subiendo, bajando o estable, con ejemplos numéricos.",
        "5. **Patrones**: qué días de la semana tienen más o menos asistencia.",
        "6. **Alertas**: si hay cambios importantes entre días consecutivos (más del 20%).",
        "Organiza la información en secciones claras para que el encargado tome decisiones."
    ].join("\n"),
    recomendaciones: [
        "Genera recomendaciones prácticas y accionables para el encargado del comedor usando SOLO el CONTEXTO.",
        "Incluye:",
        "- **Raciones**: cantidad recomendada a preparar para mañana, con el margen de seguridad.",
        "- **Días críticos**: qué días necesita más preparación y cuántos estudiantes esperar.",
        "- **Tendencia**: cómo ha cambiado la asistencia recientemente y qué implica.",
        "- **Alertas**: si hay patrones preocupantes (caídas fuertes, días con mucho desperdicio).",
        "- **Acciones sugeridas**: qué puede hacer el encargado para mejorar la gestión.",
        "Aclara que las cantidades son estimaciones basadas en el historial, no datos garantizados."
    ].join("\n"),
    prediccion: [
        "Estima cuántos estudiantes usarán el comedor en la próxima jornada usando el historial real del CONTEXTO.",
        "Incluye en tu respuesta:",
        "- **Estimación base**: número estimado de asistentes.",
        "- **Raciones sugeridas**: estimación más un margen prudente (basado en sobrantes históricos si hay datos).",
        "- **Confianza**: si hay suficientes datos históricos (más de 7 días), indica alta confianza; si no, indica baja.",
        "- **Factores**: si identificas algún patrón (ej: los viernes hay menos asistencia), menciónalo.",
        "Si no hay suficientes datos históricos (menos de 3 días), dilo claramente."
    ].join("\n"),
    resumenSemana: [
        "Genera un resumen claro y organizado de la última semana del comedor con los datos reales del CONTEXTO.",
        "Estructura así:",
        "- **Total de la semana**: cuántos estudiantes comieron en total.",
        "- **Promedio diario**: cuántos estudiantes por día en promedio.",
        "- **Mejor día**: cuál fue y cuántos estudiantes comieron.",
        "- **Peor día**: cuál fue y cuántos estudiantes comieron.",
        "- **Evolución**: cómo cambió la asistencia durante la semana (empezó bajo y subió, fue estable, etc.).",
        "- **Comparación con la semana anterior** si hay datos disponibles."
    ].join("\n")
};

exports.analizarComeID = onCall(
    {
        secrets: [GEMINI_API_KEY],
        timeoutSeconds: 90,
        memory: "256MiB",
        region: "us-central1"
    },
    async (request) => {
        // Solo usuarios autenticados de ComeID
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Debes iniciar sesión para usar la IA del comedor.");
        }

        // Solo el personal (admin/profesor/bibliotecario) usa la IA del comedor.
        try {
            const perfil = await admin.firestore().collection("usuarios").doc(request.auth.uid).get();
            const rol = perfil.exists ? String(perfil.get("rol") || "").toLowerCase() : "";
            if (!["admin", "profesor", "bibliotecario"].includes(rol)) {
                throw new HttpsError("permission-denied", "Solo el personal autorizado puede usar la IA del comedor.");
            }
        } catch (error) {
            if (error instanceof HttpsError) throw error;
            throw new HttpsError("permission-denied", "No tienes permisos para usar la IA del comedor.");
        }

        const datos = request.data || {};
        const tipo = datos.tipo || "chat";
        const idioma = datos.idioma || "Español";
        const contexto = datos.contexto || "{}";
        const pregunta = typeof datos.pregunta === "string" ? datos.pregunta.trim() : "";
        const historial = Array.isArray(datos.historial) ? datos.historial.slice(-10) : [];

        if (pregunta.length > 2000) {
            throw new HttpsError("invalid-argument", "La pregunta es demasiado larga.");
        }
        if (typeof contexto === "string" && contexto.length > 200000) {
            throw new HttpsError("invalid-argument", "El contexto de datos es demasiado grande.");
        }

        // Límite diario gratuito: se cuenta por usuario y por día en Firestore
        try {
            const hoy = new Date().toISOString().slice(0, 10);
            const uidLimpio = request.auth.uid.replace(/[^a-zA-Z0-9]/g, "");
            const refUso = admin.firestore().collection("ia_uso").doc(uidLimpio + "_" + hoy);
            const snapUso = await refUso.get();
            let usosHoy = snapUso.exists ? (snapUso.data().n || 0) : 0;
            if (usosHoy >= LIMITE_DIARIO_IA) {
                throw new HttpsError("resource-exhausted", "Se alcanzó el límite diario de consultas de IA.");
            }
            await refUso.set({ n: usosHoy + 1, actualizado: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        } catch (error) {
            if (error instanceof HttpsError) throw error;
            console.error("Error al verificar el límite diario: ", error);
            throw new HttpsError("internal", "Error al verificar el límite diario de IA.");
        }

        try {
            const generador = new GoogleGenerativeAI(await GEMINI_API_KEY.value());
            const modelo = generador.getGenerativeModel({
                model: process.env.GEMINI_MODEL || MODELO_POR_DEFECTO
            });

            const instruccion =
                tipo === "chat"
                    ? (pregunta
                        ? "Responde la pregunta del usuario de forma clara, útil y amable. Si la respuesta se puede fundamentar con los datos del CONTEXTO, úsalos como fuente; si la pregunta no está relacionada con el comedor, respóndela igualmente con tu conocimiento general, sin inventar datos del comedor.\nPREGUNTA: " + pregunta
                        : "Preséntate brevemente y explica qué puedes hacer con los datos del comedor. Menciona 3-4 ejemplos de preguntas que te pueden hacer.")
                    : (INSTRUCCIONES[tipo] || INSTRUCCIONES.analisis);

            const bloques = [
                PROMPT_SISTEMA(idioma),
                "CONTEXTO (datos reales de ComeID):",
                "```json",
                contexto,
                "```"
            ];

            if (historial.length > 0 && tipo === "chat") {
                bloques.push("HISTORIAL DE LA CONVERSACIÓN:");
                historial.forEach(m => {
                    bloques.push((m.rol === "usuario" ? "Encargado" : "ComeID IA") + ": " + m.texto);
                });
            }

            bloques.push("INSTRUCCIÓN:", instruccion);

            const prompt = bloques.join("\n\n");

            const resultado = await modelo.generateContent(prompt);
            const respuesta = (resultado.response && resultado.response.text()) || "";
            return { respuesta: respuesta };
        } catch (error) {
            console.error("Error al llamar a Gemini: ", error);
            throw new HttpsError("internal", "No fue posible generar la respuesta de la IA.");
        }
    }
);

// =============================================
// ComeID - Vincular cuenta de Google
// Cuando un usuario entra con Google, su UID es nuevo y no existe en
// "usuarios" (las cuentas gestoras se crearon con correo+contraseña).
// Esta función busca el perfil por el correo y lo copia al UID de Google,
// respetando el rol que ya tenía el usuario. Admin SDK evita depender de
// las reglas de Firestore (que no permiten que un estudiante consulte
// "usuarios" por correo).
// =============================================
exports.vincularCuentaGoogle = onCall(
    {
        region: "us-central1",
        memory: "256MiB"
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Debes iniciar sesión para vincular tu cuenta.");
        }

        const uid = request.auth.uid;
        // Se usa SOLO el correo verificado por Firebase del token de acceso.
        // Ignorar request.data.correo evita que un usuario reclame el perfil de
        // otra persona (escalada de privilegios) pasando un correo ajeno.
        const email = String(request.auth.token.email || "").trim().toLowerCase();
        if (!email) {
            throw new HttpsError("invalid-argument", "No se pudo obtener tu correo electrónico.");
        }

        const db = admin.firestore();
        const refPropia = db.collection("usuarios").doc(uid);

        // Ya hay un perfil para este UID (entrada anterior con Google).
        const docPropio = await refPropia.get();
        if (docPropio.exists) {
            return {
                vinculado: false,
                motivo: "perfil-existente",
                rol: docPropio.get("rol") || "estudiante"
            };
        }

        // Buscar el perfil creado con correo+contraseña con el correo verificado.
        let encontrado = null;
        try {
            const snap = await db.collection("usuarios")
                .where("correo", "==", email)
                .limit(2)
                .get();
            if (!snap.empty) {
                encontrado = snap.docs[0];
            }
        } catch (error) {
            console.error("Error al buscar el perfil por correo: ", error);
        }

        if (encontrado) {
            const datos = encontrado.data();
            await refPropia.set({
                rol: datos.rol || "estudiante",
                nombre: datos.nombre || "",
                correo: email,
                cedula: datos.cedula || "",
                estudiantesId: datos.estudiantesId || "",
                activo: datos.activo !== false,
                fechaRegistro: datos.fechaRegistro || admin.firestore.FieldValue.serverTimestamp(),
                vinculadoDe: encontrado.id,
                fechaVinculacion: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return {
                vinculado: true,
                motivo: "vinculado",
                rol: datos.rol || "estudiante"
            };
        }

        // Es un correo sin perfil en este proyecto: no se crea nada.
        return {
            vinculado: false,
            motivo: "sin-perfil",
            rol: "estudiante"
        };
    }
);

// =============================================
// ComeID - Enviar enlace de recuperación por SMTP
// Usa el correo del colegio (configuracion/servidorCorreo) para enviar el
// enlace de restablecimiento, en lugar del remitente genérico de Firebase.
// Es una llamada pública (sin auth) con límite anti-spam por correo/hora.
// Si no hay SMTP configurado se lanza "failed-precondition"; el cliente
// respalda con firebase.auth().sendPasswordResetEmail().
// =============================================
exports.enviarRecuperacionCorreo = onCall(
    {
        region: "us-central1",
        timeoutSeconds: 90,
        memory: "256MiB"
    },
    async (request) => {
        const correo = String((request.data && request.data.correo) || "").trim().toLowerCase();
        if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            throw new HttpsError("invalid-argument", "Correo electrónico inválido.");
        }
        const urlAccion = String((request.data && request.data.url) || "").trim() ||
            "https://comeid-670b9.web.app/login.html";
        const db = admin.firestore();

        // Límite anti-spam: máx. 3 solicitudes por correo cada hora.
        const refLimite = db.collection("envio_recuperacion").doc(correo);
        const snapLimite = await refLimite.get();
        const ahora = Date.now();
        let ventana = snapLimite.exists ? snapLimite.data() : null;
        if (!ventana || ahora - (ventana.inicio || 0) > 3600000) {
            ventana = { veces: 0, inicio: ahora };
        }
        if (ventana.veces >= 3) {
            throw new HttpsError("resource-exhausted", "Demasiados intentos. Espera una hora e inténtalo de nuevo.");
        }
        await refLimite.set({ veces: ventana.veces + 1, inicio: ventana.inicio }, { merge: true });

        const cfgSnap = await db.collection("configuracion").doc("servidorCorreo").get();
        const cfg = cfgSnap.exists ? cfgSnap.data() : {};
        if (!cfg.host || !cfg.usuario || !cfg.password) {
            throw new HttpsError("failed-precondition", "smtp-no-configurado");
        }

        try {
            const enlace = await admin.auth().generatePasswordResetLink(correo, {
                url: urlAccion,
                handleCodeInApp: false
            });
            const nodemailer = require("nodemailer");
            const puerto = Number(cfg.puerto) || 587;
            const transportador = nodemailer.createTransport({
                host: cfg.host,
                port: puerto,
                secure: puerto === 465,
                auth: { user: cfg.usuario, pass: cfg.password }
            });
            await transportador.sendMail({
                from: cfg.desde || cfg.usuario,
                to: correo,
                subject: "Recuperación de contraseña - ComeID",
                text: "Hola,\n\n" +
                    "Recibiste esta solicitud para restablecer tu contraseña de ComeID.\n\n" +
                    "Pulsa este enlace para crear una contraseña nueva:\n" +
                    enlace + "\n\n" +
                    "El enlace es de un solo uso y caduca pronto. Si no lo solicitaste, ignora este correo.\n\n" +
                    "ComeID - Comedor y Biblioteca"
            });
            return { enviado: true, via: "smtp" };
        } catch (error) {
            console.error("Error al enviar recuperación para " + correo + ": ", error);
            throw new HttpsError("internal", "No se pudo enviar el correo de recuperación.");
        }
    }
);
