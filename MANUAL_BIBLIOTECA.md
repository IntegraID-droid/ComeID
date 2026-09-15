# Manual de Uso — Bibliogest (Biblioteca)

Manual práctico para el bibliotecario y el administrador del sistema de gestión de la **biblioteca** del CTP de Liberia.

---

## 1. Introducción

**Bibliogest** es el módulo de **biblioteca** de la plataforma IntegraID. Permite al personal de la biblioteca:

- Digitalizar el **catálogo de libros** (títulos, autores, códigos, ejemplares).
- Administrar los **socios** de la biblioteca.
- Registrar **préstamos**, **devoluciones** y **reservas**.
- Controlar las **alertas** de libros vencidos.
- Conocer la **ubicación** física de cada libro (mapa).
- Generar **reportes** y obtener **recomendaciones** con inteligencia artificial.

> La biblioteca es **independiente del comedor**: puede haber socios que no comen en el comedor y viceversa.

---

## 2. Acceso

1. Abra `https://comeid-670b9.web.app`.
2. Escriba su correo y contraseña.
3. Pulse **Iniciar sesión**.
4. En la pantalla de elección pulse **Bibliogest (Biblioteca)**.

Si está dentro del comedor (ComeID), cambie desde el menú lateral con **Selector de app**.

---

## 3. Estructura de la pantalla

- **Menú lateral izquierdo:** secciones de la biblioteca (según su rol).
- **Barra superior:** usuario, ayuda, idioma/tema y **cerrar sesión**.
- **Área central:** el contenido de la sección elegida.

---

## 4. Secciones de Bibliogest

### 4.1 Panel de control (Inicio)

Muestra las tarjetas resumen:

- **Títulos** registrados en el catálogo.
- **Ejemplares** disponibles.
- **Préstamos activos** y **préstamos por vencer**.
- **Sugerencias** para devolución.

### 4.2 Socios de la biblioteca

Los socios son los estudiantes con derecho a usar la biblioteca.

#### Dar de alta un socio
1. Pulse **Socios** (o **Estudiantes/Biblioteca** en el menú).
2. Pulse **Nuevo socio**.
3. Busque o registre el nombre del estudiante.
4. Pulse **Guardar**.

#### Ver, editar o eliminar
Use la lista de socios y los botones de acción de cada fila (editar / eliminar).

> Eliminar un socio está reservado al administrador.

### 4.3 Catálogo de libros

#### Agregar un libro
1. Pulse **Catálogo**.
2. Pulse **Nuevo libro**.
3. Complete al menos: **título**, **autor** y **código**; opcionalmente categoría, editorial, ISBN, estante, sección y **número de ejemplares**.
4. Pulse **Guardar**.

#### Buscar libros
Use el buscador por **título, autor, categoría o código**; la lista se filtra al momento.

#### Editar o eliminar
Use los botones de cada fila. Eliminar requiere confirmación.

#### Código QR del libro (opcional)
Algunos registros permiten generar un **QR del ejemplar** para agilizar el préstamo con escáner.

### 4.4 Préstamos

#### Prestar un libro
1. Pulse **Préstamos**.
2. Pulse **Nuevo préstamo**.
3. Seleccione el **socio** y el **libro** (o escanee el QR del ejemplar).
4. El sistema calcula la **fecha de vencimiento** automáticamente.
5. Pulse **Guardar**.

El libro pasa a **prestado**, disminuye la disponibilidad y aparece en *Mis préstamos* del estudiante en su portal.

#### Devolver un libro
1. En **Préstamos**, localice el préstamo activo.
2. Pulse **Devolver** (o **Devolver ejemplar** si se prestó por ejemplar).
3. Confirme. El libro vuelve a estar disponible y el préstamo pasa al historial.

### 4.5 Reservas

Cuando un libro está prestado o agotado, un estudiante puede **apartarlo**:

1. El estudiante reserva desde su portal (o el bibliotecario desde la sección **Reservas**).
2. Cuando el libro se devuelve, se atiende la reserva por orden.
3. El bibliotecario puede **cancelar** reservas vencidas.

### 4.6 Historial de préstamos

Registro completo de todos los préstamos (devueltos y pendientes), con las fechas correspondientes. Permite consultar quién devolvió qué y cuándo.

### 4.7 Alertas

- **Préstamos vencidos:** libros que debían devolverse y no se devolvieron.
- **Préstamos por vencer:** devoluciones próximas a la fecha límite.

Úselas para avisar a los estudiantes y controlar la morosidad.

### 4.8 Notificaciones

Permite enviar **avisos** a los estudiantes (por ejemplo, recordatorio de devolución). Los estudiantes los ven en la sección **Notificaciones** de su portal.

### 4.9 Mapa de la biblioteca

Muestra la **ubicación** de los libros (por sección/estante) para que tanto el personal como el estudiante encuentren el material físico.

### 4.10 Reportes

Exporte información del catálogo, préstamos e historial a **Excel y PDF** para control interno o para la administración.

### 4.11 Inteligencia artificial (IA)

- **Sugerencias de lectura:** libros recomendados según el historial.
- **Análisis de disponibilidad:** qué títulos están disponibles y cuáles están muy solicitados.
- **Búsqueda inteligente:** encuentra títulos por descripción, no solo por nombre exacto.

> La IA solo se habilita si el administrador configuró la clave en **Configuración**.

### 4.12 Configuración (solo administrador)

- Nombre y datos de la biblioteca.
- **Días de préstamo** y política de vencimiento (si está implementada).
- **Idioma** de la interfaz.
- **Clave de IA** para funciones inteligentes.

Guarde siempre los cambios con el botón **Guardar**.

### 4.13 Actividad

Registro de auditoría de las acciones importantes: altas, bajas, préstamos, devoluciones, cambios de rol. Útil para el control del bibliotecario.

---

## 5. Flujo típico del bibliotecario

1. **Dar de alta** al socio (si aún no existe).
2. **Registrar el libro** en el catálogo (si es nuevo).
3. **Prestar** el libro y fijar la fecha de vencimiento.
4. Cuando regrese, **devolver** y verificar el estado.
5. Revisar **alertas** cada mañana para avisar a los estudiantes con préstamos vencidos.

---

## 6. Preguntas frecuentes

**¿Un estudiante puede ver qué libros hay?**
Sí; en su portal tiene la biblioteca con catálogo y reservas. Solo ve **sus** préstamos.

**¿Puede el profesor gestionar la biblioteca?**
No. La gestión completa es del **bibliotecario** y del **admin**.

**¿Qué pasa si el libro no aparece en el catálogo?**
Debe agregarse primero en **Catálogo → Nuevo libro**.

**¿Cómo se entera el estudiante de un préstamo vencido?**
Por la sección **Alertas** del bibliotecario y por la **Notificación** que se envíe desde el sistema.

---

## 7. Seguridad del módulo

- Solo **gestores** (bibliotecario/admin) pueden crear, editar o eliminar libros, socios y préstamos.
- El **estudiante** solo lee su propia información de la biblioteca.
- Las reglas de **Firebase** impiden acceder a la información de otros aunque alguien manipule el navegador.
- Los **reportes** y la **actividad** quedan registrados para auditoría.