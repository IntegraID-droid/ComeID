# Manual de Casos de Uso — ComeID (Integra ID)

Sistema integrado de gestión de comedor estudiantil y biblioteca  
**CTP de Liberia, Guanacaste — Costa Rica**

---

## 1. Introducción

Este manual describe los casos de uso del sistema **ComeID (Integra ID)**, una plataforma web diseñada para la gestión integral del comedor y la biblioteca del Colegio Técnico Profesional (CTP) de Liberia, Costa Rica.

El sistema consta de dos aplicaciones frontend independientes, ambas desplegadas en Firebase Hosting y conectadas a Firebase Auth + Firestore:

| Aplicación | Ubicación | Usuario(s) |
|---|---|---|
| **Panel de Administración** | `https://comeid-670b9.web.app` (carpeta `Comeid.app/`) | Personal del centro educativo (admin, profesor, bibliotecario) |
| **Portal de Estudiantes** | `https://comeid-estudiantes.web.app` (carpeta `ComeidEstudiantes/`) | Estudiantes registrados |

Ambas aplicaciones son de arquitectura **serverless** (sin lógica del lado del servidor); toda la lógica de negocio y el control de acceso se ejecutan en el cliente y se protegen mediante reglas de Firestore.

### Funcionalidades principales

- Registro y administración de estudiantes con cuentas de acceso
- Control de asistencia al comedor mediante escaneo de códigos QR
- Planificación semanal del menú (lunes a viernes)
- Gestión de invitados externos
- Sistema de biblioteca: catálogo de libros, préstamos, devoluciones y reservas
- Análisis predictivo de demanda con inteligencia artificial (Gemini)
- Exportación de reportes a Excel y PDF
- Gestión de usuarios y roles con control de acceso basado en permisos
- Portal de auto-servicio para estudiantes

---

## 2. Roles del Sistema

El sistema define cuatro roles que determinan qué acciones puede realizar cada usuario:

### 2.1 Admin (Administrador)

- Acceso total a todas las secciones del Panel de Administración
- Crear, editar y eliminar estudiantes y sus cuentas de acceso
- Importar estudiantes masivamente desde archivos CSV
- Generar credenciales QR y escanear códigos de asistencia
- Gestionar usuarios y roles (promover entre admin/profesor/estudiante)
- Configurar el menú semanal
- Usar la inteligencia artificial para análisis y predicciones
- Registrar y eliminar invitados externos
- Exportar datos a Excel y PDF
- Acceder a la configuración del sistema
- Limpiar asistencias del día
- Eliminar historial de asistencias

### 2.2 Profesor

- Ver el dashboard con tarjetas resumen (becados, pagan, total, asistencia del día)
- Listar, buscar, crear y editar estudiantes
- Generar y compartir credenciales QR
- Escanear códigos QR para registrar asistencia
- Ver historial diario de asistencias
- Ver historial por estudiante
- Registrar invitados externos
- Configurar el menú semanal
- Exportar reportes a Excel y PDF

### 2.3 Bibliotecario

- Ver el dashboard
- Ver historial diario de asistencias
- Escanear códigos QR
- Configurar el menú semanal
- Gestionar el catálogo de libros (agregar, editar, cambiar estado)
- Registrar préstamos, devoluciones y reservas
- Ver reportes de biblioteca

### 2.4 Estudiante

- Acceder al Portal de Estudiantes
- Ver el menú semanal y su historial de asistencia
- Ver sus préstamos activos, reservas e historial de biblioteca
- Consultar su código QR personal
- Recibir notificaciones del sistema
- Gestionar su perfil y configuración (idioma, tema)

> **Nota de seguridad:** El sistema valida los roles en Firestore usando las funciones `esGestor()`, `esAdmin()` y `esEstudiante()`. Un estudiante solo puede leer su propia información. Las operaciones de escritura sobre datos de otros estudiantes requieren privilegios de gestor.

---

## 3. Acceso al Sistema (URLs)

### Panel de Administración

