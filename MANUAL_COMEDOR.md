# Manual de Uso — ComeID (Comedor Estudiantil)

Manual práctico para administradores, profesores y bibliotecarios del sistema de gestión del **comedor** del CTP de Liberia.

---

## 1. Introducción

**ComeID** es el módulo de **comedor** de la plataforma IntegraID. Con él el personal del centro educativo puede:

- Registrar a los estudiantes y crear sus cuentas de acceso.
- Controlar **quién comió** cada día mediante **escaneo de códigos QR**.
- Planificar el **menú semanal** (lunes a viernes), incluso con ayuda de **inteligencia artificial**.
- Llevar la lista de **invitados externos**.
- Consultar **historiales** y **exportar reportes** (Excel/PDF).

---

## 2. Acceso

1. Abra `https://comeid-670b9.web.app`.
2. Escriba su correo y contraseña.
3. Pulse **Iniciar sesión**.
4. En la pantalla de elección de sistema pulse **ComeID (Comedor)**.

Si está dentro de la biblioteca (Bibliogest), cambie desde el menú lateral con la opción **Selector de app**.

---

## 3. Estructura de la pantalla principal

- **Menú lateral izquierdo:** todas las secciones disponibles según su rol.
- **Barra superior:** usuario conectado, ayuda, selector de idioma/tema y botón de **cerrar sesión**.
- **Área central:** el contenido de la sección elegida.

---

## 4. Secciones del comedor

### 4.1 Panel de control (Inicio)

Muestra las tarjetas resumen en tiempo real:

- Número de **estudiantes registrados**.
- **Asistencias de hoy** (cuántos comieron).
- **Invitados del día**.
- Preparados/sobrantes del comedor.

### 4.2 Estudiantes

#### Ver y buscar
1. Pulse **Estudiantes**.
2. Escriba nombre, cédula o sección en el buscador.
3. La lista se filtra al momento; cada fila tiene botones de **editar**, **QR** y **eliminar**.

#### Registrar un estudiante nuevo
1. Pulse **Nuevo estudiante**.
2. Complete: **nombre completo**, **cédula**, **sección**, **nivel** y **tipo** (Becado/Pagado).
3. (Opcional) Tome una **foto** con la cámara.
4. Si quiere darle cuenta de portal: active la casilla **crear cuenta** e introduzca **correo y contraseña**.
5. Pulse **Guardar**.

El sistema genera **automáticamente el código QR** del estudiante y crea su cuenta de acceso.

> Si el correo que escribe ya está usado por otra cuenta, el sistema lo avisa: use otro correo.

#### Editar
Pulse **Editar** en la fila del estudiante, cambie los datos y **Guardar**.

#### Eliminar (solo administrador)
Pulse **Eliminar** y confirme. **No se puede deshacer.**

#### Importar estudiantes desde archivo
1. Pulse **Importar**.
2. Seleccione el archivo (CSV/Excel).
3. Revise la vista previa y confirme.
4. Los registros válidos se crean en bloque con su QR; los inválidos se listan para corregir.

### 4.3 Escanear asistencia (QR)

1. En el menú, pulse **Escanear QR**.
2. **Permita la cámara** cuando lo pida el navegador.
3. Acérquese al **QR** de la credencial o del celular del estudiante.
4. Al detectarlo, el estudiante queda **marcado como asistente del día** y su nombre se muestra en pantalla.
5. Use los botones de exportación para guardar la **lista del día** (Excel, PDF o CSV).

**Consejos:**
- Ajuste la distancia y la luz para una lectura rápida.
- Si un estudiante no trae su QR, puede buscarlo por nombre y marcarlo manualmente (según configuración del sistema).

### 4.4 Historial de asistencia

- **Historial (general):** resumen de asistencias por día; exportable.
- **Historial por estudiante:** todos los consumos de un estudiante en concreto.

### 4.5 Invitados externos

Los invitados son personas que **no son estudiantes** del CTP pero consumen en el comedor.

1. Pulse **Invitados**.
2. Pulse **Nuevo invitado**.
3. Registre nombre, y opcionalmente cédula, motivo y frecuencia.
4. Pulse **Guardar**.
5. La lista del día se muestra y puede marcarse cuando el invitado asiste.
6. Use **Editar** o **Eliminar** para mantener la lista al día.

### 4.6 Menú semanal

1. Pulse **Menú Semanal**.
2. Para cada día (lunes a viernes) escriba el **desayuno** y el **almuerzo**.
3. Pulse **Guardar menú**.

El menú guardado se publica en el **portal de estudiantes** en el día correspondiente.

#### Menú con ayuda de la inteligencia artificial
1. En la sección de menú abra la ventana de **IA**.
2. Escriba su petición: por ejemplo *"sugiere 5 almuerzos económicos para 300 estudiantes"*.
3. Revise las sugerencias y aplique la que prefiera.
4. Guarde el menú.

> La clave de la IA se configura una vez en **Configuración** (solo administrador) y no está escrita en el código.

### 4.7 Predicción de demanda (solo administrador)

1. Pulse **Predicción**.
2. El sistema analiza el historial de asistencias y proyecta cuántos estudiantes podrían asistir (próximo día o semana).
3. Use la estimación para planificar compras y reducir el desperdicio.

### 4.8 Exportar reportes (Excel/PDF)

Desde las secciones de reportes (Estudiantes, Escáner del día, Historial) use el menú **Exportar** y elija **Excel** o **PDF**. El archivo se descarga a su equipo.

### 4.9 Gestión de usuarios y roles (solo administrador)

1. Pulse **Gestión de Usuarios y Roles**.
2. Verá todas las cuentas con su correo y rol.
3. En el desplegable de cada cuenta elija **admin**, **profesor** o **estudiante**.
4. Pulse **Guardar cambios**. El cambio es inmediato.

### 4.10 Configuración (solo administrador)

Ajuste aquí:

- **Idioma** de la interfaz (español, inglés, portugués, francés, alemán).
- **Datos del comedor** y turnos.
- **Clave de la inteligencia artificial (Gemini)** para habilitar menú y predicción.
- **Versión del sistema** mostrada.

Pulse **Guardar** al terminar.

---

## 5. Preguntas frecuentes

**¿Puede un profesor eliminar estudiantes?**
No. Eliminar estudiantes es exclusivo del administrador.

**¿Qué pasa si un estudiante olvida su QR?**
Puede marcarse manualmente desde el historial/escáner según la configuración, o volver a generar su QR desde la sección **Generar QR**.

**¿Puedo cambiar el rol de un usuario yo mismo?**
Solo el administrador gestiona roles.

**¿El menú incluye sábados y domingos?**
No. El menú se gestiona de lunes a viernes.

---

## 6. Seguridad verificada del módulo

- **Estudiantes** solo pueden ver sus propios datos (verificado por cédula y por cuenta).
- **Invitados, historiales y menú** son de uso exclusivo del personal.
- Solo un **admin** puede borrar registros o cambiar roles.
- Las reglas de la base de datos son aplicadas por **Firebase** (no por el navegador), por lo que no se pueden saltar editando el código cliente.