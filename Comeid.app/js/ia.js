// =============================================
// ComeID - Inteligencia Artificial del Comedor
// Análisis, predicción, recomendaciones y chat
// =============================================

        // Palabras clave por intención según el idioma seleccionado
        const IA_PATRONES = {
            Español: {
                saludo: ["hola", "buenas", "saludos", "hey", "que tal", "buenos dias", "buenas tardes", "buenas noches", "que onda", "que hay", "buen dia", "holi", "buenas profesor", "buenas profe"],
                gracias: ["gracias", "genial", "perfecto", "excelente", "muchas gracias", "te agradezco", "maravilloso", "mil gracias", "gracias por tu ayuda", "gracias por la info", "muy amable"],
                ayuda: ["ayuda", "que puedes hacer", "que puedes", "ayudarme", "ayudar", "como funciona", "que sabes hacer", "para que sirves", "que sabes", "que informacion tienes", "que preguntas puedo hacer", "dame ejemplos", "que puedo preguntar", "como te pregunto", "de que datos dispones", "que temas entiendes"],
                semana: ["semana", "cuantos comieron", "cuantas comieron", "comieron hoy", "esta semana", "cuantos estudiantes comieron", "la semana", "de la semana", "pasada semana", "semana pasada", "cuantos vinieron esta semana", "cuantos asistieron esta semana", "asistencia de la semana", "total de la semana", "cuantos hubo esta semana", "cuantos comieron en la semana", "la semana pasada"],
                raciones: ["raciones", "cuanta comida", "cuanto preparar", "preparar", "alimentos", "cuantas raciones", "que cantidad", "cuanto debo preparar", "cuanto cocinar", "comida para", "platos", "porciones", "cuantas porciones", "cuantos almuerzos", "cuanta comida preparar", "cuanto hay que preparar", "cuantas bandejas", "cuanto cocinar manana", "cuantas raciones preparar manana"],
                becados: ["becados", "becados comieron", "cuantos becados", "becados hoy", "de beca", "beca", "cuantos estudiantes son becados", "cuantos becados hay", "cuantos de beca", "cuantos reciben beca", "cuantos no pagan", "cuantos son becados", "cuantos becados estudian"],
                pagan: ["pagan", "de pago", "cuantos pagan", "pagan hoy", "pago", "pagando", "que pagan", "cuantos estudiantes pagan", "cuantos son de pago", "cuantos de pago hay", "cuantos pagaron", "cuantos son de pago hoy"],
                mayor: ["mayor asistencia", "mas asistencia", "dia con mas", "dia con mas asistencia", "mejor dia", "mas concurrido", "dia pico", "pico", "récord", "record", "mayor cantidad", "dia con mas gente", "cuando hubo mas asistencia", "en que dia hubo mas", "cual dia tuvo mas", "dia con mas estudiantes", "maxima asistencia", "record de asistencia", "el dia que mas vinieron", "cuando viene mas gente"],
                menor: ["menor asistencia", "menos asistencia", "dia con menos", "dia con menos asistencia", "peor dia", "menos concurrido", "dia bajo", "menor cantidad", "dia con menos gente", "cuando hubo menos asistencia", "en que dia hubo menos", "cual dia tuvo menos", "dia con menos estudiantes", "minima asistencia", "el dia que menos vinieron"],
                promedio: ["promedio", "media de asistencia", "cuantos estudiantes por dia", "promedio diario", "por dia", "al dia", "diariamente", "cual es el promedio", "promedio de asistencia", "cuantos asisten en promedio", "media", "cuantos en promedio vienen", "cuantos estudiantes vienen por dia"],
                tendencia: ["cambiado", "cambio", "tendencia", "evolucion", "aumentado", "disminuido", "como ha sido", "ha aumentado", "ha disminuido", "esta subiendo", "esta bajando", "mejorando", "empeorando", "subio o bajo", "esta aumentando", "esta disminuyendo", "como esta la asistencia", "ha subido la asistencia", "ha bajado la asistencia", "evolucion de la asistencia", "que tendencia hay", "esta en crecimiento o caida"],
                patrones: ["patrones", "patron", "encuentras", "detectaste", "patrones encontraste", "que dias", "que dia", "que dias hay", "que dia es", "que dias hay mas gente", "en que dias hay mas", "que encontraste en los datos", "cuales son los patrones", "cuando hay picos", "que dias es mas concurrido"],
                comparar: ["comparar", "compara", "diferencia", "diferencias", "versus", "vs", "mas que", "menos que", "igual que", "compara dos dias", "compara hoy con ayer", "diferencia entre hoy y ayer", "compara esta semana con la anterior"],
                porcentaje: ["porcentaje", "por ciento", "que porcentaje", "cuanto es el", "tasa", "proporcion", "que porcentaje de estudiantes", "cuantos por ciento", "porcentaje de asistencia", "tasa de asistencia", "cuanto porcentaje asiste", "que porcentaje son"],
                nivel: ["nivel", "por nivel", "cuantos por nivel", "que nivel", "niveles", "septimo", "octavo", "noveno", "decimo", "undecimo", "duodecimo", "de septimo", "de octavo", "de noveno", "de decimo", "de undecimo", "de duodecimo", "cuantos de septimo", "cuantos de octavo", "cuantos de noveno", "cuantos de decimo", "cuantos de undecimo", "cuantos de duodecimo", "distribucion por nivel", "por seccion", "cuantos por seccion"],
                hoy: ["hoy", "el dia de hoy", "en el dia de hoy", "asistencia de hoy", "cuantos comieron hoy", "cuantos vinieron hoy", "cuantos asistieron hoy", "cuantos estudiantes vinieron hoy", "cuantos hubo hoy", "cuantos estuvieron hoy", "cuantos usaron el comedor hoy"],
                ayer: ["ayer", "el dia de ayer", "asistencia de ayer", "cuantos comieron ayer", "cuantos vinieron ayer", "cuantos asistieron ayer", "cuantos estudiantes vinieron ayer", "cuantos hubo ayer"],
                manana: ["mañana", "que va a pasar mañana", "para mañana", "proximo dia", "próximo día", "cuantos van a venir mañana", "cuantos se esperan mañana", "asistencia mañana", "que se espera mañana", "cuantos llegaran mañana", "cuantos vendran manana"],
                semana_prox: ["próxima semana", "proxima semana", "la semana que viene", "semana entrante", "cuantos la proxima semana", "proyeccion de la semana", "semana siguiente"],
                comparar_semanas: ["comparar semanas", "esta semana vs", "semana pasada vs", "diferencia entre semanas", "compara esta semana con la pasada", "diferencia de semanas", "cual semana tuvo mas", "cual semana tuvo menos"],
                desperdicio: ["desperdicio", "sobrantes", "cuanto se tira", "comida tirada", "desechado", "sobra", "desperdiciar", "cuanta comida sobra", "cuanta comida se desperdicia", "cuanto sobra", "cuanto se bota", "sobras de comida", "desperdicio de comida", "cuanto se tira a la basura", "cuanta sobra"],
                precios: ["precio", "precios", "costo", "costos", "cuanto cuesta", "ganancia", "ingreso", "dinero", "colones", "cuanto dinero se recibe", "cuanto se gana", "ganancias del comedor", "ingreso del comedor", "valor de las raciones", "cuanto genera", "cuanto pagan en total"],
                estudiantes_total: ["total de estudiantes", "cuantos estudiantes hay", "total estudiantes", "cuantos hay en total", "cantidad de estudiantes", "cuantos estudiantes hay registrados", "cuantos hay inscritos", "cuantos matriculados", "cuantos alumnos hay", "cuantos estudiantes tiene el comedor"]
            },
            English: {
                saludo: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "what's up"],
                gracias: ["thanks", "thank you", "great", "perfect", "excellent", "awesome", "appreciate"],
                ayuda: ["help", "can you", "what can you do", "how does it work", "what do you know", "what are your capabilities"],
                semana: ["week", "this week", "how many ate", "ate today", "how many students ate", "last week", "past week"],
                raciones: ["servings", "rations", "how much food", "prepare", "meals", "how many servings", "how much", "how many dishes", "how to cook"],
                becados: ["scholarship", "scholarship students", "how many scholarship", "scholarship today", "free meals"],
                pagan: ["paying", "paid", "how many paying", "paying today", "pay", "payment"],
                mayor: ["highest attendance", "most attendance", "day with the most", "best day", "most students", "peak day", "peak", "record"],
                menor: ["lowest attendance", "least attendance", "day with the least", "worst day", "fewest students", "lowest day"],
                promedio: ["average", "mean attendance", "students per day", "daily average", "per day", "daily"],
                tendencia: ["change", "trend", "increase", "decrease", "has changed", "how has", "going up", "going down", "improving", "getting worse"],
                patrones: ["pattern", "patterns", "found", "what days", "which days", "what day"],
                comparar: ["compare", "comparison", "difference", "versus", "vs", "more than", "less than", "same as"],
                porcentaje: ["percentage", "percent", "what percent", "how much is", "rate", "proportion"],
                nivel: ["level", "by level", "how many per level", "which level", "levels", "grade"],
                hoy: ["today", "today's", "attendance today", "today's attendance"],
                ayer: ["yesterday", "yesterday's", "attendance yesterday"],
                manana: ["tomorrow", "what will happen tomorrow", "for tomorrow", "next day"],
                semana_prox: ["next week", "coming week", "week ahead"],
                comparar_semanas: ["compare weeks", "this week vs", "last week vs", "difference between weeks"],
                desperdicio: ["waste", "leftovers", "how much thrown", "food thrown", "discarded", "leftover"],
                precios: ["price", "prices", "cost", "costs", "how much", "revenue", "income", "money", "colones"],
                estudiantes_total: ["total students", "how many students", "total of students", "how many are there"]
            },
            Português: {
                saludo: ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite", "salve", "e ai"],
                gracias: ["obrigado", "obrigada", "otimo", "ótimo", "perfeito", "excelente", "maravilhoso"],
                ayuda: ["ajuda", "o que voce pode fazer", "o que voce pode", "me ajudar", "como funciona", "o que voce sabe"],
                semana: ["semana", "esta semana", "quantos comeram", "quantos estudantes comeram", "comeram hoje", "semana passada", "da semana"],
                raciones: ["racoes", "rações", "quantos pratos", "quanto preparar", "preparar", "comida", "quanto", "quanto cozinhar", "pratos"],
                becados: ["bolsistas", "becados", "quantos bolsistas", "bolsista hoje", "bolsa"],
                pagan: ["pagam", "de pagamento", "quantos pagam", "pagam hoje", "pagamento"],
                mayor: ["maior presenca", "mais presenca", "dia com mais", "melhor dia", "mais estudantes", "dia pico", "pico"],
                menor: ["menor presenca", "menos presenca", "dia com menos", "pior dia", "menos estudantes", "menor quantidade"],
                promedio: ["media", "média", "estudantes por dia", "media diaria", "por dia", "diariamente"],
                tendencia: ["mudou", "tendencia", "tendência", "aumento", "diminuição", "diminuicao", "como tem sido", "esta subindo", "esta caindo"],
                patrones: ["padroes", "padrões", "padrao", "encontrou", "quais dias", "que dia"],
                comparar: ["comparar", "compara", "diferenca", "diferença", "versus", "vs", "mais que", "menos que"],
                porcentaje: ["percentual", "por cento", "qual percentual", "quanto e", "taxa", "proporcao"],
                nivel: ["nivel", "por nivel", "quantos por nivel", "qual nivel", "niveis"],
                hoy: ["hoje", "no dia de hoje", "presenca de hoje"],
                ayer: ["ontem", "no dia de ontem", "presenca de ontem"],
                manana: ["amanha", "o que vai acontecer amanha", "para amanha", "proximo dia"],
                semana_prox: ["proxima semana", "semana que vem"],
                comparar_semanas: ["comparar semanas", "esta semana vs", "semana passada vs", "diferenca entre semanas"],
                desperdicio: ["desperdicio", "sobra", "quanto e jogado", "comida jogada", "descartado", "sobra"],
                precios: ["preco", "preços", "custo", "custos", "quanto custa", "receita", "ganho", "dinheiro"],
                estudiantes_total: ["total de estudantes", "quantos estudantes", "total estudantes", "quantos ha"]
            },
            Français: {
                saludo: ["bonjour", "salut", "bonsoir", "hello", "coucou", "bon matin"],
                gracias: ["merci", "parfait", "excellent", "super", "bravo", "merci beaucoup"],
                ayuda: ["aide", "aidez moi", "que peux tu faire", "comment ca marche", "que sais tu faire"],
                semana: ["semaine", "cette semaine", "combien ont mange", "combien de etudiants", "ont mange aujourd", "semaine derniere", "de la semaine"],
                raciones: ["rations", "repas", "combien preparer", "preparer", "nourriture", "combien de rations", "combien cuisiner"],
                becados: ["boursiers", "combien de boursiers", "boursier aujourd"],
                pagan: ["payants", "combien payants", "payent aujourd"],
                mayor: ["plus haute presence", "plus de presence", "jour avec le plus", "meilleur jour", "plus d etudiants", "jour pic", "pic"],
                menor: ["plus faible presence", "moins de presence", "jour avec le moins", "pire jour", "moins d etudiants"],
                promedio: ["moyenne", "etudiants par jour", "moyenne journaliere", "par jour", "quotidiennement"],
                tendencia: ["change", "tendance", "augmente", "diminue", "comment a evolue", "en hausse", "en baisse"],
                patrones: ["motifs", "tendances", "modeles", "trouve", "quels jours", "quel jour"],
                comparar: ["comparer", "comparaison", "difference", "versus", "vs", "plus que", "moins que"],
                porcentaje: ["pourcentage", "pour cent", "quel pourcentage", "combien est", "taux", "proportion"],
                nivel: ["niveau", "par niveau", "combien par niveau", "quel niveau", "niveaux"],
                hoy: ["aujourd'hui", "la journee d'aujourd'hui", "presence d'aujourd'hui"],
                ayer: ["hier", "la journee d'hier", "presence de hier"],
                manana: ["demain", "que va-t-il se passer demain", "pour demain", "prochain jour"],
                semana_prox: ["semaine prochaine", "la semaine prochaine"],
                comparar_semanas: ["comparer les semaines", "cette semaine vs", "semaine derniere vs", "difference entre les semaines"],
                desperdicio: ["dechets", "restes", "combien jete", "nourriture jetee", "discard", "reste"],
                precios: ["prix", "cout", "couts", "combien coute", "revenu", "argent"],
                estudiantes_total: ["total des etudiants", "combien d'etudiants", "total etudiants"]
            },
            Deutsch: {
                saludo: ["hallo", "guten tag", "hi", "guten morgen", "guten abend", "servus", "grüß Gott"],
                gracias: ["danke", "super", "perfekt", "ausgezeichnet", "toll", "vielen dank"],
                ayuda: ["hilfe", "was kannst du", "wie funktioniert", "was weißt du", "was können sie"],
                semana: ["woche", "diese woche", "wie viele haben gegessen", "wie viele studenten", "heute gegessen", "letzte woche", "von der woche"],
                raciones: ["portionen", "rationen", "wie viel essen", "zubereiten", "mahlzeiten", "wie viele portionen", "wie viel kochen"],
                becados: ["stipendiaten", "stipendiat", "wie viele stipendiaten", "stipendiat heute", "stipendium"],
                pagan: ["zahlende", "wie viele zahlende", "zahlen heute", "zahlung"],
                mayor: ["hoechste anwesenheit", "meiste anwesenheit", "tag mit den meisten", "bester tag", "meisten studenten", "spitzentag", "spitze"],
                menor: ["niedrigste anwesenheit", "wenigste anwesenheit", "tag mit den wenigsten", "schlechtester tag", "wenigsten studenten"],
                promedio: ["durchschnitt", "durchschnittlich", "studenten pro tag", "tagesdurchschnitt", "pro tag", "täglich"],
                tendencia: ["veraendert", "trend", "anstieg", "rueckgang", "wie war", "steigt", "faellt"],
                patrones: ["muster", "welche tage", "gefunden", "welcher tag"],
                comparar: ["vergleichen", "vergleich", "unterschied", "gegen", "vs", "mehr als", "weniger als"],
                porcentaje: ["prozent", "wie viel prozent", "wie viel ist", "anteil", "quote"],
                nivel: ["stufe", "nach stufe", "wie viele pro stufe", "welche stufe", "stufen"],
                hoy: ["heute", "heutige", "anwesenheit heute"],
                ayer: ["gestern", "gestrige", "anwesenheit gestern"],
                manana: ["morgen", "was passiert morgen", "für morgen", "nächster tag"],
                semana_prox: ["nächste woche", "kommende woche"],
                comparar_semanas: ["wochen vergleichen", "diese woche vs", "letzte woche vs", "unterschied zwischen wochen"],
                desperdicio: ["abfall", "reste", "wie viel weggeworfen", "essensreste", "weggeworfen", "übrig"],
                precios: ["preis", "preise", "kosten", "kosten", "wie viel kostet", "einnahmen", "geld"],
                estudiantes_total: ["gesamtzahl der studenten", "wie viele studenten", "studenten gesamt"]
            }
        };


        // Normaliza el texto: minúsculas, sin acentos y sin puntuación
        function normalizarIA(texto) {
            return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");
        }


        // Detecta la intención de la pregunta usando palabras clave del idioma actual
        function detectarIntencionIA(pregunta) {
            const idioma = configuracion.idioma;
            const patrones = IA_PATRONES[idioma] || IA_PATRONES["Español"];
            const norm = normalizarIA(pregunta);
            const orden = ["hoy", "ayer", "manana", "semana_prox", "semana", "becados", "pagan", "desperdicio", "raciones", "mayor", "menor", "promedio", "tendencia", "patrones", "comparar", "porcentaje", "nivel", "precios", "estudiantes_total", "saludo", "gracias", "ayuda"];
            for (const intento of orden) {
                const claves = patrones[intento] || [];
                for (const k of claves) {
                    if (norm.includes(normalizarIA(k))) return intento;
                }
            }
            return "desconocido";
        }


        function capitalizarIA(texto) {
            return texto.charAt(0).toUpperCase() + texto.slice(1);
        }


        function nombreDiaSemana(w) {
            const ref = new Date(2026, 0, 4 + w);
            return capitalizarIA(ref.toLocaleDateString(localeParaIdioma(), { weekday: "long" }));
        }


        // =============================================
        // INTEGRACIÓN CON GEMINI (IA real, llamada directa)
        // =============================================

        const GEMINI_LIMITE_DIARIO = 60;

        const PROMPT_SISTEMA_GEMINI = (idioma) => [
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

        const INSTRUCCIONES_GEMINI = {
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

        let geminiUsado = false;
        let historialChatIA = [];

        function geminiContadorDia() {
            const hoy = new Date().toISOString().slice(0, 10);
            let datos = { fecha: hoy, n: 0 };
            try {
                const guardado = JSON.parse(localStorage.getItem("geminiContadorDia") || "null");
                if (guardado && guardado.fecha === hoy) datos = guardado;
            } catch (e) { console.error("Error al leer contador de IA: ", e); }
            return datos;
        }

        function gastarConsultaGemini() {
            const datos = geminiContadorDia();
            datos.n++;
            localStorage.setItem("geminiContadorDia", JSON.stringify(datos));
            actualizarBadgeIA();
            return datos.n;
        }

        function consultasGeminiRestantes() {
            return Math.max(0, GEMINI_LIMITE_DIARIO - geminiContadorDia().n);
        }

        function geminiLimiteAlcanzado() {
            return consultasGeminiRestantes() <= 0;
        }

        function esErrorLimiteGemini(error) {
            return !!(error && (
                error.limite ||
                String(error.code || "").toLowerCase().includes("resource-exhausted") ||
                String(error.message || "").toLowerCase().includes("limite") ||
                String(error.message || "").toLowerCase().includes("limit")
            ));
        }

        // Hay clave configurada para el modo directo
        function geminiDisponible() {
            return typeof obtenerClaveGemini() === "string" && obtenerClaveGemini().length > 10;
        }

        // Modelos de respaldo por si el modelo principal está saturado (solo nombres que existen en la API)
        const GEMINI_MODELOS_RETRY = ["gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-pro-latest", "gemini-3.8-flash"];

        function esErrorTransitorioGemini(status) {
            const s = Number(status) || 0;
            return s === 429 || s === 500 || s === 502 || s === 503 || s === 504;
        }

        function esperarMs(ms) { return new Promise(r => setTimeout(r, ms)); }

        // Llama a Gemini con reintentos automáticos y cambio de modelo si está saturado
        async function generarConReintentos(cuerpo) {
            const modelos = [GEMINI_MODELO_DIRECTO].concat(GEMINI_MODELOS_RETRY.filter(m => m !== GEMINI_MODELO_DIRECTO));
            let ultimoError = null;
            for (const modelo of modelos) {
                for (let intento = 1; intento <= 2; intento++) {
                    try {
                        const respuesta = await fetch(
                            "https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-goog-api-key": obtenerClaveGemini()
                                },
                                body: JSON.stringify(cuerpo)
                            });
                        if (!respuesta.ok) {
                            const errData = await respuesta.json().catch(() => null);
                            const e = new Error((errData && errData.error && errData.error.message) || ("Gemini " + respuesta.status));
                            e.code = String(respuesta.status);
                            if (esErrorTransitorioGemini(respuesta.status)) { ultimoError = e; await esperarMs(intento * 900); continue; }
                            if (respuesta.status === 404 || respuesta.status === 403) { ultimoError = e; break; }
                            throw e;
                        }
                        const data = await respuesta.json();
                        const partes = (data && data.candidates || [])
                            .map(c => (c.content && c.content.parts || []).map(p => p.text || "").join(""))
                            .join("\n");
                        if (!partes) throw new Error("Gemini no devolvió respuesta");
                        geminiUsado = true;
                        gastarConsultaGemini();
                        actualizarBadgeIA();
                        return partes;
                    } catch (error) {
                        if (error && error.code && esErrorTransitorioGemini(error.code)) {
                            ultimoError = error;
                            await esperarMs(500 * intento);
                            continue;
                        }
                        if (error && (String(error.code) === "404" || String(error.code) === "403")) {
                            ultimoError = error;
                            break;
                        }
                        throw error;
                    }
                }
            }
            throw ultimoError || new Error("Gemini no disponible");
        }

        // Llama a la API de Gemini directamente desde el navegador con los datos reales (contexto)
        function llamarGemini(tipo, contexto, pregunta, historial) {
            const idioma = configuracion.idioma;
            const instruccion =
                tipo === "chat"
                    ? (pregunta
                        ? "Responde la pregunta del usuario de forma clara, útil y amable. Si la respuesta se puede fundamentar con los datos del CONTEXTO, úsalos como fuente; si la pregunta no está relacionada con el comedor, respóndela igualmente con tu conocimiento general, sin inventar datos del comedor.\nPREGUNTA: " + pregunta
                        : "Preséntate brevemente y explica qué puedes hacer con los datos del comedor. Menciona 3-4 ejemplos de preguntas que te pueden hacer.")
                    : (INSTRUCCIONES_GEMINI[tipo] || INSTRUCCIONES_GEMINI.analisis);

            const bloques = [
                PROMPT_SISTEMA_GEMINI(idioma),
                "CONTEXTO (datos reales de ComeID):",
                "```json",
                JSON.stringify(contexto),
                "```"
            ];

            const historialArr = Array.isArray(historial) ? historial.slice(-10) : [];
            if (historialArr.length > 0 && tipo === "chat") {
                bloques.push("HISTORIAL DE LA CONVERSACIÓN:");
                historialArr.forEach(m => {
                    bloques.push((m.rol === "usuario" ? "Encargado" : "ComeID IA") + ": " + m.texto);
                });
            }

            bloques.push("INSTRUCCIÓN:", instruccion);

            const prompt = bloques.join("\n\n");

            const cuerpo = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
            };

            return generarConReintentos(cuerpo);
        }

        // Respeta el límite diario gratuito antes de llamar a Gemini
        function intentarGemini(tipo, contexto, pregunta, historial) {
            if (geminiLimiteAlcanzado()) {
                const e = new Error("Limite diario alcanzado");
                e.limite = true;
                return Promise.reject(e);
            }
            return llamarGemini(tipo, contexto, pregunta, historial);
        }

        // Actualiza la insignia del motor de IA en la cabecera de la sección
        function actualizarBadgeIA() {
            const badge = document.getElementById("iaEstadoBadge");
            if (!badge) return;
            const trad = traducciones[configuracion.idioma];
            if (geminiUsado) {
                const restantes = consultasGeminiRestantes();
                badge.textContent = (trad.iaBadgeGemini || "IA Gemini activa") + (restantes > 0 ? ` (${restantes} ${trad.iaBadgeRestantes || "hoy"})` : "");
                badge.style.background = "rgba(16,185,129,0.15)";
                badge.style.color = "#10b981";
            } else if (geminiDisponible() && geminiLimiteAlcanzado()) {
                badge.textContent = trad.iaBadgeLimite || "IA local (límite diario)";
                badge.style.background = "var(--bg-tertiary)";
                badge.style.color = "#fbbf24";
            } else {
                badge.textContent = trad.iaBadgeLocal || "IA local";
                badge.style.background = "var(--bg-tertiary)";
                badge.style.color = "var(--text-secondary)";
            }
        }

        // Contexto estructurado con los datos reales para enviar a Gemini
        function construirContextoIA(datos, est) {
            const inventario7 = {};
            Object.keys(datos.inventario).forEach(f => {
                if (f >= fechaISOOffset(6)) inventario7[f] = datos.inventario[f];
            });
            return {
                fechaConsulta: new Date().toISOString().slice(0, 10),
                estudiantes: datos.estudiantes,
                totalAsistenciasRegistradas: est ? est.totalRegistros : 0,
                promedioPorJornada: est ? est.promedio : 0,
                diasConDatos: est ? est.n : 0,
                asistenciasPorDia: est ? est.porDiaArr.map(d => ({ fecha: d.fecha, asistentes: d.total })) : [],
                promedioPorDiaSemana: est ? est.promedioPorDiaSemana : [],
                diasMayorAsistencia: est ? est.diasMayor : [],
                diasMenorAsistencia: est ? est.diasMenor : [],
                tendenciaObservada: est ? est.descTendencia : "",
                inventarioUltimos7Dias: inventario7
            };
        }

        function escaparHTML(texto) {
            return String(texto || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }


        // Obtiene los datos reales de Firestore: estudiantes (en memoria), asistencias
        // de los últimos 28 días e inventario de sobrantes
        function obtenerDatosIA() {
            const totalEstudiantes = estudiantes || [];
            return Promise.all([
                db.collection("asistencias").where("fecha", ">=", fechaISOOffset(27)).get(),
                db.collection("inventario").get()
            ]).then(resultados => {
                const porDia = {};
                resultados[0].forEach(doc => {
                    const a = doc.data();
                    const f = a.fecha;
                    if (!f) return;
                    if (!porDia[f]) porDia[f] = { total: 0, becados: 0, pagan: 0 };
                    porDia[f].total++;
                    if (esPaganteAsistencia(a)) {
                        porDia[f].pagan++;
                    } else {
                        porDia[f].becados++;
                    }
                });
                const inventario = {};
                resultados[1].forEach(doc => { inventario[doc.id] = doc.data(); });
                return {
                    estudiantes: {
                        total: totalEstudiantes.length,
                        becados: totalEstudiantes.filter(e => e.tipo === "Becado").length,
                        pagan: totalEstudiantes.filter(e => e.tipo === "Paga").length
                    },
                    porDia,
                    inventario
                };
            });
        }


        // Calcula las estadísticas reales de asistencia
        function calcularEstadisticasIA(datos, trad) {
            const fechas = Object.keys(datos.porDia).filter(f => datos.porDia[f].total > 0).sort();
            if (fechas.length === 0) return null;

            let totalRegistros = 0;
            let totalBecados = 0;
            const porDiaArr = [];
            const weekdaySuma = {};
            const weekdayCount = {};

            fechas.forEach(f => {
                const d = datos.porDia[f];
                totalRegistros += d.total;
                totalBecados += d.becados;
                const w = new Date(f + "T12:00:00").getDay();
                weekdaySuma[w] = (weekdaySuma[w] || 0) + d.total;
                weekdayCount[w] = (weekdayCount[w] || 0) + 1;
                const label = capitalizarIA(new Date(f + "T12:00:00").toLocaleDateString(localeParaIdioma(), { weekday: "long", day: "numeric", month: "short" }));
                porDiaArr.push({ fecha: f, total: d.total, label });
            });

            const promedio = Math.round(totalRegistros / fechas.length);

            const wkAvg = [];
            for (let w = 0; w < 7; w++) {
                if (weekdayCount[w]) wkAvg.push({ w, avg: weekdaySuma[w] / weekdayCount[w] });
            }
            const maxAvg = Math.max(...wkAvg.map(x => x.avg));
            const minAvg = Math.min(...wkAvg.map(x => x.avg));
            const diasMayor = wkAvg.filter(x => x.avg === maxAvg).map(x => nombreDiaSemana(x.w));
            const diasMenor = wkAvg.filter(x => x.avg === minAvg).map(x => nombreDiaSemana(x.w));

            // Tendencia: compara el promedio reciente con el promedio anterior
            let descTendencia = trad.iaDescEstable || "estable";
            if (fechas.length >= 4) {
                const mitad = Math.floor(fechas.length / 2);
                const a1 = porDiaArr.slice(0, mitad).reduce((s, d) => s + d.total, 0) / mitad;
                const a2 = porDiaArr.slice(mitad).reduce((s, d) => s + d.total, 0) / (fechas.length - mitad);
                const ratio = a2 / (a1 || 1);
                descTendencia = ratio > 1.08 ? (trad.iaDescSube || "sube") : (ratio < 0.92 ? (trad.iaDescBaja || "baja") : (trad.iaDescEstable || "estable"));
            }

            // Alerta: cambio importante entre días consecutivos
            let alertaCambio = null;
            for (let i = 1; i < porDiaArr.length; i++) {
                const antes = porDiaArr[i - 1].total;
                const despues = porDiaArr[i].total;
                const pct = antes > 0 ? Math.abs(despues - antes) / antes : 0;
                if (pct >= 0.20 && Math.abs(despues - antes) >= 5) {
                    const diferencia = (despues - antes) > 0 ? "+" + (despues - antes) : String(despues - antes);
                    alertaCambio = { fecha: porDiaArr[i].label, cantidad: diferencia };
                    break;
                }
            }

            return {
                estudiantes: datos.estudiantes,
                fechas,
                n: fechas.length,
                totalRegistros,
                totalBecados,
                promedio,
                porDiaArr,
                diasMayor,
                diasMenor,
                promedioPorDiaSemana: wkAvg.map(x => ({ dia: nombreDiaSemana(x.w), promedio: Math.round(x.avg * 10) / 10 })),
                descTendencia,
                alertaCambio
            };
        }


        // Regresión lineal simple sobre los últimos días + promedio móvil
        function calcularPrediccion(serie) {
            const n = serie.length;
            if (n === 0) return null;
            if (n === 1) return serie[0].asistentes;
            let sx = 0, sy = 0, sxx = 0, sxy = 0;
            for (let i = 0; i < n; i++) {
                sx += i;
                sy += serie[i].asistentes;
                sxx += i * i;
                sxy += i * serie[i].asistentes;
            }
            const denom = n * sxx - sx * sx;
            let pendiente = 0;
            let intercepto = 0;
            if (denom !== 0) {
                pendiente = (n * sxy - sx * sy) / denom;
                intercepto = (sy - pendiente * sx) / n;
            }
            const promedio = sy / n;
            const pred = (pendiente * n + intercepto + promedio) / 2;
            return Math.max(0, Math.round(pred));
        }


        // Predicción de asistencia y raciones sugeridas
        function predecirAsistenciaIA(datos) {
            const fechas = Object.keys(datos.porDia).filter(f => datos.porDia[f].total > 0).sort();
            if (fechas.length < 3) return null;
            const serie = fechas.slice(-10).map(f => ({ fecha: f, asistentes: datos.porDia[f].total }));
            const estimada = calcularPrediccion(serie);

            let promedioSobrantes = 0;
            let diasConInv = 0;
            for (let i = 6; i >= 0; i--) {
                const f = fechaISOOffset(i);
                const inv = datos.inventario[f];
                if (inv && (inv.sobrantes || 0) > 0) {
                    promedioSobrantes += inv.sobrantes;
                    diasConInv++;
                }
            }
            if (diasConInv > 0) promedioSobrantes = Math.round(promedioSobrantes / diasConInv);
            const margen = promedioSobrantes > 0 ? promedioSobrantes : Math.max(1, Math.round(estimada * 0.05));
            return { estimada, raciones: estimada + margen, margen };
        }


        // Genera las recomendaciones como lista de puntos
        function generarRecomendacionesIA(est, pred, trad) {
            if (!est) return `<p class="scanner-lista-vacia">${trad.iaNoSuficientesDatos || ""}</p>`;
            const items = [];
            if (pred) items.push(trad.iaRecRaciones.replace("{raciones}", pred.raciones));
            if (est.diasMayor.length) items.push(trad.iaRecDias.replace("{dias}", est.diasMayor.join(", ")));
            if (est.alertaCambio) items.push(trad.iaAlertaCambio.replace("{fecha}", est.alertaCambio.fecha).replace("{cantidad}", est.alertaCambio.cantidad));
            items.push(trad.iaRecEstimacion);
            return `<ul style="margin: 0; padding-left: 20px; line-height: 1.9;">${items.map(i => `<li style="color: var(--text-primary);">${i}</li>`).join("")}</ul>`;
        }


        // Tabla de desperdicio de los últimos 7 días (conserva la función existente)
        function generarDesperdicioHTML(datos, est, pred, trad) {
            const invPorDia = datos.inventario || {};
            const filasDesp = [];
            let sumaSobrantes = 0;
            let diasRegistrados = 0;
            for (let i = 6; i >= 0; i--) {
                const f = fechaISOOffset(i);
                const inv = invPorDia[f];
                const preparados = inv && inv.preparados ? inv.preparados : 0;
                const sobrantes = inv && inv.sobrantes ? inv.sobrantes : 0;
                if (sobrantes > 0 || preparados > 0) {
                    sumaSobrantes += sobrantes;
                    diasRegistrados++;
                }
                const nombreDia = new Date(f + "T12:00:00").toLocaleDateString(localeParaIdioma(), { weekday: "long", day: "numeric", month: "short" });
                filasDesp.push(`<tr>
                    <td style="padding: 8px 10px; border-bottom: 1px solid var(--border-color); text-transform: capitalize;">${nombreDia}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid var(--border-color); text-align: center;">${preparados > 0 ? preparados : (inv ? "0" : "—")}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid var(--border-color); text-align: center; color: #ef5350; font-weight: 600;">${inv ? sobrantes : "—"}</td>
                </tr>`);
            }
            const promedioDesperdicio = diasRegistrados > 0 ? Math.round(sumaSobrantes / diasRegistrados) : 0;
            const prepararRecomendado = pred ? pred.raciones : 0;
            return `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 8px 10px; color: var(--text-secondary); border-bottom: 2px solid var(--border-color);">${trad.wasteDia || "Día"}</th>
                                <th style="padding: 8px 10px; color: var(--text-secondary); border-bottom: 2px solid var(--border-color); text-align: center;">${trad.wastePreparados || "Comidas preparadas"}</th>
                                <th style="padding: 8px 10px; color: var(--text-secondary); border-bottom: 2px solid var(--border-color); text-align: center;">${trad.wasteSobrantes || "Sobrantes"}</th>
                            </tr>
                        </thead>
                        <tbody>${filasDesp.join("")}</tbody>
                    </table>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 15px;">
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; text-align: center;">
                        <p style="color: var(--text-secondary); font-size: 13px;">${trad.wastePromedio || "Promedio de sobrantes"}</p>
                        <p style="color: #ef5350; font-size: 26px; font-weight: bold;">${promedioDesperdicio}</p>
                        <p style="color: var(--text-secondary); font-size: 12px;">${trad.wastePlatos || "platos"}</p>
                    </div>
                    <div style="background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.35); border-radius: 10px; padding: 14px; text-align: center;">
                        <p style="color: var(--text-secondary); font-size: 13px;">${trad.wasteRecomendacion || "Recomendación de preparación"}</p>
                        <p style="color: #fbbf24; font-size: 26px; font-weight: bold;">${prepararRecomendado}</p>
                        <p style="color: var(--text-secondary); font-size: 12px;">${trad.iaAlmuerzos || "almuerzos"} ${trad.iaParaManana || "para mañana"}</p>
                    </div>
                </div>`;
        }


        // Carga la predicción, recomendaciones y desperdicio al entrar a la sección
        function cargarIA() {
            const trad = traducciones[configuracion.idioma];
            const contPred = document.getElementById("iaPrediccionContenido");
            const contRec = document.getElementById("iaRecomendacionesContenido");
            const contDesp = document.getElementById("desperdicioContenido");
            if (!contPred) return;

            obtenerDatosIA().then(datos => {
                const est = calcularEstadisticasIA(datos, trad);
                const pred = est ? predecirAsistenciaIA(datos) : null;

                if (!est || !pred) {
                    contPred.innerHTML = `<p class="scanner-lista-vacia">${trad.iaNoSuficientesDatos || ""}</p>`;
                } else {
                    contPred.innerHTML = `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                            <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); border-radius: 12px; padding: 18px; text-align: center;">
                                <p style="color: var(--text-secondary); font-size: 13px;">${trad.iaAsistenciaEstimada || ""}</p>
                                <p style="color: #10b981; font-size: 34px; font-weight: bold;">${pred.estimada}</p>
                                <p style="color: var(--text-secondary); font-size: 12px;">${trad.iaEstudiantes || "estudiantes"}</p>
                            </div>
                            <div style="background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.35); border-radius: 12px; padding: 18px; text-align: center;">
                                <p style="color: var(--text-secondary); font-size: 13px;">${trad.iaRacionesSugeridas || ""}</p>
                                <p style="color: #fbbf24; font-size: 34px; font-weight: bold;">${pred.raciones}</p>
                                <p style="color: var(--text-secondary); font-size: 12px;">${trad.iaAlmuerzos || "almuerzos"}</p>
                            </div>
                        </div>
                        <p class="scanner-lista-vacia" style="margin-top: 12px; font-size: 12px;">${trad.iaRacionesNota || ""}</p>`;
                }

                if (contRec) {
                    const mostrarRec = (html) => { contRec.innerHTML = html; };
                    if (est && geminiDisponible()) {
                        intentarGemini("recomendaciones", construirContextoIA(datos, est), "")
                            .then(respuesta => mostrarRec(`<div style="line-height: 1.9; color: var(--text-primary); white-space: pre-wrap;">${escaparHTML(respuesta)}</div><p class="scanner-lista-vacia" style="margin-top: 10px; font-size: 12px;">${trad.iaGeminiNota || ""}</p>`))
                            .catch(error => {
                                console.error("Gemini no disponible para recomendaciones: ", error);
                                mostrarRec(generarRecomendacionesIA(est, pred, trad));
                                if (esErrorLimiteGemini(error)) mostrarNotificacion(trad.iaLimiteDia || "", "error");
                            });
                    } else {
                        mostrarRec(generarRecomendacionesIA(est, pred, trad));
                    }
                }
                if (contDesp) contDesp.innerHTML = generarDesperdicioHTML(datos, est, pred, trad);
            }).catch(error => {
                console.error("Error al cargar la IA del comedor: ", error);
                contPred.innerHTML = `<p class="scanner-lista-vacia">${trad.iaError || ""}</p>`;
                if (contRec) contRec.innerHTML = "";
                if (contDesp) contDesp.innerHTML = "";
            });
        }


        // HTML del análisis generado con el motor local (determinista)
        function analisisHTML(est, trad) {
            const parrafos = [];
            parrafos.push((trad.iaResumenLinea || "")
                .replace("{total}", est.estudiantes.total)
                .replace("{becados}", est.estudiantes.becados)
                .replace("{pagan}", est.estudiantes.pagan)
                .replace("{registros}", est.totalRegistros));
            parrafos.push((trad.iaAnalisisPromedio || "").replace("{dias}", est.n).replace("{promedio}", est.promedio));
            if (est.diasMayor.length) parrafos.push((trad.iaAnalisisMayor || "").replace("{dias}", est.diasMayor.join(", ")));
            if (est.diasMenor.length) parrafos.push((trad.iaAnalisisMenor || "").replace("{dias}", est.diasMenor.join(", ")));
            parrafos.push((trad.iaAnalisisTendencia || "").replace("{desc}", est.descTendencia));
            if (est.alertaCambio) parrafos.push((trad.iaAlertaCambio || "").replace("{fecha}", est.alertaCambio.fecha).replace("{cantidad}", est.alertaCambio.cantidad));

            const ultimos = est.porDiaArr.slice(-7);
            const listaDias = ultimos.map(d => `<span style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 10px; font-size: 13px;">${d.label}: <strong>${d.total}</strong></span>`).join("");

            return `
                <h3 style="color: var(--accent-color); margin-bottom: 10px;">🧠 ${trad.iaResultadoTitle || ""}</h3>
                <div style="line-height: 1.8; color: var(--text-primary);">
                    ${parrafos.map(p => `<p>${p}</p>`).join("")}
                </div>
                ${ultimos.length ? `<p style="color: var(--text-secondary); font-size: 13px; margin-top: 10px;"><strong>${trad.iaUltimosDias || "Últimos días"}:</strong></p><div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">${listaDias}</div>` : ""}`;
        }


        function analisisRespuestaHTML(respuesta, trad) {
            return `
                <h3 style="color: var(--accent-color); margin-bottom: 10px;">🧠 ${trad.iaResultadoTitle || ""}</h3>
                <div style="line-height: 1.8; color: var(--text-primary); white-space: pre-wrap;">${escaparHTML(respuesta)}</div>
                <p class="scanner-lista-vacia" style="margin-top: 10px; font-size: 12px;">${trad.iaGeminiNota || ""}</p>`;
        }


        function spinnerIA(trad) {
            return `<div style="display: flex; align-items: center; gap: 10px; color: var(--text-secondary);">
                <i class="fas fa-spinner fa-spin"></i> <span>${trad.iaAnalizando || "Analizando datos..."}</span></div>`;
        }


        // Botón "Analizar datos"
        function analizarDatosIA() {
            const trad = traducciones[configuracion.idioma];
            const div = document.getElementById("iaAnalisisResultado");
            if (!div) return;
            div.innerHTML = spinnerIA(trad);

            obtenerDatosIA().then(datos => {
                const est = calcularEstadisticasIA(datos, trad);
                if (!est) {
                    div.innerHTML = `<p class="scanner-lista-vacia">${trad.iaNoSuficientesDatos || ""}</p>`;
                    return;
                }
                if (geminiDisponible()) {
                    intentarGemini("analisis", construirContextoIA(datos, est), "")
                        .then(respuesta => { div.innerHTML = analisisRespuestaHTML(respuesta, trad); })
                        .catch(error => {
                            console.error("Gemini no disponible, usando motor local: ", error);
                            div.innerHTML = analisisHTML(est, trad);
                            if (esErrorLimiteGemini(error)) mostrarNotificacion(trad.iaLimiteDia || "", "error");
                        });
                } else {
                    div.innerHTML = analisisHTML(est, trad);
                }
            }).catch(error => {
                console.error("Error al analizar datos del comedor: ", error);
                div.innerHTML = `<p class="scanner-lista-vacia">${trad.iaError || ""}</p>`;
            });
        }


        // Resumen local de la semana (sin backend) para el botón "Resumen semanal"
        function resumenSemanaLocal(est, trad) {
            const limite = fechaISOOffset(6);
            let total = 0;
            let mejor = null;
            let peor = null;
            est.porDiaArr.forEach(d => {
                if (d.fecha < limite) return;
                total += d.total;
                if (!mejor || d.total > mejor.total) mejor = d;
                if (!peor || d.total < peor.total) peor = d;
            });
            const partes = [];
            partes.push((trad.iaSemanaRta || "").replace("{total}", total));
            partes.push((trad.iaAnalisisPromedio || "").replace("{dias}", est.n).replace("{promedio}", est.promedio));
            if (mejor) partes.push((trad.iaMayorDiaRta || "").replace("{fecha}", mejor.label).replace("{cantidad}", mejor.total));
            if (peor) partes.push((trad.iaMenorDiaRta || "").replace("{fecha}", peor.label).replace("{cantidad}", peor.total));
            partes.push((trad.iaTendenciaRta || "").replace("{desc}", est.descTendencia));
            return partes.join("\n\n");
        }


        // Botón "Resumen semanal"
        function analizarResumenSemanaIA() {
            const trad = traducciones[configuracion.idioma];
            const div = document.getElementById("iaAnalisisResultado");
            if (!div) return;
            div.innerHTML = spinnerIA(trad);

            obtenerDatosIA().then(datos => {
                const est = calcularEstadisticasIA(datos, trad);
                if (!est) {
                    div.innerHTML = `<p class="scanner-lista-vacia">${trad.iaNoSuficientesDatos || ""}</p>`;
                    return;
                }
                const mostrar = (respuesta, nota) => {
                    div.innerHTML = `
                        <h3 style="color: var(--accent-color); margin-bottom: 10px;">🗓️ ${trad.iaResumenSemanaTitle || "Resumen de la semana"}</h3>
                        <div style="line-height: 1.8; color: var(--text-primary); white-space: pre-wrap;">${escaparHTML(respuesta)}</div>
                        ${nota ? `<p class="scanner-lista-vacia" style="margin-top: 10px; font-size: 12px;">${nota}</p>` : ""}`;
                };
                if (geminiDisponible()) {
                    intentarGemini("resumenSemana", construirContextoIA(datos, est), "")
                        .then(respuesta => { mostrar(respuesta, trad.iaGeminiNota || ""); })
                        .catch(error => {
                            console.error("Gemini no disponible para resumen: ", error);
                            mostrar(resumenSemanaLocal(est, trad), "");
                            if (esErrorLimiteGemini(error)) mostrarNotificacion(trad.iaLimiteDia || "", "error");
                        });
                } else {
                    mostrar(resumenSemanaLocal(est, trad), "");
                }
            }).catch(error => {
                console.error("Error al generar el resumen semanal: ", error);
                div.innerHTML = `<p class="scanner-lista-vacia">${trad.iaError || ""}</p>`;
            });
        }


        // Añade una burbuja al chat
        function agregarMensajeIA(texto, esUsuario) {
            const cont = document.getElementById("iaChatMensajes");
            if (!cont) return;
            const div = document.createElement("div");
            div.textContent = texto;
            div.style.cssText = esUsuario
                ? "align-self: flex-end; background: #2b67ff; color: #fff; border-radius: 14px 14px 4px 14px; padding: 10px 14px; max-width: 82%; line-height: 1.5; word-wrap: break-word;"
                : "align-self: flex-start; background: var(--bg-tertiary); color: var(--text-primary); border-radius: 14px 14px 14px 4px; padding: 10px 14px; max-width: 82%; line-height: 1.5; word-wrap: break-word;";
            cont.appendChild(div);
            cont.scrollTop = cont.scrollHeight;
        }


        // Muestra una respuesta con efecto de escritura (revela el texto progresivamente)
        function agregarMensajeTipeado(texto) {
            const cont = document.getElementById("iaChatMensajes");
            if (!cont) return;
            const div = document.createElement("div");
            div.style.cssText = "align-self: flex-start; background: var(--bg-tertiary); color: var(--text-primary); border-radius: 14px 14px 14px 4px; padding: 10px 14px; max-width: 82%; line-height: 1.5; word-wrap: break-word; white-space: pre-wrap;";
            cont.appendChild(div);
            cont.scrollTop = cont.scrollHeight;
            const partes = String(texto || "").split("");
            let i = 0;
            const paso = 2;
            const timer = setInterval(() => {
                const hasta = Math.min(i + paso, partes.length);
                div.textContent = partes.slice(0, hasta).join("") + (hasta < partes.length ? "▍" : "");
                cont.scrollTop = cont.scrollHeight;
                i = hasta;
                if (i >= partes.length) {
                    clearInterval(timer);
                    div.textContent = String(texto || "");
                    cont.scrollTop = cont.scrollHeight;
                }
            }, 12);
        }


        // Envía una pregunta rápida desde las sugerencias del chat
        function enviarPreguntaRapidaIA(texto) {
            const input = document.getElementById("iaChatInput");
            if (!input) return;
            input.value = String(texto || "");
            enviarPreguntaIA();
        }


        // Genera los botones de preguntas rápidas del chat
        function chipsIAHTML() {
            const trad = traducciones[configuracion.idioma];
            const chips = [
                { trad: trad.iaChipHoy, fallback: "¿Cuántos comieron hoy?" },
                { trad: trad.iaChipAyer, fallback: "¿Y ayer cuántos comieron?" },
                { trad: trad.iaChipManana, fallback: "¿Cuántos se esperan mañana?" },
                { trad: trad.iaChipRaciones, fallback: "¿Cuántas raciones preparar mañana?" },
                { trad: trad.iaChipSemana, fallback: "¿Cuántos comieron esta semana?" },
                { trad: trad.iaChipSemanaProx, fallback: "¿Cuántos la próxima semana?" },
                { trad: trad.iaChipMayor, fallback: "¿Día con más asistencia?" },
                { trad: trad.iaChipMenor, fallback: "¿Día con menos asistencia?" },
                { trad: trad.iaChipPromedio, fallback: "¿Promedio de asistencia?" },
                { trad: trad.iaChipTendencia, fallback: "¿Está subiendo o bajando la asistencia?" },
                { trad: trad.iaChipPatrones, fallback: "¿Qué patrones detectas?" },
                { trad: trad.iaChipComparar, fallback: "Compara los últimos días" },
                { trad: trad.iaChipPorcentaje, fallback: "¿Qué porcentaje asiste?" },
                { trad: trad.iaChipBecados, fallback: "¿Cuántos son becados?" },
                { trad: trad.iaChipPagan, fallback: "¿Cuántos son de pago?" },
                { trad: trad.iaChipNivel, fallback: "¿Cuántos por nivel?" },
                { trad: trad.iaChipDesperdicio, fallback: "¿Cuánta comida se desperdicia?" },
                { trad: trad.iaChipPrecios, fallback: "¿Ganancias del comedor?" },
                { trad: trad.iaChipTotal, fallback: "¿Cuántos estudiantes hay en total?" },
                { trad: trad.iaChipAyuda, fallback: "¿Qué puedes hacer?" }
            ];
            return chips.map(ch => {
                const label = ch.trad || ch.fallback;
                return `<button data-t="${label}" onclick="enviarPreguntaRapidaIA(this.dataset.t)" style="padding: 8px 14px; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-tertiary); color: var(--text-secondary); font-size: 13px; cursor: pointer;">${label}</button>`;
            }).join("");
        }


        // Limpia el chat y su historial
        function limpiarChatIA() {
            const cont = document.getElementById("iaChatMensajes");
            if (!cont) return;
            const trad = traducciones[configuracion.idioma];
            historialChatIA = [];
            cont.innerHTML = `<div style="align-self: flex-start; background: var(--bg-tertiary); color: var(--text-primary); border-radius: 14px 14px 14px 4px; padding: 10px 14px; max-width: 82%; line-height: 1.5; word-wrap: break-word;">${trad.iaChatInicial || ""}</div>`;
        }


        // Abre o cierra el panel de configuración de la clave de Gemini
        function mostrarConfigIA() {
            const panel = document.getElementById("iaConfigPanel");
            if (!panel) return;
            const mostrar = panel.style.display === "none";
            panel.style.display = mostrar ? "block" : "none";
            if (mostrar) {
                const input = document.getElementById("iaConfigInput");
                if (input) {
                    input.value = obtenerClaveGemini() || "";
                    input.focus();
                }
            }
        }


        // Guarda la clave de Gemini tecleada en el panel de configuración
        function guardarClaveIA() {
            const input = document.getElementById("iaConfigInput");
            if (!input) return;
            const clave = input.value.trim();
            const trad = traducciones[configuracion.idioma];
            if (clave.length < 10) {
                mostrarNotificacion(trad.iaConfigClaveInvalida || "La clave parece incompleta.", "error");
                return;
            }
            if (guardarClaveGemini(clave)) {
                if (geminiDisponible() && !geminiLimiteAlcanzado()) geminiUsado = true;
                mostrarNotificacion(trad.iaConfigGuardada || "Clave de Gemini guardada. ¡IA real activada!", "success");
            }
            actualizarBadgeIA();
            const panel = document.getElementById("iaConfigPanel");
            if (panel) panel.style.display = "none";
        }


        // Quita la clave de Gemini configurada en este navegador
        function quitarClaveIA() {
            quitarClaveGemini();
            geminiUsado = false;
            const trad = traducciones[configuracion.idioma];
            mostrarNotificacion(trad.iaConfigQuitada || "Clave de Gemini quitada. IA local activa.", "info");
            actualizarBadgeIA();
            const panel = document.getElementById("iaConfigPanel");
            if (panel) panel.style.display = "none";
        }
        // Responde una pregunta del chat usando Gemini (si está activo) o el motor local
        function responderPreguntaIA(pregunta) {
            const trad = traducciones[configuracion.idioma];
            return obtenerDatosIA().then(datos => {
                const est = calcularEstadisticasIA(datos, trad);
                if (geminiDisponible()) {
                    return intentarGemini("chat", construirContextoIA(datos, est), pregunta, historialChatIA)
                        .catch(error => {
                            console.error("Gemini no disponible para el chat: ", error);
                            if (esErrorLimiteGemini(error)) return trad.iaLimiteDia || "";
                            return responderPreguntaLocal(pregunta, datos, est, trad);
                        });
                }
                return responderPreguntaLocal(pregunta, datos, est, trad);
            });
        }


        // Respuesta con el motor local (determinista, sin backend, no inventa datos)
        function responderPreguntaLocal(pregunta, datos, est, trad) {
            const intencion = detectarIntencionIA(pregunta);
            if (!est) {
                if (intencion === "saludo") return trad.iaChatInicial || "";
                if (intencion === "gracias") return trad.iaDeNada || "";
                if (intencion === "ayuda") return trad.iaAyudaRta || "";
                const noEntiendo = trad.iaNoEntiendo || "";
                const ayuda2 = trad.iaAyudaRta || "";
                return (noEntiendo + (ayuda2 ? "\n\n" + ayuda2 : "")).trim() || "";
            }

            switch (intencion) {
                    case "saludo":
                        return trad.iaChatInicial || "";
                    case "gracias":
                        return trad.iaDeNada || "";
                    case "ayuda":
                        return trad.iaAyudaRta || "";
                    case "hoy": {
                        const hoy = new Date().toISOString().slice(0, 10);
                        const d = datos.porDia[hoy];
                        if (!d) return (trad.iaHoyRta || "Hoy no hay registros de asistencia aún.").replace("{total}", 0);
                        return (trad.iaHoyRta || "Hoy han comido **{total}** estudiantes ({becados} becados y {pagan} de pago).")
                            .replace("{total}", d.total).replace("{becados}", d.becados).replace("{pagan}", d.pagan);
                    }
                    case "ayer": {
                        const ayer = fechaISOOffset(1);
                        const d = datos.porDia[ayer];
                        if (!d) return trad.iaNoSuficientesDatos || "";
                        return (trad.iaAyerRta || "Ayer comieron **{total}** estudiantes ({becados} becados y {pagan} de pago).")
                            .replace("{total}", d.total).replace("{becados}", d.becados).replace("{pagan}", d.pagan);
                    }
                    case "manana": {
                        const pred = predecirAsistenciaIA(datos);
                        if (!pred) return trad.iaNoSuficientesDatos || "";
                        return (trad.iaMananaRta || "Se estima que mañana usarán el comedor **{estimada}** estudiantes. Se recomiendan **{raciones}** raciones.")
                            .replace("{estimada}", pred.estimada).replace("{raciones}", pred.raciones);
                    }
                    case "semana_prox": {
                        const pred = predecirAsistenciaIA(datos);
                        if (!pred) return trad.iaNoSuficientesDatos || "";
                        return (trad.iaSemanaProxRta || "Para la próxima semana se estima un promedio de **{promedio}** estudiantes por día.")
                            .replace("{promedio}", pred.estimada);
                    }
                    case "semana": {
                        const limite = fechaISOOffset(6);
                        let total = 0;
                        est.porDiaArr.forEach(d => { if (d.fecha >= limite) total += d.total; });
                        return (trad.iaSemanaRta || "").replace("{total}", total);
                    }
                    case "mayor": {
                        let mejor = est.porDiaArr[0];
                        est.porDiaArr.forEach(d => { if (d.total > mejor.total) mejor = d; });
                        return (trad.iaMayorDiaRta || "").replace("{fecha}", mejor.label).replace("{cantidad}", mejor.total);
                    }
                    case "menor": {
                        let peor = est.porDiaArr[0];
                        est.porDiaArr.forEach(d => { if (d.total < peor.total) peor = d; });
                        return (trad.iaMenorDiaRta || "").replace("{fecha}", peor.label).replace("{cantidad}", peor.total);
                    }
                    case "becados":
                        return (trad.iaBecadosRta || "").replace("{cantidad}", est.totalBecados);
                    case "pagan":
                        return (trad.iaPaganRta || "Hay **{cantidad}** estudiantes de pago.").replace("{cantidad}", est.estudiantes.pagan);
                    case "promedio":
                        return (trad.iaPromedioRta || "").replace("{promedio}", est.promedio);
                    case "raciones": {
                        const pred = predecirAsistenciaIA(datos);
                        if (!pred) return trad.iaNoSuficientesDatos || "";
                        return (trad.iaRacionesRta || "").replace("{raciones}", pred.raciones);
                    }
                    case "tendencia":
                        return (trad.iaTendenciaRta || "").replace("{desc}", est.descTendencia);
                    case "patrones": {
                        const lista = [];
                        if (est.diasMayor.length) lista.push((trad.iaAnalisisMayor || "").replace("{dias}", est.diasMayor.join(", ")));
                        if (est.diasMenor.length) lista.push((trad.iaAnalisisMenor || "").replace("{dias}", est.diasMenor.join(", ")));
                        if (est.alertaCambio) lista.push((trad.iaAlertaCambio || "").replace("{fecha}", est.alertaCambio.fecha).replace("{cantidad}", est.alertaCambio.cantidad));
                        if (lista.length === 0) lista.push(trad.iaDescEstable || "");
                        return (trad.iaPatronesRta || "").replace("{lista}", lista.join(" "));
                    }
                    case "comparar": {
                        if (est.porDiaArr.length < 2) return trad.iaNoSuficientesDatos || "";
                        const ultimo = est.porDiaArr[est.porDiaArr.length - 1];
                        const anterior = est.porDiaArr[est.porDiaArr.length - 2];
                        const diff = ultimo.total - anterior.total;
                        const pct = anterior.total > 0 ? Math.round((diff / anterior.total) * 100) : 0;
                        const signo = diff > 0 ? "+" : "";
                        return `Comparando los últimos 2 días registrados:\n• ${anterior.label}: **${anterior.total}** estudiantes\n• ${ultimo.label}: **${ultimo.total}** estudiantes\n• Diferencia: **${signo}${diff}** (${signo}${pct}%)`;
                    }
                    case "porcentaje": {
                        if (est.estudiantes.total === 0) return trad.iaNoSuficientesDatos || "";
                        const tasaAsistencia = est.promedio > 0 ? Math.round((est.promedio / est.estudiantes.total) * 100) : 0;
                        return `Tasa de asistencia promedio: **${tasaAsistencia}%** (${est.promedio} de ${est.estudiantes.total} estudiantes por día).`;
                    }
                    case "nivel": {
                        const porNivel = {};
                        estudiantes.forEach(e => {
                            const n = e.nivel || "Sin nivel";
                            porNivel[n] = (porNivel[n] || 0) + 1;
                        });
                        if (Object.keys(porNivel).length === 0) return trad.iaNoSuficientesDatos || "";
                        const lista = Object.entries(porNivel).map(([n, c]) => `• **${n}**: ${c} estudiantes`).join("\n");
                        return `Distribución por nivel:\n${lista}`;
                    }
                    case "desperdicio": {
                        let suma = 0, dias = 0;
                        for (let i = 6; i >= 0; i--) {
                            const f = fechaISOOffset(i);
                            const inv = datos.inventario[f];
                            if (inv && (inv.sobrantes || 0) > 0) { suma += inv.sobrantes; dias++; }
                        }
                        if (dias === 0) return "No hay datos de desperdicio registrados en los últimos 7 días.";
                        const prom = Math.round(suma / dias);
                        return `Promedio de sobrantes (últimos 7 días): **${prom}** platos/día (total: ${suma} en ${dias} días).`;
                    }
                    case "precios": {
                        const pred = predecirAsistenciaIA(datos);
                        if (!pred) return trad.iaNoSuficientesDatos || "";
                        const precio = Number(configuracion.precio) || 0;
                        const gananciaEst = pred.raciones * precio;
                        return `Estimación de ganancia bruta: **₡${gananciaEst.toLocaleString()}**\n• Estudiantes estimados: ${pred.raciones}\n• Precio por ración: ₡${precio.toLocaleString()}`;
                    }
                    case "estudiantes_total":
                        return `Actualmente hay **${est.estudiantes.total}** estudiantes registrados (${est.estudiantes.becados} becados y ${est.estudiantes.pagan} de pago).`;
                    default: {
                        const noEntiendo = trad.iaNoEntiendo || "";
                        const ayuda = trad.iaAyudaRta || "";
                        return (noEntiendo + (ayuda ? "\n\n" + ayuda : "")).trim() || "";
                    }
                }
        }


        // Enviar una pregunta desde el chat
        function enviarPreguntaIA() {
            const input = document.getElementById("iaChatInput");
            if (!input) return;
            const pregunta = input.value.trim();
            if (!pregunta) return;
            input.value = "";

            const trad = traducciones[configuracion.idioma];
            const cont = document.getElementById("iaChatMensajes");
            if (!cont) return;

            agregarMensajeIA(pregunta, true);

            const typing = document.createElement("div");
            typing.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${trad.iaAnalizando || "Analizando datos..."}</span>`;
            typing.style.cssText = "align-self: flex-start; background: var(--bg-tertiary); color: var(--text-secondary); border-radius: 14px 14px 14px 4px; padding: 10px 14px; max-width: 82%; line-height: 1.5;";
            cont.appendChild(typing);
            cont.scrollTop = cont.scrollHeight;

            responderPreguntaIA(pregunta).then(respuesta => {
                typing.remove();
                agregarMensajeTipeado(respuesta);
                historialChatIA.push({ rol: "usuario", texto: pregunta });
                historialChatIA.push({ rol: "asistente", texto: respuesta });
                if (historialChatIA.length > 20) historialChatIA = historialChatIA.slice(-20);
            }).catch(error => {
                console.error("Error al responder con IA: ", error);
                typing.remove();
                agregarMensajeIA(trad.iaError || "", false);
            });
        }


        // Muestra la sección completa de IA del Comedor
        function mostrarPrediccion() {
            vistaActual = "prediccion";
            geminiUsado = false;
            historialChatIA = [];
            const trad = traducciones[configuracion.idioma];

            document.getElementById("contenido").innerHTML = `
                <h1 class="title">${trad.menuPrediccion || "IA del Comedor"}</h1>

                <div class="panel" style="margin-top: 15px; background: linear-gradient(135deg, rgba(43,103,255,0.18), rgba(16,185,129,0.12)); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <h2 style="color: var(--accent-color); margin: 0;">${trad.iaSectionTitle || "🧠 Inteligencia Artificial"}</h2>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span id="iaEstadoBadge" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 600;">${trad.iaBadgeLocal || "IA local"}</span>
                            <button onclick="mostrarConfigIA()" title="${trad.iaConfigBtn || "Configurar clave de Gemini"}" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 13px; cursor: pointer;">⚙️</button>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); margin-top: 6px;">${trad.iaSectionSubtitle || ""}</p>
                    <div id="iaConfigPanel" style="display: none; margin-top: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
                        <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 8px 0;">${trad.iaConfigTexto || 'Obtén tu clave gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color: var(--accent-color);">aistudio.google.com/apikey</a> y pégala aquí (se guarda solo en este navegador). Recomendado: restríngela al dominio <strong>https://comeid-670b9.web.app</strong> en Google Cloud.'}</p>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <input type="text" id="iaConfigInput" placeholder="AIza..." maxlength="100" onkeydown="if(event.key==='Enter')guardarClaveIA()" style="flex: 1; min-width: 200px; padding: 10px 12px; border-radius: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px;">
                            <button onclick="guardarClaveIA()" style="padding: 10px 16px; border: none; border-radius: 8px; background: var(--accent-color); color: white; font-weight: bold; cursor: pointer; font-size: 13px;">${trad.iaConfigGuardar || "Guardar"}</button>
                            <button onclick="quitarClaveIA()" style="padding: 10px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); font-weight: bold; cursor: pointer; font-size: 13px;">${trad.iaConfigQuitar || "Quitar"}</button>
                        </div>
                    </div>
                </div>

                <div class="panel" style="margin-top: 15px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 12px;">📊 ${trad.iaAnalisisCard || "Análisis del comedor"}</h2>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="analizarDatosIA()" style="padding: 12px 24px; border: none; border-radius: 10px; background: var(--accent-color); color: white; font-weight: bold; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-chart-line"></i> ${trad.iaAnalizarBtn || "Analizar datos"}
                        </button>
                        <button onclick="analizarResumenSemanaIA()" style="padding: 12px 24px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-tertiary); color: var(--text-primary); font-weight: bold; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-calendar-week"></i> ${trad.iaResumenSemanaBtn || "Resumen semanal"}
                        </button>
                    </div>
                    <div id="iaAnalisisResultado" style="margin-top: 15px;">
                        <p class="scanner-lista-vacia">${trad.iaAnalisisInicial || ""}</p>
                    </div>
                </div>

                <div class="panel" style="margin-top: 15px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 12px;">🔮 ${trad.iaPrediccionTitle || "Predicción de asistencia"}</h2>
                    <div id="iaPrediccionContenido"><p class="scanner-lista-vacia">Cargando...</p></div>
                </div>

                <div class="panel" style="margin-top: 15px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 12px;">💡 ${trad.iaRecomendacionesTitle || "Recomendaciones de la IA"}</h2>
                    <div id="iaRecomendacionesContenido"><p class="scanner-lista-vacia">Cargando...</p></div>
                </div>

                <div class="panel" style="margin-top: 15px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 12px;">💬 ${trad.iaChatTitle || "Asistente ComeID"}</h2>
                    <div id="iaChatMensajes" style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px;">
                        <div style="align-self: flex-start; background: var(--bg-tertiary); color: var(--text-primary); border-radius: 14px 14px 14px 4px; padding: 10px 14px; max-width: 82%; line-height: 1.5; word-wrap: break-word;">${trad.iaChatInicial || ""}</div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                        ${chipsIAHTML()}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 12px;">
                        <input type="text" id="iaChatInput" placeholder="${trad.iaChatPlaceholder || ""}" onkeydown="if(event.key==='Enter')enviarPreguntaIA()" style="flex: 1; padding: 12px; border-radius: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px;">
                        <button onclick="enviarPreguntaIA()" style="padding: 12px 20px; border: none; border-radius: 10px; background: var(--accent-color); color: white; font-weight: bold; cursor: pointer; font-size: 14px;">
                            ${trad.iaEnviar || "Enviar"}
                        </button>
                        <button onclick="limpiarChatIA()" title="${trad.iaLimpiarChat || "Limpiar chat"}" style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 14px; cursor: pointer;"><i class="fas fa-eraser"></i></button>
                    </div>
                </div>

                <div class="panel" style="margin-top: 15px;">
                    <h2 style="color: var(--accent-color); margin-bottom: 12px;">${trad.wasteTitle || "Predicción de Desperdicio"}</h2>
                    <div id="desperdicioContenido"><p class="scanner-lista-vacia">Cargando...</p></div>
                </div>
            `;

            if (geminiDisponible() && !geminiLimiteAlcanzado()) geminiUsado = true;
            actualizarBadgeIA();
            cargarIA();
        }