| Recurso | URL |
|---|---|
| Login | `https://comeid-670b9.web.app/login.html` |
| Panel principal | `https://comeid-670b9.web.app/index.html` |
| Selector de apps | `https://comeid-670b9.web.app/selector.html` |
| Biblioteca | `https://comeid-670b9.web.app/biblioteca.html` |

### Portal de Estudiantes

| Recurso | URL |
|---|---|
| Registro | `https://comeid-estudiantes.web.app/registro.html` |
| Login | `https://comeid-estudiantes.web.app/index.html` |
| Dashboard | `https://comeid-estudiantes.web.app/dashboard.html` |
| Comedor | `https://comeid-estudiantes.web.app/comedor.html` |
| Biblioteca | `https://comeid-estudiantes.web.app/biblioteca.html` |
| QR personal | `https://comeid-estudiantes.web.app/qr.html` |
| Notificaciones | `https://comeid-estudiantes.web.app/notificaciones.html` |
| Perfil | `https://comeid-estudiantes.web.app/perfil.html` |
| Configuración | `https://comeid-estudiantes.web.app/configuracion.html` |

> **Acceso:** Se utiliza autenticación por correo electrónico y contraseña a través de Firebase Auth. No hay acceso sin credenciales válidas.

---

## 4. Casos de Uso del Panel de Administración

### CU-01: Iniciar sesión en el Panel de Administración

- **Nombre:** CU-01: Iniciar sesión
- **Actor(es):** Admin, Profesor, Bibliotecario
- **Precondiciones:** El usuario debe tener una cuenta creada con correo y contraseña válidos. El usuario debe estar registrado en la colección `usuarios` de Firestore con un rol asignado (admin, profesor o bibliotecario).
- **Flujo principal:**
  1. El usuario navega a `https://comeid-670b9.web.app/login.html`.
  2. Ingresa su correo electrónico y contraseña en el formulario de inicio de sesión.
  3. Presiona el botón "Iniciar sesión".
  4. El sistema valida las credenciales contra Firebase Auth.
  5. El sistema consulta la colección `usuarios` para obtener el rol del usuario.
  6. Se redirige al usuario al panel principal (`index.html`), donde se muestra el sidebar con las secciones disponibles según su rol.
- **Resultado esperado:** El usuario accede al panel y ve el sidebar con las secciones permitidas para su rol. El Dashboard se carga automáticamente mostrando las tarjetas de resumen.

### CU-02: Registrar un estudiante con cuenta de acceso

- **Nombre:** CU-02: Registrar estudiante con cuenta
- **Actor(es):** Admin, Profesor
- **Precondiciones:** El usuario debe tener rol de admin o profesor y haber iniciado sesión.
- **Flujo principal:**
  1. El usuario navega a la sección "Estudiantes" desde el sidebar.
  2. Presiona el botón "Agregar" (ícono de usuario+).
  3. Se abre el formulario de registro con los campos: nombre, sección, cédula, nivel (7mo a 12mo), tipo (Becado o Paga) y foto (opcional).
  4. Completa los campos obligatorios: nombre, sección, cédula y nivel.
  5. Para crear la cuenta de acceso del estudiante, ingresa un correo electrónico y una contraseña (mínimo 6 caracteres) en los campos correspondientes. Si se dejan vacíos, el estudiante podrá registrarse por sí mismo desde el Portal de Estudiantes.
  6. Opcionalmente, agrega una foto del estudiante (se redimensiona automáticamente a 200px).
  7. Presiona "Guardar".
  8. El sistema verifica que la cédula no esté duplicada.
  9. Si se proporcionaron correo y contraseña, el sistema crea la cuenta en Firebase Auth mediante el endpoint público `signUp` (sin cerrar la sesión del admin).
  10. El sistema crea el documento del estudiante en la colección `estudiantes` y, si aplica, el perfil en la colección `usuarios` con rol "estudiante".
  11. Se genera automáticamente el contenido del código QR con los datos del estudiante.
