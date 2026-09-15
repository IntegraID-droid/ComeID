# Manual de Uso Detallado — ComeID (Integra ID)

Sistema integrado de gestión de **comedor estudiantil y biblioteca**
**CTP de Liberia, Guanacaste — Costa Rica**
Versión del sistema: 1.12.0

---

## 1. Introducción

### 1.1 ¿Qué es ComeID?

ComeID (Integra ID) es una plataforma web que centraliza la gestión del **comedor estudiantil** y de la **biblioteca** del Colegio Técnico Profesional de Liberia. Permite al personal del centro educativo:

- Administrar el registro de estudiantes y sus cuentas de acceso.
- Controlar la asistencia diaria al comedor mediante **escaneo de códigos QR**.
- Planificar el **menú semanal** (de lunes a viernes) con ayuda de **inteligencia artificial**.
- Registrar **invitados externos** que consumen en el comedor.
- Gestionar la **biblioteca**: catálogo de libros, préstamos, reservas y devoluciones.
- Enviar **notificaciones** a los estudiantes.
- Generar **reportes** en Excel y PDF.
- Dar a los estudiantes un **portal de auto-servicio** para ver su menú, su asistencia, sus préstamos y su credencial QR.

### 1.2 ¿Cómo está construido?

La plataforma está desarrollada con **Firebase** (de Google):

| Componente | Uso |
|---|---|
| **Firebase Auth** | Inicio de sesión con correo y contraseña |
| **Cloud Firestore** | Base de datos (reglas de seguridad por rol) |
| **Firebase Hosting** | Publicación de las dos aplicaciones web |
| **Google Gemini (IA)** | Asistencia para crear menús y predicción de demanda |
| **Firebase Storage** | Almacenamiento (actualmente cerrado por seguridad) |

Las dos aplicaciones son **frontend** (sin servidor propio): toda la lógica se ejecuta en el navegador y el acceso a los datos está protegido por las **reglas de seguridad de Firestore**. Esto significa que nadie puede leer ni modificar información a la que no tenga permiso, aunque lo intente directamente contra la base de datos.

### 1.3 Las dos aplicaciones

| Aplicación | URL | Usuarios |
|---|---|---|
| **Panel de Administración** | `https://comeid-670b9.web.app` | Personal del centro (admin, profesor, bibliotecario) |
| **Portal de Estudiantes** | `https://comeid-estudiantes.web.app` | Estudiantes registrados |

Ambas comparten la misma base de datos: lo que registra el panel se ve en el portal y viceversa.

---

## 2. Roles y Permisos

El sistema define **tres roles de gestores** y un rol de **estudiante**. Cada rol solo ve las secciones que le corresponden.

| Rol | ¿Qué puede hacer? |
|---|---|
| **admin** (Administrador) | Acceso total: estudiantes, asistencia, invitados, menú, predicción IA, roles, configuración, exportar, QR. |
| **profesor** (Profesor) | Estudiantes, asistencia, historial, invitados, menú, QR, exportar. No gestiona roles ni configuración. |
| **bibliotecario** | Biblioteca completa más el menú y el historial. No gestiona estudiantes. |
| **estudiante** | Solo su portal personal: su menú, su asistencia, sus préstamos, sus notificaciones y su QR. |

> **Importante:** un estudiante **solo** puede ver su propia información. Aunque conozca el correo o la cédula de otro compañero, la base de datos lo rechaza.

---

## 3. Acceso al Sistema

### 3.1 Navegadores recomendados

- **Google Chrome**, **Microsoft Edge** o **Firefox**, en sus versiones actualizadas (escritorio y móvil).
- La cámara del dispositivo se usa para el **escaneo de QR** y el registro con foto.

### 3.2 Para el personal (Panel de Administración)

1. Abra `https://comeid-670b9.web.app`.
2. Escriba el **correo** y la **contraseña** que le entregó el administrador.
3. Pulse **Iniciar sesión**.

Si se olvida la contraseña, use **¿Olvidaste tu contraseña?** en la pantalla de inicio.

### 3.3 Para el estudiante (Portal de Estudiantes)

1. Abra `https://comeid-estudiantes.web.app`.
2. Ingrese con el correo institucional y contraseña que creó al registrarse (ver CU-E01).
3. Si aún no tiene cuenta, pulse **Regístrate aquí**.

---

# 4. Casos de Uso del Panel de Administración

