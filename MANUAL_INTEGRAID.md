# Manual de Uso — IntegraID (Plataforma General)

**Integra ID** es la plataforma integral del **CTP de Liberia, Guanacaste — Costa Rica** para la gestión digital del comedor estudiantil y de la biblioteca.

---

## 1. ¿Qué es IntegraID?

IntegraID es un **sistema único** que reúne, en un solo inicio de sesión y una sola base de datos, todas las herramientas digitales del centro educativo relacionadas con el comedor y la biblioteca. Se compone de **tres módulos**:

| Módulo | ¿Qué hace? | Manual específico |
|---|---|---|
| **ComeID** | Gestión del comedor estudiantil | `Manual de ComeID` |
| **Bibliogest** | Gestión de la biblioteca | `Manual de Bibliogest` |
| **Portal de Estudiantes** | Auto-servicio del estudiante | `Manual del Panel de Estudiantes` |

Las tres partes **comparten los mismos datos**: si el personal registra a un estudiante en el comedor, ese estudiante aparece en la biblioteca y puede entrar a su portal. No hay que cargar datos dos veces.

---

## 2. Componentes de la plataforma

### 2.1 ComeID — Módulo del comedor

Permite al personal administrar:

- El **registro de estudiantes** y sus **cuentas de acceso** (con correo y contraseña).
- El **control de asistencia diaria** por **escaneo de código QR**.
- El **menú semanal** (lunes a viernes), con ayuda de **inteligencia artificial**.
- Los **invitados externos** que consumen en el comedor.
- Los **historiales** de consumo por día y por estudiante.
- La **predicción de demanda** para planificar compras.
- La exportación de **reportes en Excel y PDF**.

### 2.2 Bibliogest — Módulo de la biblioteca

Permite al bibliotecario administrar:

- El **catálogo de libros** (título, autor, categoría, código, ejemplares).
- Los **socios de la biblioteca** (estudiantes que la usan).
- Los **préstamos**, **devoluciones** y **reservas** de libros.
- Las **alertas** de préstamos vencidos.
- La **ubicación** de los materiales (mapa de la biblioteca).
- **Reportes** y **recomendaciones por inteligencia artificial**.

> IntegraID permite que la biblioteca funcione de forma **independiente** del comedor: un estudiante puede comer en el comedor o no, pero aun así usar la biblioteca.

### 2.3 Portal de Estudiantes

Es la aplicación para el **estudiante**:

- Ver el **menú del día** y su propia **asistencia** al comedor.
- Ver sus **préstamos** y **reservas** en la biblioteca.
- Presentar su **credencial QR**.
- Recibir **notificaciones** del colegio.
- **Registrarse** por primera vez vinculando su cédula y su nombre.

---

## 3. Cómo acceder a IntegraID

### 3.1 Direcciones (URLs)

| Aplicación | Dirección | ¿Quién entra? |
|---|---|---|
| Panel del personal (ComeID + Bibliogest) | `https://comeid-670b9.web.app` | Administradores, profesores, bibliotecarios |
| Portal de estudiantes | `https://comeid-estudiantes.web.app` | Estudiantes |

### 3.2 Navegador recomendado

Google Chrome, Microsoft Edge o Firefox actualizados, en computadora o teléfono. Se necesita **cámara** para el escaneo de QR.

### 3.3 Iniciar sesión

1. Abra la dirección del panel.
2. Escriba su **correo** y su **contraseña**.
3. Pulse **Iniciar sesión**.
4. Si olvidó su contraseña, use **¿Olvidaste tu contraseña?** y siga las instrucciones que llegan a su correo.

### 3.4 Elegir el sistema (ComeID o Bibliogest)

Al entrar al panel verá una pantalla de **selección de sistema** con dos opciones:

- **ComeID (Comedor)** → abre el panel de gestión del comedor.
- **Bibliogest (Biblioteca)** → abre el panel de gestión de la biblioteca.

También puede cambiar de un sistema al otro desde el menú lateral (opción **Selector de app**) sin cerrar la sesión.

---

## 4. Roles y permisos en toda la plataforma

| Rol | ComeID | Bibliogest | Portal estudiantes |
|---|---|---|---|
| **Admin** | Todo | Todo | — |
| **Profesor** | Comedor (no roles ni configuración) | Solo lectura de catálogo | — |
| **Bibliotecario** | Solo lectura de menú e historial | Todo | — |
| **Estudiante** | — | — | Su información personal |

El rol lo asigna **únicamente el administrador** desde la sección *Gestión de Usuarios y Roles* (ver manual de ComeID).

---

## 5. Lo que se puede hacer en cada módulo (resumen)

### En ComeID (comedor)
Registrar y matricular estudiantes → generar QR → escanear su asistencia cada día → organizar invitados → planificar el menú de la semana → predecir cuántos comerán → exportar reportes.

### En Bibliogest (biblioteca)
Registrar libros → dar de alta socios → prestar y devolver → apartar reservas → avisar de vencidos → ubicar libros → recomendar lecturas con IA → reportar.

### En el Portal de Estudiantes
Registrarse con su cédula → ver menú y asistencia → ver préstamos y reservas → mostrar su QR → leer notificaciones.

---

## 6. Seguridad de la plataforma

- **Acceso por roles:** nadie puede hacer nada que su rol no permita; los estudiantes solo ven su propia información.
- **Base de datos protegida:** todas las lecturas y escrituras pasan por reglas de seguridad de Firestore, verificadas del lado del servidor de Firebase.
- **Cabeceras de seguridad web (CSP):** restringen qué contiene y de dónde se cargan los recursos; sin ejecución de código dinámico.
- **Sin claves privadas en el código:** las claves de servicios (por ejemplo, la de la inteligencia artificial) no están escritas en el código fuente.
- **Repositorio privado:** el código se mantiene en un repositorio privado de GitHub con `.gitignore` para credenciales.

---

## 7. Soporte y ayuda

- En cada panel existe el botón de **Ayuda** (ícono de interrogación) que muestra los pasos principales.
- En caso de dudas o errores, consulte el manual específico del módulo o contacte al **administrador del sistema**.

---

## 8. Anexo — Ficha técnica rápida

| Dato | Valor |
|---|---|
| Nombre comercial | Integra ID |
| Módulo de comedor | ComeID |
| Módulo de biblioteca | Bibliogest |
| Portal de estudiantes | ComeID Estudiantes |
| Tecnología | Firebase (Auth, Firestore, Hosting) + Google Gemini (IA) |
| Panel del personal | `https://comeid-670b9.web.app` |
| Portal de estudiantes | `https://comeid-estudiantes.web.app` |
| Idiomas de la interfaz | Español, inglés, portugués, francés, alemán |
| Menú del comedor | Lunes a viernes |