- **Resultado esperado:** El estudiante aparece en la lista de estudiantes con su nombre, sección, nivel, tipo y cédula. Si se creó cuenta, el estudiante puede iniciar sesión en el Portal de Estudiantes.

### CU-03: Importar estudiantes masivamente desde CSV

- **Nombre:** CU-03: Importar estudiantes (CSV)
- **Actor(es):** Admin
- **Precondiciones:** El usuario debe tener rol de admin. Debe contar con un archivo CSV preparado.
- **Flujo principal:**
  1. El usuario navega a la sección "Estudiantes".
  2. Presiona el botón "Importar CSV".
  3. Se abre la pantalla de importación con instrucciones sobre el formato requerido.
  4. El usuario selecciona un archivo CSV con las columnas: `nombre`, `cedula`, `seccion`, `nivel`, `tipo` (Becado/Paga). Columnas opcionales: `correo`, `clave`.
  5. El sistema muestra una vista previa con el número de estudiantes válidos encontrados y los errores detectados (filas sin nombre o cédula).
  6. El usuario presiona "Importar".
  7. El sistema importa los estudiantes uno por uno, mostrando una barra de progreso con el porcentaje completado.
  8. Si se proporcionaron correo y clave para un estudiante, se crea su cuenta de Firebase Auth automáticamente.
  9. Al finalizar, se muestra el resumen: éxitos y fallos.
- **Resultado esperado:** Los estudiantes válidos se agregan a la colección `estudiantes`. La lista de estudiantes se actualiza automáticamente.

### CU-04: Escanear código QR para registrar asistencia

- **Nombre:** CU-04: Escanear QR de asistencia
- **Actor(es):** Admin, Profesor, Bibliotecario
- **Precondiciones:** El usuario debe tener una de las tres primeras secciones abiertas. El dispositivo debe tener cámara disponible. Los estudiantes deben tener sus credenciales QR generadas.
- **Flujo principal:**
  1. El usuario presiona el ícono de escáner o accede a la función QR/Escáner desde el sidebar.
  2. Se abre el modal del escáner con un botón "Iniciar cámara".
  3. El usuario presiona "Iniciar cámara". El sistema solicita permiso de acceso a la cámara.
  4. Se activa la cámara trasera del dispositivo y se comienza a escanear códigos QR automáticamente.
  5. Al detectar un código QR, el sistema extrae la cédula del estudiante del contenido del QR (formato: `nombre|cedula|seccion|nivel|tipo`).
  6. El sistema busca al estudiante en la lista cargada.
  7. Si lo encuentra:
     - Verifica si ya fue registrado hoy (anti-duplicados con ventana de 5 segundos).
     - Si no estaba registrado, crea un registro en la colección `asistencias` con fecha, hora, nombre, sección y tipo del estudiante.
     - Muestra el nombre del estudiante, su foto y si es becado (sin cobro) o de pago (monto cobrado).
     - Reproduce un sonido de confirmación ("beep" doble) y vibra el dispositivo.
  8. Si es un duplicado del mismo día, muestra "Ya registrado hoy" con sonido de advertencia.
  9. Si no se encuentra el estudiante, muestra un error con sonido de alerta.
  10. La lista del día se actualiza en tiempo real dentro del modal del escáner.
- **Resultado esperado:** La asistencia del estudiante queda registrada en Firestore con su cédula, fecha, hora y tipo. El total de asistentes del día se incrementa.

### CU-05: Registrar invitados externos

- **Nombre:** CU-05: Agregar invitado externo
- **Actor(es):** Admin, Profesor
- **Precondiciones:** El usuario debe tener rol de admin o profesor.
- **Flujo principal:**
  1. El usuario navega a la sección "Invitados" desde el sidebar.
  2. Se muestra el formulario de registro de invitados con los campos: nombre (obligatorio), cédula (opcional) y raciones (mínimo 1).
  3. El usuario ingresa el nombre del invitado.
  4. Opcionalmente, ingresa la cédula y ajusta el número de raciones.
  5. Presiona "Agregar".
  6. El sistema guarda el registro en la colección `invitados` con la fecha actual, el nombre del gestor que lo registró y la marca de tiempo.
  7. Se actualiza la lista de invitados del día mostrando el total de personas y raciones.
