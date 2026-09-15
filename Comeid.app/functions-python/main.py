#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =============================================
# ComeID - Cloud Functions en Python (gen 2)
# Automatiza para la BIBLIOTECA y el COMEDOR:
#   - Correos automáticos de vencimientos y reservas
#   - Predicción de demanda (libros + asistencia comedor)
#   - Respaldo programado a Cloud Storage
#
# REQUIERE plan Blaze. Despliegue:
#   firebase deploy --only functions:python --project comeid-670b9
#
# Configuración SMTP (opcional) en Firestore: configuracion/servidorCorreo
#   { host, puerto, usuario, password, desde }
# =============================================

import datetime
import json
import statistics

from firebase_admin import firestore, initialize_app

import firebase_functions.https_fn as https_fn
import firebase_functions.scheduler_fn as scheduler_fn

initialize_app()

COLECCIONES = [
    "usuarios", "estudiantes", "bibliotecaEstudiantes", "asistencias", "notas",
    "libros", "prestamos", "reservas", "valoraciones",
    "favoritos", "actividad", "configuracion",
    "recomendaciones", "notificaciones",
]

TIEMPO_CORREOS = "every 1 hours"
HORA_PREDICCION = "every day 02:30"
HORA_RESPALDO = "every monday 03:00"


def leer_coleccion(db, nombre):
    docs = []
    try:
        for snap in db.collection(nombre).stream():
            docs.append({"id": snap.id, **snap.to_dict()})
    except Exception as e:
        print(f"Colección '{nombre}' no disponible: {e}")
    return docs


def obtener_smtp(db):
    doc = db.collection("configuracion").document("servidorCorreo").get()
    return doc.to_dict() if doc.exists else {}


def crear_notificacion(db, para, para_nombre, tipo, titulo, mensaje):
    db.collection("notificaciones").add({
        "para": para,
        "paraNombre": para_nombre,
        "tipo": tipo,
        "titulo": titulo,
        "mensaje": mensaje,
        "fecha": datetime.datetime.now().isoformat(),
        "leida": False,
    })


def enviar_smtp(cfg, destino, asunto, cuerpo):
    if not cfg.get("host") or not cfg.get("usuario") or not cfg.get("password"):
        print("SMTP no configurado; se crearon solo notificaciones en la app.")
        return
    import smtplib
    from email.mime.text import MIMEText
    mensaje = MIMEText(cuerpo, "plain", "utf-8")
    mensaje["Subject"] = asunto
    mensaje["From"] = cfg.get("desde") or cfg.get("usuario")
    mensaje["To"] = destino
    puerto = int(cfg.get("puerto") or 587)
    if puerto == 465:
        servidor = smtplib.SMTP_SSL(cfg["host"], puerto)
    else:
        servidor = smtplib.SMTP(cfg["host"], puerto)
        servidor.starttls()
    servidor.login(cfg.get("usuario"), cfg.get("password"))
    servidor.sendmail(cfg.get("desde") or cfg.get("usuario"), [destino], mensaje.as_string())
    servidor.quit()