## CU-01: Iniciar sesión

- **Actor(es):** admin, profesor, bibliotecario.
- **Precondiciones:** el administrador debe haber creado la cuenta del usuario o haberle asignado un rol.
- **Flujo principal:**
  1. Abra el panel en `https://comeid-670b9.web.app`.
  2. Introduzca su correo.
  3. Introduzca su contraseña (use el ícono del ojo para mostrarla si la necesita).
  4. Pulse **Iniciar sesión**.
  5. El sistema lo lleva al **panel de control**.
- **Resultado esperado:** se muestra el panel con las secciones según el rol del usuario. Si el correo o la contraseña son incorrectos, aparece un mensaje de error y se vuelve a pedir el dato.

---

## CU-02: Consultar el panel de control (Dashboard)

- **Actor(es):** admin, profesor, bibliotecario.
- **Flujo principal:**
  1. Inicie sesión (CU-01).
  2. El menú lateral muestra la opción **Inicio / Dashboard**.
  3. En las tarjetas vea los indicadores: número de estudiantes registrados, asistencias del día, estudiantes que comieron hoy, invitados del día, libros prestados o por vencer, entre otros.
- **Resultado esperado:** una vista resumida del estado del comedor y la biblioteca en tiempo real.

---

## CU-03: Ver y buscar estudiantes

- **Actor(es):** admin, profesor.
- **Precondiciones:** tener rol admin o profesor.
- **Flujo principal:**
  1. En el menú lateral pulse **Estudiantes**.
  2. Use la **casilla de búsqueda** para filtrar por nombre, cédula o sección.
  3. La lista se actualiza mientras escribe.
  4. Cada fila muestra: nombre, cédula, sección, nivel, tipo (Becado/Pagado) y acciones (editar, QR, eliminar).
- **Resultado esperado:** la lista de estudiantes filtrada y con acceso a sus acciones.

---

## CU-04: Registrar un estudiante nuevo con cuenta de acceso

- **Actor(es):** admin, profesor.
- **Precondiciones:** tener el expediente del estudiante (nombre, cédula, sección, nivel, tipo de beca) y, si se le dará cuenta, un correo y una contraseña.
- **Flujo principal:**
  1. Pulse **Estudiantes** → botón **Nuevo estudiante**.
  2. Complete los datos: nombre completo, cédula, sección, nivel y tipo (Becado/Pagado).
  3. Opcionalmente agregue una **foto** con la cámara o desde un archivo.
  4. Si desea crear una **cuenta de acceso**: marque la opción de crear cuenta e introduzca el correo y la contraseña del estudiante.
  5. Pulse **Guardar**.
  6. El sistema crea el registro del estudiante y, de forma automática:
     - genera su **código QR** de identificación;
     - crea su cuenta de acceso al portal, si se pidió;
     - crea su documento de perfil en la colección `usuarios`;
     - lo deja listo para escanear en el comedor.
- **Variaciones/errores comunes:**
  - Si el correo ya está en uso por otra cuenta, aparece un mensaje: es necesario usar otro correo.
  - Si la cédula ya existe, el sistema avisa para evitar duplicados.
- **Resultado esperado:** el estudiante queda registrado, con QR, y puede iniciar sesión en el portal.

---

## CU-05: Editar los datos de un estudiante

- **Actor(es):** admin, profesor.
- **Flujo principal:**
  1. En **Estudiantes**, localice al estudiante (CU-03).
  2. Pulse el botón **Editar** de su fila.
  3. Modifique los campos necesarios (nombre, sección, nivel, tipo, correo, foto).
  4. Pulse **Guardar**.
- **Resultado esperado:** los datos quedan actualizados en el comedor, la biblioteca y el portal del estudiante.

---

## CU-06: Eliminar un estudiante

- **Actor(es):** admin.
- **Precondiciones:** tener rol admin. Esta acción **no se puede deshacer**.
- **Flujo principal:**
  1. En **Estudiantes**, localice al estudiante.
  2. Pulse el botón **Eliminar**.
  3. Confirme la acción en la ventana de aviso.
- **Resultado esperado:** el estudiante sale de la lista y pierde el acceso al comedor.
- **Nota técnica (limitación actual):** la cuenta de correo de Firebase puede seguir existiendo en el proveedor de autenticación aunque el estudiante se elimine. Para liberar ese correo (por si se quiere reutilizar), un administrador debe eliminarla en la consola de Firebase → Authentication → Users.