- **Resultado esperado:** El invitado aparece en la lista del día. Se actualizan los contadores de personas y raciones. Los invitados se resetean automáticamente al día siguiente.

### CU-06: Configurar el menú semanal

- **Nombre:** CU-06: Configurar menú semanal
- **Actor(es):** Admin, Profesor, Bibliotecario
- **Precondiciones:** El usuario debe tener una sesión activa.
- **Flujo principal:**
  1. El usuario navega a la sección "Menú Semanal" desde el sidebar.
  2. Se muestra una cuadrícula con los cinco días de la semana (lunes a viernes), cada uno con dos campos: desayuno y almuerzo.
  3. El día actual se resalta con un borde azul y una etiqueta "Hoy".
  4. Solo usuarios con rol de admin o profesor pueden editar los campos. Los bibliotecarios ven el menú en modo de solo lectura.
  5. El usuario ingresa los platillos para cada día y comida.
  6. Presiona "Guardar menú".
  7. El sistema guarda el plan en Firestore (documento `configuracion/menu`) y en localStorage como respaldo offline.
- **Resultado esperado:** El menú semanal queda guardado en Firestore. El Portal de Estudiantes puede consultarlo. La caché local permite ver el menú sin conexión.

### CU-07: Usar la inteligencia artificial para analizar la asistencia

- **Nombre:** CU-07: Consultar IA del comedor
- **Actor(es):** Admin
- **Precondiciones:** El usuario debe tener rol de admin. Debe haber datos históricos de asistencia en el sistema (mínimo recomendado: 3 días).
- **Flujo principal:**
  1. El usuario navega a la sección "Predicción" desde el sidebar.
  2. El sistema carga automáticamente los datos de asistencia de los últimos 28 días, el inventario de sobrantes y la lista de estudiantes.
  3. Se muestra una predicción local con la asistencia estimada para mañana y las raciones sugeridas.
  4. Se generan recomendaciones y análisis de desperdicio.
  5. Si hay una clave de API de Gemini configurada, el sistema envía los datos a Gemini para obtener recomendaciones detalladas en lenguaje natural.
  6. El usuario puede hacer preguntas en el chat de IA como: "¿Cuántos comieron esta semana?", "¿Qué día hay más asistencia?", "¿Cuántas raciones preparar mañana?"
  7. La IA responde con datos reales del sistema, analizando patrones, tendencias y comparaciones.
  8. Se aplica un límite de 60 consultas diarias a Gemini.
- **Resultado esperado:** El admin obtiene análisis, predicciones y recomendaciones para la toma de decisiones sobre el comedor.

### CU-08: Generar credencial QR de un estudiante

- **Nombre:** CU-08: Generar credencial QR
- **Actor(es):** Admin, Profesor
- **Precondiciones:** El usuario debe tener rol de admin o profesor. El estudiante debe estar registrado en el sistema.
- **Flujo principal:**
  1. El usuario accede a la función QR desde el sidebar o desde la lista de estudiantes.
  2. Se abre el modal de QR con un campo para ingresar la cédula.
  3. El usuario ingresa la cédula del estudiante y presiona "Generar".
  4. El sistema busca al estudiante por cédula.
  5. Se genera una credencial digital en formato tarjeta vertical (600×900px) con:
     - Código QR con los datos del estudiante (nombre, cédula, sección, nivel, tipo).
     - Foto del estudiante (si tiene; si no, se muestra la inicial del nombre).
     - Logo de ComeID.
     - Nombre completo, sección, nivel y tipo de estudiante.
  6. El sistema marca el QR como "generado" en Firestore con la fecha actual.
  7. Se muestran opciones para: descargar como PNG, descargar como PDF (tarjeta 60×90mm), imprimir, compartir por WhatsApp o correo.
  8. Se puede cambiar la foto arrastrando una imagen sobre la credencial o usando el botón "Cambiar foto".