def _correo_vencimientos(db, cfg):
    hoy = datetime.date.today().isoformat()
    prestamos = leer_coleccion(db, "prestamos")
    usuarios = {u.get("id"): u for u in leer_coleccion(db, "usuarios")}
    estudiantes = {e.get("id"): e for e in leer_coleccion(db, "estudiantes")}
    # Socios propios de BIBLIOGEST ("bibliotecaEstudiantes"): también pueden
    # recibir el aviso por correo si registraron su email al darse de alta.
    for b in leer_coleccion(db, "bibliotecaEstudiantes"):
        estudiantes.setdefault(b.get("id"), b)
    # Índice nombre -> uids de cuenta (para que la notificación de la app
    # llegue al estudiante correcto aunque aquí no conozcamos su uid).
    usuarios_por_nombre = {}
    for u in usuarios.values():
        n = (u.get("nombre") or "").strip().lower()
        if n:
            usuarios_por_nombre.setdefault(n, []).append(u.get("id"))
    atrasados = [
        p for p in prestamos
        if not p.get("devuelto") and p.get("fechaVencimiento") and p["fechaVencimiento"] < hoy
    ]
    for p in atrasados:
        email = None
        nombre = p.get("prestamistaNombre") or "—"
        if p.get("tipoPrestamista") == "Profesor":
            u = usuarios.get(p.get("prestamistaId") or "")
            email = (u or {}).get("correo")
        else:
            e = estudiantes.get(p.get("prestamistaId") or "")
            email = (e or {}).get("correo")
        para = p.get("prestamistaId") or ""
        candidatos = usuarios_por_nombre.get(nombre.strip().lower(), [])
        if candidatos:
            para = candidatos[0]
        crear_notificacion(
            db,
            para,
            nombre,
            "vencimiento",
            "Devolución atrasada",
            f"{p.get('libroTitulo')} vencido el {p.get('fechaVencimiento')}.",
        )
        if email:
            try:
                enviar_smtp(
                    cfg,
                    email,
                    "Aviso de devolución atrasada - ComeID Biblioteca",
                    f"Hola {nombre}, el libro '{p.get('libroTitulo')}' debía devolverse el {p.get('fechaVencimiento')}.",
                )
            except Exception as e:
                print(f"Error de correo para {email}: {e}")
    return len(atrasados)


def _avisar_reservas(db, cfg):
    hoy = datetime.date.today().isoformat()
    reservas = leer_coleccion(db, "reservas")
    disponibles = []
    prestamos = [p for p in leer_coleccion(db, "prestamos") if not p.get("devuelto")]
    for r in reservas:
        if r.get("estado") not in ("espera", "pendiente"):
            continue
        activos = sum(1 for p in prestamos if p.get("libroId") == r.get("libroId"))
        libro = db.collection("libros").document(r.get("libroId") or "_").get()
        ejemplares = int((libro.to_dict() or {}).get("ejemplares") or 0) if libro.exists else 0
        if activos < ejemplares:
            disponibles.append(r)
            db.collection("reservas").document(r["id"]).update({
                "estado": "disponible",
                "notificada": hoy,
            })
            crear_notificacion(
                db,
                r.get("usuarioId") or "",
                r.get("usuarioNombre") or "—",
                "reserva",
                "Reserva disponible",
                f"El libro reservado ya está disponible. Pasa por la biblioteca.",
            )
    return len(disponibles)


@scheduler_fn.on_schedule(
    schedule=TIEMPO_CORREOS,
    timeout_sec=300,
    memory=512,
)
def enviar_correos_programado(event):
    """Cada hora: avisa vencimientos atrasados y reservas disponibles."""
    db = firestore.client()
    cfg = obtener_smtp(db)
    venc = _correo_vencimientos(db, cfg)
    res = _avisar_reservas(db, cfg)
    print(f"Vencimientos: {venc} | Reservas disponibles: {res}")