---

## CU-07: Importar estudiantes desde un archivo CSV o Excel

- **Actor(es):** admin, profesor.
- **Flujo principal:**
  1. En **Estudiantes**, pulse el botón **Importar**.
  2. Seleccione el archivo (CSV compatible con Excel).
  3. El sistema muestra la vista previa de los registros detectados.
  4. Revise que los datos se lean correctamente (nombre, cédula, sección, nivel, tipo).
  5. Confirme la importación.
  6. Los registros exitosos se crean; los que tengan errores (cédula repetida, datos incompletos) se listan para corregir.
- **Resultado esperado:** los estudiantes del archivo quedan registrados masivamente con sus QR generados.
- **Variación en la biblioteca:** la biblioteca tiene su propio **Importar Excel/CSV** para **libros** (clave: código del ejemplar) y **socios** (clave: cédula), con vista previa de filas nuevas/actualizadas (ver CU-13 y CU-14).

---

## CU-08: Controlar la asistencia al comedor (escaneo QR)

- **Actor(es):** admin, profesor.
- **Precondiciones:** el estudiante debe estar registrado y tener su QR; el equipo debe tener cámara.
- **Flujo principal:**
  1. En el menú lateral pulse **Escanear QR**.
  2. Permita el acceso a la cámara (botón **Permitir**) cuando el navegador lo pida.
  3. Dirija la cámara al **código QR** de la credencial o del móvil del estudiante.
  4. Al detectarlo, el sistema identifica al estudiante y **registra su asistencia en automático**.
  5. En pantalla se confirma el nombre del estudiante; si el comedor está habilitado por turno, se valida el turno correspondiente.
  6. Use los botones de exportación para guardar la **lista del día** en Excel, PDF o CSV.
- **Resultado esperado:** cada estudiante escaneado queda marcado como asistente del día, sin colas ni listas de papel.

---

## CU-09: Generar y entregar credenciales QR

- **Actor(es):** admin, profesor, bibliotecario.
- **Flujo principal:**
  1. En el menú abra **Generar QR** (o desde la fila de un estudiante).
  2. Seleccione el estudiante o grupo.
  3. Pulse **Generar**.
  4. El sistema muestra el/los código(s) QR listos para **imprimir** o descargar.
- **Resultado esperado:** cada estudiante tiene una credencial imprimible con su QR único para la fila del comedor.

---

## CU-10: Gestionar invitados externos en el comedor

- **Actor(es):** admin, profesor.
- **Precondiciones:** el comedor maneja una lista manual de invitados (personas que no son estudiantes del CTP).
- **Flujo principal:**
  1. En el menú lateral pulse **Invitados**.
  2. Pulse **Nuevo invitado**.
  3. Registre los datos: nombre, y opcionalmente cédula, motivo, frecuencia (diario/una vez) y observaciones.
  4. Pulse **Guardar**.
  5. La lista de invitados del día se muestra y se puede marcar cuando asisten.
  6. Use las acciones de la lista para editar o eliminar invitados ya no vigentes.
- **Resultado esperado:** control de quién entra al comedor sin ser estudiante, con trazabilidad de visitas.

---

## CU-11: Configurar el menú semanal (lunes a viernes)

- **Actor(es):** admin, profesor, bibliotecario.
- **Flujo principal:**
  1. En el menú pulse **Menú Semanal**.
  2. Para cada día de lunes a viernes se pueden definir los **desayunos** y los **almuerzos**.
  3. Escriba los platillos deseados (por ejemplo "Arroz con pollo y ensalada").
  4. Pulse **Guardar menú**.
  5. El menú queda publicado y se mostrará en el **portal de estudiantes** en el día correspondiente.
  6. (Opcional) Use el botón de **IA** para que el sistema sugiera menús balanceados: en la ventana de IA escriba la petición (por ejemplo cantidad de personas, presupuesto) y elija qué sugerencia usar.
- **Resultado esperado:** los estudiantes ven cada día qué se sirve en el comedor, y el personal tiene el plan semanal guardado.
- **Nota:** el menú se gestiona solo de **lunes a viernes**; sábados y domingos no se configuran.

---

## CU-12: Usar la predicción de demanda (inteligencia artificial)

