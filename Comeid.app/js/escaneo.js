// =============================================
// ComeID - Escaneo de QR, camara y registro de asistencia
// =============================================


        // Función para abrir el escáner de QR
        async function abrirScanner() {
            const resultDiv = document.getElementById("scannerResult");
            resultDiv.style.display = "none";
            resultDiv.className = "scanner-result";
            document.getElementById("scannerModal").style.display = "flex";
            cargarListaDelDia();
            try {
                await cargarScript(URL_ZXING);
            } catch (e) {
                mostrarNotificacion(e.message, "error");
            }
        }


        // Función para cerrar el escáner
        function cerrarScanner() {
            detenerScanner();
            document.getElementById("scannerModal").style.display = "none";
            document.getElementById("scannerResult").style.display = "none";
        }


        // Función para iniciar el escáner (ZXing pide el permiso de cámara)
        function solicitarPermisoCamara() {
            const trad = traducciones[configuracion.idioma];
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                mostrarNotificacion(trad.notificacionCamaraNoSoportada, "error");
                return;
            }
            iniciarScanner();
        }

        // Preparar el audio dentro del gesto del usuario para que el beep funcione después
        let contextoAudio = null;

        function prepararAudio() {
            try {
                if (!contextoAudio) {
                    contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (contextoAudio.state === "suspended") contextoAudio.resume();
            } catch (e) { /* sin audio */ }
        }


        // Beep de confirmación: "ok", "duplicado" o "error"
        function reproducirSonido(tipo) {
            try {
                if (!contextoAudio) return;
                if (contextoAudio.state === "suspended") contextoAudio.resume();
                const ahora = contextoAudio.currentTime;
                const tocar = (frecuencia, inicio, duracion, volumen) => {
                    const osc = contextoAudio.createOscillator();
                    const gan = contextoAudio.createGain();
                    osc.type = "sine";
                    osc.frequency.value = frecuencia;
                    gan.gain.setValueAtTime(0.0001, ahora + inicio);
                    gan.gain.exponentialRampToValueAtTime(volumen, ahora + inicio + 0.01);
                    gan.gain.exponentialRampToValueAtTime(0.0001, ahora + inicio + duracion);
                    osc.connect(gan);
                    gan.connect(contextoAudio.destination);
                    osc.start(ahora + inicio);
                    osc.stop(ahora + inicio + duracion + 0.02);
                };
                if (tipo === "ok") {
                    tocar(880, 0, 0.15, 0.3);
                    tocar(1320, 0.12, 0.15, 0.25);
                } else if (tipo === "duplicado") {
                    tocar(660, 0, 0.1, 0.25);
                } else {
                    tocar(220, 0, 0.25, 0.28);
                }
            } catch (e) { /* sin audio */ }
        }


        function vibrar(ms) {
            try {
                if (navigator.vibrate) navigator.vibrate(ms);
            } catch (e) { /* sin vibración */ }
        }


        // Función para limpiar el texto que va dentro del QR (sin acentos ni separadores)
        function limpiarTextoQR(texto) {
            return String(texto || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\|/g, " ")
                .trim();
        }


        // Función para extraer la cédula del contenido de un QR
        function extraerCedulaDelQR(content) {
            if (!content) return "";
            const contenido = String(content);
            const partes = contenido.split("|");
            if (partes.length >= 2) {
                return partes[1].trim();
            }
            const coincidencia = contenido.match(/C[eé]dula[:\s]*([\d]+)/i);
            if (coincidencia) return coincidencia[1];
            return contenido.trim();
        }


        // Función para procesar un código QR escaneado
        function procesarCodigo(content) {
            const trad = traducciones[configuracion.idioma];
            const resultDiv = document.getElementById("scannerResult");

            const cedula = extraerCedulaDelQR(content);
            const ahora = Date.now();
            if (cedula === ultimoCodigo && ahora - ultimoTiempo < 5000) {
                // Mismo QR detectado de nuevo mientras sigue frente a la cámara:
                // no registrar de nuevo y no sobrescribir el resultado anterior,
                // para dar tiempo a leer el nombre y el estado del estudiante.
                return;
            }
            ultimoCodigo = cedula;
            ultimoTiempo = ahora;

            const estudiante = estudiantes.find(e => e.cedula === cedula);

            if (estudiante) {
                const fotoHallada = estudiante.foto
                    ? `<img src="${estudiante.foto}" alt="" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; margin-right: 10px; border: 2px solid var(--accent-color); vertical-align: middle;">`
                    : "";
                resultDiv.innerHTML = `${fotoHallada}<span style="vertical-align: middle;">${trad.notificacionEstudianteEncontrado || "Estudiante encontrado:"} ${estudiante.nombre}...</span>`;
                resultDiv.className = "scanner-result";
                resultDiv.style.display = "block";
                registrarAsistencia(cedula);
            } else {
                resultDiv.textContent = `${trad.notificacionEstudianteNoEncontrado || "No se encontró el estudiante con código:"} ${cedula}`;
                resultDiv.className = "scanner-result scanner-result-error";
                resultDiv.style.display = "block";
                mostrarNotificacion(`${trad.notificacionEstudianteNoEncontrado || "No se encontró el estudiante con código:"} ${cedula}`, "error");
                reproducirSonido("error");
                vibrar(200);
            }
        }


        // Función para iniciar el escáner con la cámara trasera (ZXing)
        function iniciarScanner() {
            const trad = traducciones[configuracion.idioma];

            if (typeof ZXing === "undefined" || !ZXing.BrowserQRCodeReader) {
                mostrarNotificacion(trad.notificacionCamaraNoSoportada, "error");
                return;
            }

            prepararAudio();
            detenerScanner();

            // Reiniciar el anti-repetición: no debe quedar el del estudiante anterior
            ultimoCodigo = "";
            ultimoTiempo = 0;

            const video = document.getElementById("scannerVideo");
            const resultDiv = document.getElementById("scannerResult");
            const statusDiv = document.getElementById("scannerStatus");
            const frameDiv = document.getElementById("scannerFrame");
            resultDiv.textContent = "Iniciando cámara...";
            resultDiv.style.display = "block";
            if (statusDiv) { statusDiv.style.display = "none"; }

            codeReader = new ZXing.BrowserQRCodeReader();
            const token = ++tokenScanner;

            let intentos = 0;
            let ultimoUpdate = 0;

            const manejador = (result, err) => {
                if (result && result.text) {
                    if (statusDiv) { statusDiv.style.display = "none"; }
                    procesarCodigo(result.text);
                } else if (statusDiv) {
                    // Solo actualizar el texto cada 500ms (el callback corre por frame)
                    const ahora = Date.now();
                    if (ahora - ultimoUpdate > 500) {
                        ultimoUpdate = ahora;
                        statusDiv.textContent = (trad.scannerEscaneando || "Escaneando...") + " (" + intentos + ")";
                        statusDiv.style.display = "block";
                    }
                }
            };

            const scannerListo = controls => {
                if (token !== tokenScanner) {
                    try { controls.stop(); } catch (e) {}
                    return;
                }
                zxingControls = controls;
                document.getElementById("startScannerBtn").style.display = "none";
                document.getElementById("stopScannerBtn").style.display = "inline-block";
                resultDiv.style.display = "none";
                if (frameDiv) { frameDiv.style.display = "block"; }
            };

            const mostrarError = err => {
                if (token !== tokenScanner) return;
                console.error("Error al acceder a la cámara: ", err);
                resultDiv.textContent = trad.notificacionErrorCamara + (err.message || err);
                resultDiv.style.display = "block";
                mostrarNotificacion(trad.notificacionErrorCamara + (err.message || err), "error");
            };

            // Sin deviceId: ZXing pide el permiso y usa facingMode 'environment' (cámara trasera).
            // Es más confiable que enumerar cámaras antes del permiso (los deviceId pueden estar vacíos).
            codeReader.decodeFromVideoDevice(undefined, video, manejador).then(scannerListo).catch(err => {
                if (token !== tokenScanner) return;
                console.warn("Cámara trasera no disponible, intentando cualquier cámara: ", err);
                codeReader.getVideoInputDevices().then(devices => {
                    if (token !== tokenScanner) return;
                    if (!devices || devices.length === 0) {
                        resultDiv.textContent = trad.notificacionCamaraNoEncontrada;
                        resultDiv.style.display = "block";
                        mostrarNotificacion(trad.notificacionCamaraNoEncontrada, "error");
                        return;
                    }
                    codeReader.decodeFromVideoDevice(devices[0].deviceId, video, manejador).then(scannerListo).catch(mostrarError);
                }).catch(mostrarError);
            });
        }


        // Función para detener el escáner
        function detenerScanner() {
            tokenScanner++; // invalida cualquier respuesta pendiente
            ultimoCodigo = "";
            ultimoTiempo = 0;
            if (zxingControls) {
                try { zxingControls.stop(); } catch (e) {}
                zxingControls = null;
            }
            if (codeReader) {
                try { codeReader.reset(); } catch (e) {}
                codeReader = null;
            }

            const video = document.getElementById("scannerVideo");
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }

            const statusDiv = document.getElementById("scannerStatus");
            if (statusDiv) { statusDiv.style.display = "none"; }

            const frameDiv = document.getElementById("scannerFrame");
            if (frameDiv) { frameDiv.style.display = "none"; }

            document.getElementById("startScannerBtn").style.display = "inline-block";
            document.getElementById("stopScannerBtn").style.display = "none";
        }


        // Función para registrar asistencia
        function registrarAsistencia(cedula) {
            const trad = traducciones[configuracion.idioma];
            const hoy = new Date().toISOString().slice(0, 10);
            const estudiante = estudiantes.find(e => e.cedula === cedula || e.qr === cedula);
            const resultDiv = document.getElementById("scannerResult");
            const esBecado = estudiante && estudiante.tipo === "Becado";
            const precio = Number(configuracion.precio) || 0;
            const nombre = estudiante ? estudiante.nombre : cedula;
            const seccion = estudiante ? estudiante.seccion : "";

            function mostrarResultado(ok, yaRegistrado) {
                if (!resultDiv) return;
                let texto;
                let clase;
                if (yaRegistrado) {
                    texto = `${trad.notificacionYaRegistrado || "Ya registrado hoy"}: ${nombre}${seccion ? " - " + seccion : ""}`;
                    clase = "scanner-result-ok";
                    reproducirSonido("duplicado");
                    vibrar(80);
                } else if (!ok) {
                    texto = trad.notificacionError || "Error";
                    clase = "scanner-result-error";
                    reproducirSonido("error");
                    vibrar(200);
                } else {
                    const cobro = esBecado
                        ? (trad.scannerSinCobro || "Becado - sin cobro")
                        : `${trad.scannerPagoCobrado || "Pago cobrado"}: ₡${precio.toLocaleString()}`;
                    texto = `${nombre}${seccion ? " - " + seccion : ""} | ${cobro}`;
                    clase = "scanner-result-ok";
                    reproducirSonido("ok");
                    vibrar(120);
                }
                const fotoHtml = (estudiante && estudiante.foto)
                    ? `<img src="${estudiante.foto}" alt="" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; margin-right: 10px; border: 2px solid var(--accent-color); vertical-align: middle;">`
                    : "";
                resultDiv.innerHTML = `${fotoHtml}<span style="vertical-align: middle;">${texto}</span>`;
                resultDiv.className = "scanner-result " + clase;
                resultDiv.style.display = "block";
            }

            db.collection("asistencias").where("fecha", "==", hoy).get()
                .then(querySnapshot => {
                    const yaRegistrado = querySnapshot.docs.some(doc => doc.data().cedula === cedula);
                    if (yaRegistrado) {
                        mostrarResultado(true, true);
                        mostrarNotificacion(`${trad.notificacionAsistenciaRegistrada || "Asistencia registrada para:"} ${nombre} (${trad.notificacionYaRegistrado || "ya registrado hoy"})`);
                        cargarListaDelDia();
                        return;
                    }
                    const asistencia = {
                        cedula: cedula,
                        fecha: hoy,
                        hora: new Date().toLocaleTimeString(),
                        estudiante: estudiante ? estudiante.nombre : cedula,
                        seccion: estudiante ? estudiante.seccion : "",
                        tipo: estudiante ? estudiante.tipo : ""
                    };
                    return db.collection("asistencias").add(asistencia).then(() => {
                        if (!navigator.onLine) {
                            sumarRegistroPendiente();
                        }
                        mostrarResultado(true, false);
                        mostrarNotificacion(`${trad.notificacionAsistenciaRegistrada || "Asistencia registrada para:"} ${asistencia.estudiante}${esBecado ? "" : " - " + (trad.scannerPagoCobrado || "Pago cobrado") + ": ₡" + precio.toLocaleString()}`);
                        cargarListaDelDia();
                    });
                })
                .catch(error => {
                    mostrarResultado(false, false);
                    mostrarNotificacion(trad.notificacionError + ": " + error.message, "error");
                    console.error("Error al registrar asistencia: ", error);
                });
        }


        // Función para cargar y mostrar la lista de asistencias del día
        function cargarListaDelDia() {
            const trad = traducciones[configuracion.idioma];
            const listaDiv = document.getElementById("scannerListaContenido");
            if (!listaDiv) return;

            const titulo = document.getElementById("scannerListaTitle");
            if (titulo) titulo.textContent = trad.scannerListaTitle || "Lista del Día";

            const ganadoDiv = document.getElementById("scannerListaGanado");
            if (ganadoDiv) ganadoDiv.textContent = `${trad.scannerGanadoHoy || "Ganado hoy"}: ₡0`;

            listaDiv.innerHTML = `<p class="scanner-lista-vacia">Cargando...</p>`;

            const hoy = new Date().toISOString().slice(0, 10);
            db.collection("asistencias").where("fecha", "==", hoy).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        listaDiv.innerHTML = `<p class="scanner-lista-vacia">${trad.scannerListaVacia || "No hay asistencias registradas hoy"}</p>`;
                        return;
                    }
                    const asistencias = [];
                    querySnapshot.forEach(doc => asistencias.push(doc.data()));
                    asistencias.sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

                    let ganado = 0;
                    const precio = Number(configuracion.precio) || 0;
                    let html = "";
                    asistencias.forEach(a => {
                        const estudiante = estudiantes.find(e => e.cedula === a.cedula);
                        const nombre = a.estudiante || (estudiante ? estudiante.nombre : a.cedula) || "";
                        const seccion = a.seccion || (estudiante ? estudiante.seccion : "") || "";
                        const esBecado = !esPaganteAsistencia(a);
                        const tipoTexto = esBecado ? (trad.formTipoBecado || "Becado") : (trad.formTipoPaga || "Paga");
                        if (!esBecado) {
                            ganado += precio;
                        }
                        html += `
                            <div class="scanner-lista-item">
                                <div class="scanner-lista-info">
                                    <span class="scanner-lista-nombre">${nombre}</span>
                                    <span class="scanner-lista-seccion">${seccion ? `${trad.tablaSeccion || "Sección"}: ${seccion}` : ""}</span>
                                </div>
                                <span class="scanner-lista-tipo ${esBecado ? "becado" : "paga"}">${tipoTexto}</span>
                                ${!esBecado ? `<span class="scanner-lista-pagado">${trad.scannerPagoCobrado || "Pagó"}: ₡${precio.toLocaleString()}</span>` : ""}
                                <span class="scanner-lista-hora">${a.hora || ""}</span>
                            </div>
                        `;
                    });
                    if (ganadoDiv) ganadoDiv.textContent = `${trad.scannerGanadoHoy || "Ganado hoy"}: ₡${ganado.toLocaleString()}`;
                    listaDiv.innerHTML = html;
                })
                .catch(error => {
                    listaDiv.innerHTML = `<p class="scanner-lista-vacia">${trad.notificacionError}: ${error.message}</p>`;
                    console.error("Error al cargar la lista del día: ", error);
                });
        }