- **Resultado esperado:** Se genera una credencial digital lista para imprimir o compartir. El estudiante puede usarla para el escaneo de asistencia.

### CU-09: Ver historial de asistencias por estudiante

- **Nombre:** CU-09: Consultar historial por estudiante
- **Actor(es):** Admin, Profesor
- **Precondiciones:** El usuario debe tener rol de admin o profesor. Debe haber datos de asistencia en el sistema.
- **Flujo principal:**
  1. El usuario navega a la sección "Historial por Estudiante" desde el sidebar.
  2. Se muestra un campo de búsqueda donde el usuario escribe el nombre o la cédula del estudiante.
  3. A medida que escribe, se muestran las coincidencias (máximo 8).
  4. El usuario selecciona el estudiante de la lista.
  5. Se establece un rango de fechas por defecto (desde la primera asistencia hasta hoy).
  6. El usuario puede ajustar las fechas "Desde" y "Hasta".
  7. El sistema muestra: días asistidos, días ausentes, días que el comedor operó, y cantidad total de comidas.
  8. Se despliega la lista detallada de cada día que el estudiante asistió.
- **Resultado esperado:** El usuario obtiene un resumen completo del historial de asistencia del estudiante seleccionado, con estadísticas y detalle diario.

### CU-10: Exportar asistencias a Excel o PDF

- **Nombre:** CU-10: Exportar reporte de asistencias
- **Actor(es):** Admin, Profesor
- **Precondiciones:** El usuario debe tener rol de admin o profesor. Debe haber asistencias registradas en la fecha consultada.
- **Flujo principal:**
  1. El usuario navega a la sección "Historial" o está en el escáner.
  2. Selecciona la fecha que desea exportar.
  3. Presiona el botón "Excel" o "PDF".
  4. **Para Excel:** El sistema genera un archivo `.xlsx` con: encabezado del instituto, fecha, ganancia del día, total atendidos, pagantes, becados, y una tabla con Hora, Nombre, Sección, Nivel y Tipo de cada asistencia. Se descarga automáticamente.
  5. **Para PDF:** El sistema genera un archivo `.pdf` con la misma información, con tabla formateada y colores institucionales.
- **Resultado esperado:** Se descarga un archivo con el reporte completo de asistencias de la fecha seleccionada, incluyendo la ganancia total del día.

### CU-11: Gestionar usuarios y roles

- **Nombre:** CU-11: Administrar roles de usuario
- **Actor(es):** Admin
- **Precondiciones:** El usuario debe tener rol de admin.
- **Flujo principal:**
  1. El usuario accede a "Gestión de Usuarios y Roles" desde el sidebar.
  2. El sistema carga la lista de todos los usuarios de la colección `usuarios`.
  3. Se muestra cada usuario con su nombre, correo, el rol actual y un selector desplegable.
  4. El usuario cambia el rol de un usuario seleccionando una opción: Admin, Profesor o Estudiante.
  5. Presiona "Guardar cambios".
  6. El sistema actualiza el campo `rol` en el documento del usuario en Firestore.
  7. Si el admin cambió su propio rol, se actualiza la sesión actual.
- **Resultado esperado:** El rol del usuario se actualiza inmediatamente. Los permisos del sidebar se ajustan según el nuevo rol.

### CU-12: Ver dashboard con resumen del día

- **Nombre:** CU-12: Consultar dashboard
- **Actor(es):** Admin, Profesor, Bibliotecario
- **Precondiciones:** El usuario debe tener una sesión activa.
- **Flujo principal:**
  1. Al iniciar sesión, se carga automáticamente el Dashboard.
  2. Se muestran tarjetas de resumen: becados, pagan, total de estudiantes, y cuántos comieron hoy.
  3. Se muestra la sección de "Ganancias del Día": ganancia bruta (estudiantes de pago × precio), cantidad de estudiantes que pagan, y número de invitados con sus raciones.
  4. Se muestran dos gráficas: ganancias de los últimos 7 días (línea) y asistencias de hoy por nivel (barras).
  5. El admin puede presionar "Limpiar Asistencias del Día" para eliminar todas las asistencias registradas (solo admin).