- **Actor(es):** admin (solo).
- **Precondiciones:** clave de Gemini configurada por el administrador en el panel de IA.
- **Flujo principal:**
  1. En el menú pulse **Predicción**.
  2. El sistema analiza el historial de asistencias y menús.
  3. Consulte la proyección de cuántos estudiantes podrían asistir (por ejemplo, el próximo día o semana).
  4. Use esa estimación para comprar y preparar los alimentos adecuados.
- **Resultado esperado:** mejor planificación de compras y menos desperdicio de comida.
- **Nota técnica:** la IA se conecta desde el navegador usando la clave configurada en el panel; la clave **no está escrita en el código fuente** de la aplicación (ver sección 6).

---

## CU-13: Gestionar el catálogo de libros (biblioteca)

- **Actor(es):** bibliotecario, admin.
- **Flujo principal:**
  1. Desde el **selector de aplicación** del panel, pulse **Biblioteca**.
  2. En **Catálogo**, pulse **Nuevo libro**.
  3. Registre título, autor, categoría, ISBN, ubicación y número de ejemplares.
  4. Pulse **Guardar**.
  5. Use la búsqueda para localizar libros y las acciones para editar o eliminar títulos.
  6. **(Alternativa masiva)** Pulse **Importar Excel/CSV**, elija el archivo (`.xlsx`, `.csv` o `.txt`), revise la **vista previa** de filas y pulse **Importar**; el **código del ejemplar** es la clave: si existe se actualiza, si no se crea.
- **Resultado esperado:** la biblioteca tiene su catálogo digitalizado y consultable desde el portal del estudiante.
- **Disponibilidad:** el sistema muestra cuántos ejemplares hay **disponibles** y lo recalcula al prestar o devolver; el estudiante lo ve en su portal (etiqueta *Disponible (n)*). Los libros con todos los ejemplares prestados quedan **agotados** y no admiten más préstamos.

---

## CU-14: Registrar préstamos y devoluciones (biblioteca)

- **Actor(es):** bibliotecario, admin.
- **Flujo principal:**
  1. En **Préstamos**, pulse **Nuevo préstamo**.
  2. Seleccione el estudiante (socio de biblioteca) y el libro del catálogo.
  3. El sistema calcula la **fecha de vencimiento** automáticamente.
  4. Pulse **Guardar**. El libro queda marcado como prestado, disminuye la **disponibilidad** y aparece en "Mis préstamos" del estudiante.
  5. Para la **devolución**, localice el préstamo activo y pulse **Devolver**. La disponibilidad del libro vuelve a aumentar.
- **Resultado esperado:** trazabilidad completa de quién tiene cada libro y cuándo debe devolverlo.
- **Variación con escáner QR (recomendado):** en el formulario de préstamo pulse **Escanear libro** y apunte al QR del ejemplar. El sistema responde con **sonido de confirmación**, vibración y mensaje en pantalla (verde = correcto, rojo = error). Si el libro no existe, está agotado o no es válido, se muestra el error sin generar el préstamo. Al devolver también puede escanear el QR: si el socio tiene un solo préstamo activo se devuelve en automático; si tiene varios, se elige cuál devolver.
- **Variación:** los **socios** de la biblioteca se gestionan desde la sección correspondiente (pueden incluir estudiantes que usan la biblioteca aunque no pertenezcan al comedor), y también pueden **importarse desde Excel/CSV** (clave: cédula).

---

## CU-15: Gestionar reservas de libros

- **Actor(es):** bibliotecario, admin (crear/cancelar); el estudiante reserva desde su portal.
- **Flujo principal:**
  1. En **Reservas** o desde el portal del estudiante, se solicita un libro que está prestado o agotado.
  2. Cuando el libro se devuelve, el bibliotecario atiende la reserva por orden.
  3. El bibliotecario puede **cancelar** reservas vencidas.
- **Resultado esperado:** los estudiantes pueden apartar un título aunque esté prestado.

---

## CU-16: Enviar notificaciones a los estudiantes

- **Actor(es):** gestores (admin, profesor, bibliotecario).
- **Flujo principal:**
  1. En la sección de notificaciones de la aplicación correspondiente, pulse **Nueva notificación**.
  2. Escriba el título y el mensaje.
  3. Elija el destinatario: **todos**, un estudiante concreto, o un grupo.
  4. Pulse **Enviar**.
- **Resultado esperado:** los estudiantes ven el aviso en su portal (sección **Notificaciones**).

---

## CU-17: Gestionar usuarios y roles

