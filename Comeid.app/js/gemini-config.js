// =============================================
// ComeID - Configuración de Gemini (modo directo)
// SEGURIDAD: las claves de API NUNCA se escriben en el código fuente.
// Esta constante queda vacía a propósito; la clave activa se configura
// desde el panel de IA de cada navegador (se guarda en localStorage) o,
// de forma recomendada, se llama a Gemini desde el servidor
// (Cloud Function "analizarComeID" con secrets de Cloud Functions).
// =============================================
const GEMINI_API_KEY_DIRECTO = "";
const GEMINI_MODELO_DIRECTO = "gemini-flash-latest";

const GEMINI_CLAVE_LOCALSTORAGE = "comeID_claveGemini";

// Clave activa: la configurada en este navegador (localStorage) y, si no
// hay ninguna, la que esté escrita en GEMINI_API_KEY_DIRECTO.
function obtenerClaveGemini() {
    try {
        const guardada = localStorage.getItem(GEMINI_CLAVE_LOCALSTORAGE);
        if (guardada && guardada.length > 10) return guardada;
    } catch (e) { console.error("Error al leer clave Gemini: ", e); }
    return typeof GEMINI_API_KEY_DIRECTO === "string" ? GEMINI_API_KEY_DIRECTO : "";
}

// Guarda la clave de Gemini en localStorage (sobrescribe o limpia).
function guardarClaveGemini(clave) {
    const c = String(clave || "").trim();
    let ok = false;
    try {
        if (c.length > 10) {
            localStorage.setItem(GEMINI_CLAVE_LOCALSTORAGE, c);
            ok = true;
        } else {
            localStorage.removeItem(GEMINI_CLAVE_LOCALSTORAGE);
        }
    } catch (e) { console.error("Error al guardar clave Gemini: ", e); }
    return ok;
}

// Quita la clave configurada en este navegador.
function quitarClaveGemini() {
    try { localStorage.removeItem(GEMINI_CLAVE_LOCALSTORAGE); }
    catch (e) { console.error("Error al quitar clave Gemini: ", e); }
}