- **Resultado esperado:** El usuario tiene una vista general del estado actual del comedor con datos en tiempo real.

---

## 5. Casos de Uso del Portal de Estudiantes

### CU-E01: Registrarse en el Portal de Estudiantes

- **Nombre:** CU-E01: Auto-registro de estudiante
- **Actor(es):** Estudiante
- **Precondiciones:** El estudiante debe estar registrado previamente en la colección `estudiantes` del Panel de Administración por un administrador o profesor, con su cédula, nombre y datos completos.
- **Flujo principal:**
  1. El estudiante navega a `https://comeid-estudiantes.web.app/registro.html`.
  2. Completa el formulario con: cédula (9 dígitos, sin guiones), nombre completo, correo electrónico, contraseña (mínimo 6 caracteres) y confirmación de contraseña.
  3. Presiona "Registrarse".
  4. El sistema valida que la cédula tenga exactamente 9 dígitos.
  5. El sistema crea la cuenta en Firebase Auth.
  6. Crea el perfil del usuario en la colección `usuarios` con rol "estudiante".
  7. Busca en la colección `estudiantes` un registro que coincida con la cédula y el nombre ingresados (normalizado).
  8. Si el registro ya tiene un correo asignado, valida que coincida con el ingresado.
  9. Si el registro no tiene correo asignado, valida que el correo sea institucional (`@ctpliberia.ed.cr`).
  10. Si todo es correcto, vincula la cuenta al registro del estudiante actualizando `uid`, `correo` en `estudiantes` y `estudiantesId` en `usuarios`.
  11. Se redirige al estudiante al dashboard.
- **Resultado esperado:** El estudiante queda registrado y vinculado a su cuenta. Puede acceder a todas las secciones del Portal de Estudiantes.
- **Excepciones:**
  - Si la cédula no se encuentra en el sistema: "No encontramos tu registro en el sistema del CTP de Liberia."
  - Si la cédula ya está vinculada a otra cuenta: "Esa cédula ya está vinculada a otra cuenta."
  - Si el correo no coincide con el ya asignado: "Esa cédula ya está vinculada a un correo."
  - Si no usa correo institucional sin tener correo previo: "Para crear tu cuenta usa tu correo institucional @ctpliberia.ed.cr."

### CU-E02: Ver el dashboard personal

- **Nombre:** CU-E02: Consultar dashboard del estudiante
- **Actor(es):** Estudiante
- **Precondiciones:** El estudiante debe haber iniciado sesión en el Portal de Estudiantes.
- **Flujo principal:**
  1. Al iniciar sesión, se carga el dashboard con un saludo personalizado.
  2. Se muestran tarjetas de acceso rápido:
     - **Mi información:** nombre y cédula (enlace a perfil).
     - **Mi comedor:** estado de beca, cantidad de consumos y días distintos que asistió (enlace a comedor).
     - **Mi biblioteca:** libros prestados, vencidos y próxima fecha de devolución (enlace a biblioteca).
     - **Mi código QR:** credencial estudiantil (enlace a QR).
  3. Si el estudiante tiene reservas activas de biblioteca, se muestran debajo de las tarjetas.
- **Resultado esperado:** El estudiante tiene una vista resumida de su actividad en comedor y biblioteca, con acceso rápido a cada sección.

### CU-E03: Consultar menú y asistencia personal

- **Nombre:** CU-E03: Ver comedor
- **Actor(es):** Estudiante
- **Precondiciones:** El estudiante debe haber iniciado sesión.
- **Flujo principal:**
  1. El estudiante accede a la sección "Comedor" (desde el dashboard o la barra de navegación).
  2. Se muestra el menú semanal (lunes a viernes) cargado desde Firestore (`configuracion/menu`).
  3. Se muestran las estadísticas personales de asistencia: cantidad de consumos, días distintos que asistió.
  4. Se despliega el historial personal de asistencias con fecha y hora de cada registro.