- **Actor(es):** admin (solo).
- **Precondiciones:** tener rol admin para ver la sección.
- **Flujo principal:**
  1. En el menú lateral pulse **Gestión de Usuarios y Roles**.
  2. Aparece la lista de todas las cuentas con su correo y rol actual.
  3. Para cada cuenta, seleccione el rol deseado en el desplegable: **admin**, **profesor** o **estudiante**.
  4. Pulse **Guardar cambios**.
  5. El cambio de permisos es **inmediato** y la aplicación se actualiza.
- **Resultado esperado:** solo el administrador puede dar o quitar privilegios.
- **Ejemplo de uso:** para entregar una cuenta de administrador a un docente, se crea (o se localiza) su cuenta y se selecciona el rol **admin**, luego **Guardar cambios**.

---

## CU-18: Exportar datos a Excel y PDF

- **Actor(es):** admin, profesor (según la sección).
- **Flujo principal:**
  1. En las secciones con reportes (Estudiantes, Escáner del día, Historial) use el menú **Exportar**.
  2. Elija **Excel** (`.xlsx`) o **PDF**.
  3. El archivo se descarga al equipo.
- **Resultado esperado:** reportes listos para presentar o archivar.

---

## CU-19: Configuración general del sistema

- **Actor(es):** admin (solo).
- **Flujo principal:**
  1. En el menú pulse **Configuración**.
  2. Ajuste las opciones disponibles: idioma de la interfaz (español, inglés, portugués, francés, alemán), datos del comedor/biblioteca, turnos, y la **clave de acceso a la IA de Gemini** para habilitar menús y predicción.
  3. Pulse **Guardar**.
- **Resultado esperado:** el sistema muestra la versión correcta y el comportamiento según lo configurado.
- **Nota:** la configuración es la misma para el comedor y la biblioteca porque comparten la base de datos.

---

## CU-20: Consultar el historial de actividades (auditoría)

- **Actor(es):** gestores.
- **Flujo principal:**
  1. En la aplicación correspondiente abra la sección **Actividad**.
  2. Consulte el registro de eventos: altas, bajas, cambios de rol, préstamos, etc.
- **Resultado esperado:** trazabilidad de las acciones más importantes del sistema.

---

# 5. Casos de Uso del Portal de Estudiantes

## CU-E01: Registrarse y vincular la cuenta

- **Actor(es):** estudiante.
- **Precondiciones:** el estudiante debe existir en el registro del comedor del CTP (por su cédula y nombre).
- **Flujo principal:**
  1. Abra `https://comeid-estudiantes.web.app` y pulse **Regístrate aquí**.
  2. Escriba su **correo institucional** (dominio `@ctpliberia.ed.cr`), una **contraseña**, su **cédula** y su **nombre completo** tal como está registrado.
  3. Pulse **Registrarme**.
  4. El sistema valida que la cédula y el nombre coincidan con su registro oficial.
  5. Si el registro aún no tiene correo asignado, exige el correo institucional (para que nadie más pueda reclamar la cuenta).
  6. Al coincidir, la cuenta queda **vinculada** a su expediente y se abre su portal.
- **Variaciones/errores comunes:**
  - "Registro no encontrado": la cédula o el nombre no coinciden con el padrón del comedor.
  - "Correo ya asignado": esa cédula ya fue vinculada con otro correo; pida ayuda a la administración.
  - "Ya se usa ese correo": alguien creó una cuenta con ese correo; use otro o recupere la contraseña.
- **Resultado esperado:** el estudiante puede iniciar sesión y usar todas sus secciones personales.

---

## CU-E02: Iniciar sesión en el portal

- **Actor(es):** estudiante registrado.
- **Flujo principal:**
  1. Abra `https://comeid-estudiantes.web.app`.
  2. Escriba su correo y contraseña.
  3. Pulse **Iniciar sesión**.
  4. Si olvidó la contraseña, use **¿Olvidaste tu contraseña?** para restablecerla por correo.
- **Resultado esperado:** entrada al portal con su información personal.

---

## CU-E03: Consultar el inicio (Dashboard del estudiante)

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Al entrar, vea el **menú de hoy**, sus **reservas activas**, su **asistencia reciente** y los avisos.
  2. Toque cada tarjeta para ir a la sección completa.
- **Resultado esperado:** resumen personal al día.

---

