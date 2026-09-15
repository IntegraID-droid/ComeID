// =============================================
// ComeID - Configuración de Gemini (modo directo)
// Clave pública de la API. Se recomienda protegerla
// en Google Cloud Console restringida al dominio:
//   https://comeid-670b9.web.app
// También se puede configurar desde el panel de IA
// (se guarda en localStorage de este navegador).
// =============================================
const GEMINI_API_KEY_DIRECTO = "AQ.Ab8RN6IDY9JXseRI4CZSB1heYU7QNmfH_zE0GHk-Cf0cws5ppg";
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