- **Resultado esperado:** El estudiante conoce el menú de la semana y puede revisar cuántas veces ha asistido al comedor.

### CU-E04: Consultar préstamos y reservas de biblioteca

- **Nombre:** CU-E04: Ver biblioteca personal
- **Actor(es):** Estudiante
- **Precondiciones:** El estudiante debe haber iniciado sesión.
- **Flujo principal:**
  1. El estudiante accede a la sección "Biblioteca".
  2. Se muestran tres tarjetas resumen: libros prestados actualmente, cantidad vencidos, y próxima fecha de devolución.
  3. Si hay préstamos vencidos, se muestra una alerta roja con la cantidad.
  4. Si hay préstamos próximos a vencer (3 días o menos), se muestra una alerta amarilla.
  5. Se despliega la lista de "Mis préstamos activos" con título del libro, fechas de préstamo y vencimiento, estado (semaforo) y días restantes.
  6. Se despliega "Mis reservas" con el estado de cada una (disponible o en espera).
  7. Se muestra el "Historial de préstamos" con todos los préstamos anteriores y su estado final.
- **Resultado esperado:** El estudiante tiene visibilidad completa de sus préstamos activos, reservas e historial de biblioteca.

### CU-E05: Ver código QR personal

- **Nombre:** CU-E05: Consultar código QR
- **Actor(es):** Estudiante
- **Precondiciones:** El estudiante debe haber iniciado sesión. El estudiante debe tener un registro en la colección `estudiantes` con código QR generado.
- **Flujo principal:**
  1. El estudiante accede a la sección "QR" (desde el dashboard o la barra de navegación).
  2. El sistema carga el código QR del estudiante desde su registro en Firestore.
  3. Se muestra la credencial digital en formato tarjeta con su foto, nombre, cédula, sección y código QR.
  4. El código QR contiene los datos en formato `nombre|cedula|seccion|nivel|tipo`.
  5. El estudiante puede mostrar esta credencial en pantalla para que sea escaneada en el comedor.
- **Resultado esperado:** El estudiante puede presentar su código QR en el comedor para registrar su asistencia.

---

## 6. Seguridad del Sistema

### 6.1 Autenticación

- Todas las operaciones requieren un usuario autenticado en Firebase Auth.
- El inicio de sesión se realiza con correo electrónico y contraseña.
- Los tokens de sesión se gestionan automáticamente por Firebase.

### 6.2 Control de acceso (Firestore Rules)

- **Gestores** (admin, profesor, bibliotecario): acceso de lectura y escritura a la mayoría de colecciones.
- **Admin** (exclusivo): crear/eliminar estudiantes, gestionar roles, eliminar asistencias, eliminar invitados, configuración avanzada.
- **Estudiantes**: solo pueden leer su propia información (por `uid` o `cedula`). Pueden escribir únicamente los campos `uid` y `correo` para vincular su cuenta.
- **Datos protegidos**: la colección `usuarios` no permite eliminación. Las notificaciones solo pueden marcarse como leídas. Las recomendaciones de IA solo son escritas por el servicio de Firebase Admin.

### 6.3 Prevención de escalada de privilegios

- Un usuario auto-registrado solo puede crear su documento de perfil con rol fijo `"estudiante"`.
- No puede modificar su propio rol ni el de otros usuarios.
- Las reglas validan que el correo proporcionado coincida con el token de Firebase Auth.
- La vinculación de `estudiantesId` solo puede hacerse una vez (de vacío a un valor).

### 6.4 Datos personales

- El sistema trabaja con cédulas y nombres reales de estudiantes del CTP de Liberia.
- Las fotos se almacenan como base64 en Firestore.
- La IA solo trabaja con datos agregados y estadísticos; no revela nombres ni datos personales individuales.

---

*Manual generado para el sistema ComeID (Integra ID) — CTP de Liberia, Costa Rica.*