## CU-E04: Ver el menú y su asistencia (Comedor)

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Abra la sección **Comedor**.
  2. Consulte el **menú de la semana** (lunes a viernes).
  3. Vea su **asistencia**: cuántos días ha comido en los últimos 30 días y el desglose por día de la semana.
  4. Consulte su **historial de consumos**.
- **Resultado esperado:** el estudiante sabe qué se sirve y cuántas veces ha asistido.

---

## CU-E05: Consultar catálogo, préstamos y reservas (Biblioteca)

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Abra la sección **Biblioteca**.
  2. Consulte el **catálogo disponible** de la biblioteca (libros y materiales como calculadoras o reglas): use el **buscador** para filtrar y vea la etiqueta **Disponible (n)** con los ejemplares disponibles ahora mismo.
  3. Vea **Mis préstamos activos**: qué libros tiene y cuándo vencen.
  4. Vea **Mis reservas**: libros que apartó y su estado.
  5. Consulte el **historial de préstamos** realizados.
  6. Puede **reservar** un libro que esté prestado o agotado desde el catálogo.
- **Resultado esperado:** el estudiante encuentra qué hay disponible y controla sus materiales de la biblioteca.

---

## CU-E06: Presentar su credencial QR

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Abra la sección **QR**.
  2. Se muestra su código QR personal.
  3. Preséntelo en el comedor para ser escaneado.
- **Resultado esperado:** asistencia registrada sin necesidad de carné físico.
- **Sugerencia:** pantalla a máximo brillo y guardar la imagen para usarla sin internet.

---

## CU-E07: Consultar notificaciones

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Abra la sección **Notificaciones**.
  2. Vea los avisos generales y los dirigidos a usted.
  3. Marque como leídas las que corresponda.
- **Resultado esperado:** el estudiante está al día con los comunicados del comedor y la biblioteca.

---

## CU-E08: Gestionar su perfil

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Abra la sección **Perfil**.
  2. Revise sus datos personales y el estado de su comer.
  3. Consulte la información de su cuenta (correo asociado).
- **Resultado esperado:** verificación de que sus datos son correctos.

---

## CU-E09: Configurar idioma y tema del portal

- **Actor(es):** estudiante.
- **Flujo principal:**
  1. Abra la sección **Configuración**.
  2. Elija el **idioma** de la interfaz.
  3. Cambie el **tema** (claro/oscuro) si está disponible.
  4. Guarde los cambios.
- **Resultado esperado:** el portal se muestra según sus preferencias en su dispositivo.

---

# 6. Seguridad del Sistema

ComeID incorpora varias capas de seguridad, verificadas y probadas. Es importante tenerlo presente al presentar el proyecto.

### 6.1 Control de acceso por rol en la base de datos (Firestore Rules)

Todas las operaciones de lectura y escritura contra la base de datos están protegidas por reglas del lado del servidor de Firebase. Aunque alguien robara el código fuente o conectara su propio cliente, **no podría** leer ni modificar datos sin cumplir las reglas. Lo más relevante:

- **Gestores** (admin, profesor, bibliotecario): acceso a la gestión del comedor y la biblioteca.
- **Estudiantes**: solo lectura de **su propia** información, verificada por su `uid` y su cédula.
- **Escrituras restringidas**: por ejemplo, un estudiante solo puede actualizar en su expediente los campos de `uid` y `correo`, y únicamente con su correo verificado por Firebase.
- **Eliminaciones limitadas**: nadie puede eliminar documentos de usuarios ni de notificaciones desde el cliente.
- **Collections sensibles** (invitados, inventario, notas, historial de comedor): solo gestores.
- **Almacenamiento de archivos** (Firebase Storage): completamente **cerrado** (`deny`), porque el sistema no necesita subir archivos públicos.

### 6.2 Cabeceras de seguridad en la web (CSP)

Ambas aplicaciones envían cabeceras **Content-Security-Policy** que restringen qué recursos puede cargar el navegador:

- Solo se permiten **scripts** de la propia aplicación, de Firebase (`gstatic.com`) y de la librería de íconos (Font Awesome vía `cdnjs`).
- **Sin evaluación de código dinámico** (`eval` prohibido frente a inyección de código).
- Solo se permiten conexiones a los servicios de Firebase/Auth/Firestore y a la API de Gemini.
- No se permite incrustar la aplicación dentro de otra web (`frame-ancestors 'self'`) y se desactivan objetos embebidos (`object-src 'none'`).