@scheduler_fn.on_schedule(
    schedule=HORA_PREDICCION,
    timeout_sec=540,
    memory=512,
)
def predecir_demanda_programado(event):
    """Diario: recomienda más ejemplares de libros y predice asistencia del comedor."""
    db = firestore.client()
    libros = leer_coleccion(db, "libros")
    prestamos = leer_coleccion(db, "prestamos")
    asistencias = leer_coleccion(db, "asistencias")

    hace30 = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
    hoy = datetime.date.today().isoformat()
    batch = db.batch()
    for libro in libros:
        pid = libro.get("id")
        del_libro = [p for p in prestamos if p.get("libroId") == pid]
        recientes = sum(1 for p in del_libro if p.get("fechaPrestamo") and p["fechaPrestamo"] >= hace30)
        atrasos = sum(1 for p in del_libro if p.get("fechaVencimiento") and p["fechaVencimiento"] < hoy and not p.get("devuelto"))
        activos = sum(1 for p in del_libro if not p.get("devuelto"))
        ejemplares = int(libro.get("ejemplares") or 0)
        score = recientes * 2 + atrasos * 3
        if activos >= ejemplares and recientes > 2:
            sugerencia, urgencia = f"Adquirir {max(1, recientes // 3 + 1)} ejemplar(es) más", "alta"
        elif atrasos > 0:
            sugerencia, urgencia = "Revisar devoluciones atrasadas", "media"
        elif score == 0:
            sugerencia, urgencia = "Promocionar en el catálogo", "baja"
        else:
            sugerencia, urgencia = "Mantener disponibilidad actual", "baja"
        batch.set(db.collection("recomendaciones").document(pid), {
            "libroId": pid,
            "titulo": libro.get("titulo") or "—",
            "prestamos30dias": recientes,
            "atrasos": atrasos,
            "score": score,
            "sugerencia": sugerencia,
            "urgencia": urgencia,
            "fecha": datetime.datetime.now().isoformat(),
        }, merge=True)

    fechas = {}
    for a in asistencias:
        f = a.get("fecha")
        if f:
            fechas[f] = fechas.get(f, 0) + 1
    ordenadas = sorted(fechas.items())
    if len(ordenadas) >= 3:
        ultimas = [v for _, v in ordenadas[-5:]]
        promedio = statistics.mean(ultimas)
        pendiente = (ultimas[-1] - ultimas[0]) / len(ultimas)
        estimado = max(0, int(round(promedio + pendiente)))
        batch.set(db.collection("recomendaciones").document("comedor_asistencia"), {
            "tipo": "comedor",
            "promedio_diario": round(promedio, 1),
            "tendencia": round(pendiente, 2),
            "asistencia_estimada_proxima_jornada": estimado,
            "raciones_sugeridas": estimado + max(1, int(estimado * 0.05)),
            "dias_con_datos": len(ordenadas),
            "fecha": datetime.datetime.now().isoformat(),
        }, merge=True)
    batch.commit()
    print("Predicción de demanda actualizada.")


@scheduler_fn.on_schedule(
    schedule=HORA_RESPALDO,
    timeout_sec=540,
    memory=512,
)
def respaldo_programado(event):
    """Semanal: exporta todas las colecciones a Cloud Storage."""
    try:
        from google.cloud import storage
    except ImportError:
        print("google-cloud-storage no instalado; respaldo omitido.")
        return
    db = firestore.client()
    respaldo = {"app": "ComeID", "fecha": datetime.datetime.now().isoformat(), "colecciones": {}}
    for nombre in COLECCIONES:
        respaldo["colecciones"][nombre] = leer_coleccion(db, nombre)
    nombre_archivo = f"respaldos/comeid_{datetime.date.today().isoformat()}.json"
    cliente = storage.Client()
    bucket = cliente.bucket("comeid-670b9.appspot.com")
    blob = bucket.blob(nombre_archivo)
    blob.upload_from_string(json.dumps(respaldo, ensure_ascii=False, indent=2),
                            content_type="application/json")
    print(f"Respaldo subido: gs://comeid-670b9.appspot.com/{nombre_archivo}")


@https_fn.on_call(timeout_sec=120, memory=512)
def enviar_correos_ahora(request):
    """Disparo manual desde la app (solo admin/bibliotecario/profesor)."""
    if not request.auth:
        raise https_fn.HttpsError("unauthenticated", "Debes iniciar sesión.")
    uid = request.auth.uid
    usuario = firestore.client().collection("usuarios").document(uid).get()
    rol = (usuario.to_dict() or {}).get("rol") if usuario.exists else ""
    if rol not in ("admin", "profesor", "bibliotecario"):
        raise https_fn.HttpsError("permission-denied", "Sin permisos.")
    db = firestore.client()
    cfg = obtener_smtp(db)
    venc = _correo_vencimientos(db, cfg)
    res = _avisar_reservas(db, cfg)
    return {"vencimientos": venc, "reservasDisponibles": res}