También se envían: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy` y `Permissions-Policy`.

### 6.3 Sin secretos en el código fuente

- La **clave de la IA (Gemini)** **no** está escrita en el código. Se configura desde el panel de IA y se guarda únicamente en el navegador del administrador.
- El repositorio de GitHub es **privado** y posee un `.gitignore` que excluye archivos de credenciales.
- Se corrigió un hallazgo crítico: antes era posible que un usuario creara su propio documento de perfil con rol "admin" y escalara privilegios; ahora las reglas fuerzan rol "estudiante" y correo verificado al auto-registrarse.

### 6.4 Correcciones de seguridad aplicadas

Durante la puesta en producción se detectaron y corrigieron:

1. **Escalada de rol** en la creación de perfiles de usuario (corregido en las reglas de Firestore).
2. **Clave de IA expuesta** en el código (retirada del código; la configuración quedó por-panel).
3. **Recurso externo bloqueado** por el CSP (el generador de QR se movió a un CDN permitido).
4. **JSON de configuración inválido** tras añadir cabeceras (se reconstruyó y validó).

### 6.5 Limitaciones honestas del proyecto

Es importante que el profesor conozca también cuáles son las limitaciones previstas:

- Es una plataforma **100% frontend** sobre el plan gratuito de Firebase (Spark). La seguridad real reside en las reglas de la base de datos; el código JavaScript es visible para cualquiera que quiera inspeccionarlo.
- Las **cédulas y nombres** se guardan en texto plano en Firestore (Firestore no cifra los campos de forma nativa).
- El CSP permite `'unsafe-inline'` en scripts porque existen pequeños scripts dentro de los HTML; se puede eliminar en una mejora futura.
- No hay **autenticación de dos pasos** (2FA) ni límite de intentos de contraseña más allá del control que da Firebase.
- Eliminar un estudiante no borra automáticamente su cuenta de autenticación en Firebase (limitación del plan gratuito, sin funciones de servidor).

---

# 7. Mejoras Futuras Previstas

Estas son las mejoras que no se han podido implementar todavía y que se sugieren como siguientes pasos:

### 7.1 Funciones de servidor (Cloud Functions)
- Migrar a un plan de pago (Blaze) y desplegar funciones de backend para: **eliminar cuentas de autenticación** de estudiantes dados de baja, **llamar a la IA desde el servidor** (sin exponer ningún manejo de la clave), y validar o auditar operaciones sensibles.
- Esto permitiría también correos automáticos, respaldos programados y cierres de lote diarios.

### 7.2 App Check y mayor protección del acceso
- Activar **Firebase App Check** para que solo la aplicación real pueda acceder a los datos, bloqueando peticiones externas.
- Implementar **autenticación de dos pasos (2FA)** para cuentas admin.
- Añadir límites de intentos y bloqueo temporal por contraseña.

### 7.3 Eliminar los scripts inline y endurecer el CSP
- Externalizar los pequeños bloques de script de las páginas HTML para poder retirar `'unsafe-inline'` del CSP y cerrar por completo la inyección de código.

### 7.4 Cifrado de datos personales
- Implementar cifrado/reversión de campos sensibles (cédulas, teléfonos) en la aplicación antes de guardarlos en Firestore.

### 7.5 Copias de seguridad y recuperación
- Exportación automática de Firestore (respaldos diarios) y un manual de restauración.

### 7.6 Reportes y estadísticas ampliadas
- Dashboard de reportes más profundos: desperdicio, costo por platillo, socios de biblioteca más activos, morosidad de préstamos.

### 7.7 Mejoras de experiencia
- Aplicación móvil o PWA con soporte offline.
- Recordatorios de devolución de libros por correo.
- Multi-instituto (que varias instituciones usen la misma plataforma con sus propios datos).

---

# 8. Conclusión

ComeID (Integra ID) es un sistema completo para la gestión del comedor y la biblioteca del CTP de Liberia, con control de acceso por roles, asistencia por QR, menú con apoyo de inteligencia artificial, biblioteca digitalizada y portal de auto-servicio para estudiantes. La seguridad se apoya en las reglas de Firestore y en cabeceras de protección web, y el sistema queda documentado y listo para crecer con las mejoras propuestas en la sección 7.

---

*Documento elaborado como manual de uso y presentación del proyecto ComeID (Integra ID) — CTP de Liberia.*