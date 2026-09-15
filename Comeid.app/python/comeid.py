#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =============================================
# ComeID - Herramienta de administración en Python (local)
#
# Funciona en el plan gratuito de Firebase (sin Cloud Functions).
# Sirve para la BIBLIOTECA y el COMEDOR (mismo proyecto comeid-670b9).
#
# 1) Instalar:  pip install firebase-admin
# 2) Credenciales: descarga la clave de cuenta de servicio desde
#    Firebase Console > Ajustes del proyecto > Cuentas de servicio >
#    "Generar nueva clave privada" y guárdala como:
#        python/serviceAccount.json
#
# Uso:
#   python comeid.py respaldar                    Exporta todos los datos a respaldo/
#   python comeid.py restaurar archivo.json       Restaura desde un respaldo
#   python comeid.py importar_libros libros.csv   Importa el catálogo desde CSV
#   python comeid.py reporte                      Resumen de ambos módulos
#   python comeid.py predecir [--guardar]         Predicción de demanda (biblioteca + comedor)
#   python comeid.py correos [--simular]          Avisos por correo (vencimientos/reservas)
#   python comeid.py vincular [--clave CLAVE] [--simular]
#                                                  Crea las cuentas del portal
#                                                  "ComeID Estudiantes" para los
#                                                  estudiantes que aún no tienen
#                                                  (correo+contraseña y vinculo uid)
#   python comeid.py buscar CEDULA_O_NOMBRE [--respaldo respaldo.json]
#                                                  Busca estudiantes por cédula o
#                                                  nombre y muestra su estado
#                                                  (portal, comedor, biblioteca)
# =============================================

import argparse
import csv
import datetime
import json
import os
import statistics
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Colecciones que comparten biblioteca y comedor en el mismo proyecto
COLECCIONES = [
    "usuarios", "estudiantes", "asistencias", "notas",
    "comenfuera", "inventario", "libros", "prestamos", "reservas",
    "valoraciones", "favoritos", "actividad", "configuracion",
    "recomendaciones", "notificaciones"
]


def inicializar():
    """Crea el cliente de Firestore usando la cuenta de servicio."""
    try:
        from firebase_admin import credentials, firestore, initialize_app
    except ImportError:
        sys.exit("Falta firebase-admin. Instala con:  pip install firebase-admin")
    ruta = os.path.join(SCRIPT_DIR, "serviceAccount.json")
    if not os.path.exists(ruta):
        sys.exit(
            "Falta python/serviceAccount.json.\n"
            "Descárgalo en Firebase Console > Ajustes del proyecto > Cuentas de servicio > Generar nueva clave privada."
        )
    cred = credentials.Certificate(ruta)
    initialize_app(cred, name="comeid-local")
    return firestore.client(initialize_app(cred, name="comeid-local"))


def leer_coleccion(db, nombre):
    docs = []
    try:
        for snap in db.collection(nombre).stream():
            docs.append({"id": snap.id, **snap.to_dict()})
    except Exception as e:
        print(f"  [aviso] colección '{nombre}' no legible: {e}")
    return docs


def guardar_coleccion(db, nombre, docs):
    for d in docs:
        if not isinstance(d, dict) or not d.get("id"):
            continue
        datos = {k: v for k, v in d.items() if k != "id"}
        db.collection(nombre).document(d["id"]).set(datos, merge=True)
    print(f"  {nombre}: {len(docs)} documentos")


def comando_respaldar(db, args):
    hoy = datetime.date.today().isoformat()
    os.makedirs(os.path.join(SCRIPT_DIR, "respaldo"), exist_ok=True)
    ruta = os.path.join(SCRIPT_DIR, "respaldo", f"Respaldo_ComeID_{hoy}.json")
    respaldo = {
        "app": "ComeID",
        "fecha": datetime.datetime.now().isoformat(),
        "colecciones": {},
    }
    print("Exportando colecciones...")
    for nombre in COLECCIONES:
        docs = leer_coleccion(db, nombre)
        respaldo["colecciones"][nombre] = docs
        print(f"  {nombre}: {len(docs)} documentos")
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(respaldo, f, ensure_ascii=False, indent=2)
    print(f"Respaldo creado: {ruta}")


def comando_restaurar(db, args):
    ruta = args.archivo
    if not os.path.exists(ruta):
        sys.exit(f"No existe el archivo: {ruta}")
    with open(ruta, "r", encoding="utf-8") as f:
        respaldo = json.load(f)
    if "colecciones" not in respaldo:
        sys.exit("El archivo no es un respaldo válido de ComeID.")
    confirmar = input(f"Restaurar {ruta}? Sobrescribirá los datos en Firestore (s/N): ")
    if confirmar.lower() not in ("s", "si", "y", "yes"):
        print("Cancelado.")
        return
    print("Restaurando...")
    for nombre, docs in respaldo["colecciones"].items():
        guardar_coleccion(db, nombre, docs)
    print("Restauración completada.")


def comando_importar_libros(db, args):
    ruta = args.csv
    if not os.path.exists(ruta):
        sys.exit(f"No existe el archivo: {ruta}")
    with open(ruta, "r", encoding="utf-8-sig") as f:
        filas = list(csv.DictReader(f))
    creados = 0
    batch = db.batch()
    for fila in filas:
        titulo = (fila.get("titulo") or "").strip()
        autor = (fila.get("autor") or "").strip()
        if not titulo:
            continue
        datos = {
            "titulo": titulo,
            "autor": autor,
            "categoria": (fila.get("categoria") or "Otro").strip(),
            "editorial": (fila.get("editorial") or "").strip(),
            "anio": int(fila["anio"]) if (fila.get("anio") or "").isdigit() else 0,
            "ejemplares": int(fila["ejemplares"]) if (fila.get("ejemplares") or "").isdigit() else 1,
            "codigo": (fila.get("codigo") or "").strip(),
            "isbn": (fila.get("isbn") or "").strip(),
            "estante": (fila.get("estante") or "").strip(),
            "seccion": (fila.get("seccion") or "").strip(),
            "nivel": (fila.get("nivel") or "").strip(),
            "estado": (fila.get("estado") or "Bueno").strip(),
        }
        if datos["codigo"]:
            existente = db.collection("libros").where("codigo", "==", datos["codigo"]).get()
            ref = existente[0].reference if existente else db.collection("libros").document()
        else:
            ref = db.collection("libros").document()
        batch.set(ref, datos, merge=True)
        creados += 1
    batch.commit()
    print(f"Libros importados/actualizados: {creados}")


def comando_reporte(db, args):
    total = {}
    for nombre in COLECCIONES:
        total[nombre] = len(leer_coleccion(db, nombre))
    libros = leer_coleccion(db, "libros")
    prestamos = leer_coleccion(db, "prestamos")
    hoy = datetime.date.today().isoformat()
    activos = [p for p in prestamos if not p.get("devuelto")]
    atrasados = [
        p for p in activos
        if p.get("fechaVencimiento") and p["fechaVencimiento"] < hoy
    ]
    print("=== RESUMEN ComeID ===")
    print(f"  Libros en catálogo:       {total['libros']}")
    print(f"  Préstamos registrados:    {total['prestamos']}")
    print(f"  Préstamos activos:        {len(activos)}")
    print(f"  Préstamos atrasados:      {len(atrasados)}")
    print(f"  Estudiantes:              {total['estudiantes']}")
    print(f"  Usuarios:                 {total['usuarios']}")
    print(f"  Asistencias comedor:      {total['asistencias']}")
    print(f"  Notas:                    {total['notas']}")
    print(f"  Reservas:                 {total['reservas']}")
    if libros:
        titulos = len(libros)
        ejemplares = sum(int(l.get("ejemplares") or 0) for l in libros)
        print(f"  Ejemplares totales:       {ejemplares} ({titulos} títulos)")


def _recomendaciones_biblioteca(db, libros, prestamos):
    hoy = datetime.date.today()
    hace30 = hoy - datetime.timedelta(days=30)
    hace14 = hoy - datetime.timedelta(days=14)
    recs = []
    for l in libros:
        pid = l.get("id")
        del_libro = [p for p in prestamos if p.get("libroId") == pid]
        recientes = sum(1 for p in del_libro if p.get("fechaPrestamo") and p["fechaPrestamo"] >= hace30.isoformat())
        atrasos = sum(1 for p in del_libro if p.get("fechaVencimiento") and p["fechaVencimiento"] < hoy.isoformat() and not p.get("devuelto"))
        activos = sum(1 for p in del_libro if not p.get("devuelto"))
        ejemplares = int(l.get("ejemplares") or 0)
        score = recientes * 2 + atrasos * 3
        if activos >= ejemplares and recientes > 2:
            sugerencia = f"Adquirir {max(1, recientes // 3 + 1)} ejemplar(es) más"
            urgencia = "alta"
        elif atrasos > 0:
            sugerencia = "Revisar devoluciones atrasadas"
            urgencia = "media"
        elif score == 0:
            sugerencia = "Promocionar en el catálogo"
            urgencia = "baja"
        else:
            sugerencia = "Mantener disponibilidad actual"
            urgencia = "baja"
        recs.append({
            "libroId": pid,
            "titulo": l.get("titulo") or "—",
            "prestamos30dias": recientes,
            "atrasos": atrasos,
            "score": score,
            "sugerencia": sugerencia,
            "urgencia": urgencia,
            "fecha": datetime.datetime.now().isoformat(),
        })
    return sorted(recs, key=lambda r: r["score"], reverse=True)


def _prediccion_comedor(db, asistencias):
    fechas = {}
    for a in asistencias:
        f = a.get("fecha")
        if not f:
            continue
        if f not in fechas:
            fechas[f] = 0
        fechas[f] += 1
    ordenadas = sorted(fechas.items())
    if len(ordenadas) < 3:
        return None
    ultimas = [v for _, v in ordenadas[-5:]]
    promedio = statistics.mean(ultimas)
    pendiente = 0.0
    if len(ultimas) >= 3:
        pendiente = (ultimas[-1] - ultimas[0]) / len(ultimas)
    estimado = max(0, int(round(promedio + pendiente)))
    return {
        "tipo": "comedor",
        "promedio_diario": round(promedio, 1),
        "tendencia": round(pendiente, 2),
        "asistencia_estimada_proxima_jornada": estimado,
        "raciones_sugeridas": estimado + max(1, int(estimado * 0.05)),
        "dias_con_datos": len(ordenadas),
        "fecha": datetime.datetime.now().isoformat(),
    }


def comando_predecir(db, args):
    libros = leer_coleccion(db, "libros")
    prestamos = leer_coleccion(db, "prestamos")
    asistencias = leer_coleccion(db, "asistencias")
    print("=== PREDICCIÓN DE DEMANDA (biblioteca) ===")
    recs = _recomendaciones_biblioteca(db, libros, prestamos)
    for r in recs[:10]:
        print(f"  [{r['urgencia']:<6}] {r['titulo']} | 30d: {r['prestamos30dias']} | score {r['score']} | {r['sugerencia']}")
    print("=== PREDICCIÓN (comedor) ===")
    pred = _prediccion_comedor(db, asistencias)
    if pred:
        print(f"  Asistencia estimada próxima jornada: {pred['asistencia_estimada_proxima_jornada']}")
        print(f"  Raciones sugeridas: {pred['raciones_sugeridas']}")
    else:
        print("  Datos insuficientes (menos de 3 días de asistencia).")
    if args.guardar:
        batch = db.batch()
        for r in recs:
            ref = db.collection("recomendaciones").document(r["libroId"])
            batch.set(ref, r, merge=True)
        if pred:
            batch.set(db.collection("recomendaciones").document("comedor_asistencia"), pred, merge=True)
        batch.commit()
        print("Recomendaciones guardadas en Firestore.")


def comando_correos(db, args):
    config = leer_coleccion(db, "configuracion")
    cfg = {}
    for c in config:
        if c.get("id") == "servidorCorreo":
            cfg = c
    hoy = datetime.date.today().isoformat()
    prestamos = leer_coleccion(db, "prestamos")
    usuarios = {u.get("id"): u for u in leer_coleccion(db, "usuarios")}
    estudiantes = {e.get("id"): e for e in leer_coleccion(db, "estudiantes")}
    # Índice nombre -> uids de cuenta (para dirigir la notificación de la app
    # al estudiante correcto aunque no conozcamos su uid de autenticación).
    usuarios_por_nombre = {}
    for u in usuarios.values():
        n = (u.get("nombre") or "").strip().lower()
        if n:
            usuarios_por_nombre.setdefault(n, []).append(u.get("id"))
    atrasados = [p for p in prestamos if not p.get("devuelto") and p.get("fechaVencimiento") and p["fechaVencimiento"] < hoy]
    destino = args.destino or cfg.get("destinoPrueba")
    for p in atrasados:
        email = None
        nombre = p.get("prestamistaNombre") or "—"
        if p.get("tipoPrestamista") == "Profesor":
            u = usuarios.get(p.get("prestamistaId") or "")
            email = (u or {}).get("correo")
        else:
            e = estudiantes.get(p.get("prestamistaId") or "")
            email = (e or {}).get("correo")
        if not email:
            email = destino
        asunto = "Aviso de devolución atrasada"
        cuerpo = f"Hola {nombre}, el libro '{p.get('libroTitulo')}' debía devolverse el {p.get('fechaVencimiento')}."
        print(f"  {nombre} ({email or 'sin correo'}) -> {asunto}")
        # Destinatario de la notificación: el uid de la cuenta si existe,
        # si no el id del registro del estudiante (la app lo resuelve por nombre).
        para = p.get("prestamistaId") or ""
        candidatos = usuarios_por_nombre.get(nombre.strip().lower(), [])
        if candidatos:
            para = candidatos[0]
        # Notificación en la app (siempre)
        db.collection("notificaciones").add({
            "para": para,
            "paraNombre": nombre,
            "tipo": "vencimiento",
            "titulo": "Devolución atrasada",
            "mensaje": f"{p.get('libroTitulo')} vencido el {p.get('fechaVencimiento')}.",
            "fecha": datetime.datetime.now().isoformat(),
            "leida": False,
        })
        if email and not args.simular and cfg.get("host"):
            try:
                _enviar_smtp(cfg, email, asunto, cuerpo)
                print(f"    [correo enviado a {email}]")
            except Exception as e:
                print(f"    [error al enviar correo: {e}]")
    if args.simular:
        print(f"(modo simulación: {len(atrasados)} avisos generados, sin enviar correos)")


def _enviar_smtp(cfg, destino, asunto, cuerpo):
    import smtplib
    from email.mime.text import MIMEText
    mensaje = MIMEText(cuerpo, "plain", "utf-8")
    mensaje["Subject"] = asunto
    mensaje["From"] = cfg.get("desde")
    mensaje["To"] = destino
    puerto = int(cfg.get("puerto") or 587)
    if str(puerto) == "465":
        servidor = smtplib.SMTP_SSL(cfg["host"], puerto)
    else:
        servidor = smtplib.SMTP(cfg["host"], puerto)
        servidor.starttls()
    servidor.login(cfg.get("usuario"), cfg.get("password"))
    servidor.sendmail(cfg.get("desde"), [destino], mensaje.as_string())
    servidor.quit()


def comando_vincular(db, args):
    """Migra estudiantes al portal ComeID Estudiantes.

    Para cada estudiante SIN cuenta crea un usuario en Firebase Auth
    (correo + clave temporal) y guarda:
      - estudiantes/{id}.uid  y  estudiantes/{id}.correo
      - usuarios/{uid}  { rol: "estudiante", nombre, correo, cedula, estudiantesId }
    Para estudiantes que ya tienen uid, verifica/crea el perfil si falta.
    """
    try:
        from firebase_admin import auth
    except ImportError:
        sys.exit("Falta firebase-admin. Instala con:  pip install firebase-admin")
    clave = args.clave or "ComeID2026!"
    simulacion = bool(args.simular)
    estudiantes = leer_coleccion(db, "estudiantes")
    creados = 0
    ya_tienen = 0
    arreglados = 0
    errores = 0
    sin_datos = 0
    print(f"=== VINCULAR ESTUDIANTES AL PORTAL ComeID Estudiantes ==={(' (SIMULACIÓN, no guarda nada)' if simulacion else '')}")
    print(f"  Clave temporal: {clave}")
    for e in estudiantes:
        nombre = (e.get("nombre") or "").strip()
        cedula = (e.get("cedula") or "").strip()
        eid = e.get("id")
        if not eid or not nombre:
            sin_datos += 1
            continue
        uid = e.get("uid")
        correo = (e.get("correo") or "").strip().lower()
        if uid:
            ya_tienen += 1
            perfil = db.collection("usuarios").document(uid)
            if not perfil.get().exists:
                if not simulacion:
                    perfil.set({
                        "rol": "estudiante",
                        "nombre": nombre,
                        "correo": correo,
                        "cedula": cedula,
                        "estudiantesId": eid,
                    })
                    arreglados += 1
                    print(f"  [arreglado] perfil del portal para {nombre} ({uid})")
                else:
                    print(f"  [simulado] crearía el perfil del portal de {nombre}")
            continue
        if not correo:
            base = cedula or ("estudiante" + eid.replace("/", ""))
            correo = base + "@estudiante.ctpliberia.edu.cr"
        if simulacion:
            print(f"  [simulado] crearía {nombre} con {correo}")
            creados += 1
            continue
        try:
            try:
                usuario = auth.create_user(email=correo, password=clave, display_name=nombre)
            except Exception as ex:
                if "already in use" in str(ex) or "ALREADY_EXISTS" in str(ex):
                    usuario = auth.get_user_by_email(correo)
                    print(f"  [existe] {nombre} ya tenía la cuenta {correo} ({usuario.uid})")
                else:
                    raise
            uid = usuario.uid
            db.collection("estudiantes").document(eid).update({"uid": uid, "correo": correo})
            db.collection("usuarios").document(uid).set({
                "rol": "estudiante",
                "nombre": nombre,
                "correo": correo,
                "cedula": cedula,
                "estudiantesId": eid,
            })
            creados += 1
            print(f"  [creado] {nombre} ({correo}) -> uid {uid}")
        except Exception as ex:
            errores += 1
            print(f"  [error] {nombre}: {ex}")
    print(f"RESUMEN: creadas/vinculadas {creados}, ya tenían cuenta {ya_tienen}, perfiles arreglados {arreglados}, errores {errores}, sin nombre {sin_datos}.")


def _cargar_datos(args):
    """Carga estudiantes, usuarios, asistencias y préstamos.

    Si se pasa --respaldo archivo.json usa el respaldo local (sin credenciales);
    si no, usa Firestore (requiere python/serviceAccount.json). Acepta el
    formato nuevo ({colecciones}) y el antiguo (arrays sueltos).
    """
    if getattr(args, "respaldo", ""):
        if not os.path.exists(args.respaldo):
            sys.exit(f"No existe el archivo: {args.respaldo}")
        with open(args.respaldo, "r", encoding="utf-8") as f:
            respaldo = json.load(f)
        colecciones = respaldo.get("colecciones", {}) or {}
        estudiantes = colecciones.get("estudiantes") or respaldo.get("estudiantes") or []
        usuarios = {u.get("id"): u for u in (colecciones.get("usuarios") or respaldo.get("usuarios") or [])}
        asistencias = colecciones.get("asistencias") or respaldo.get("asistencias") or []
        prestamos = colecciones.get("prestamos") or respaldo.get("prestamos") or []
        return estudiantes, usuarios, asistencias, prestamos
    db = inicializar()
    return (
        leer_coleccion(db, "estudiantes"),
        {u.get("id"): u for u in leer_coleccion(db, "usuarios")},
        leer_coleccion(db, "asistencias"),
        leer_coleccion(db, "prestamos"),
    )


def comando_buscar(db, args):
    """Busca estudiantes por cédula (exacta o parcial) o por nombre y muestra
    su estado (portal, comedor, biblioteca)."""
    estudiantes, usuarios, asistencias, prestamos = _cargar_datos(args)

    busqueda = (args.busqueda or "").strip().lower()
    if not busqueda:
        sys.exit("Indica una cédula o un nombre, p. ej.:  python comeid.py buscar 123456789")
    coincidencias = [
        e for e in estudiantes
        if busqueda in str(e.get("cedula") or "").lower()
        or busqueda in (e.get("nombre") or "").lower()
    ]
    if not coincidencias:
        print(f"Sin resultados para: {args.busqueda}")
        return

    hoy = datetime.date.today().isoformat()
    print(f"=== BUSCAR ESTUDIANTE: {args.busqueda} ({len(coincidencias)} coincidencia(s)) ===")
    for e in coincidencias:
        eid = e.get("id")
        nombre = e.get("nombre") or "—"
        cedula = e.get("cedula") or "—"
        uid = e.get("uid") or ""
        correo = e.get("correo") or ""
        cuenta = usuarios.get(uid) if uid else None
        print("----------------------------------------")
        print(f"  Estudiante: {nombre}  ({cedula})")
        print(f"  Sección:    {e.get('seccion') or '—'}   Nivel: {e.get('nivel') or '—'}")
        print(f"  Tipo:       {e.get('tipo') or '—'}")
        if uid:
            estado = "VINCULADO al portal" if cuenta else "vinculado (uid) pero SIN perfil usuarios/{uid}"
            print(f"  Portal:     {estado}   correo: {correo or '—'}")
        else:
            print("  Portal:     SIN cuenta del portal (puede registrarse solo en comeid-estudiantes.web.app)")
        consumos = [a for a in asistencias if str(a.get("cedula") or "").lower() == str(cedula).lower()]
        prest = [p for p in prestamos if str(p.get("prestamistaId") or "") == str(eid or "")]
        activos = [p for p in prest if not p.get("devuelto")]
        atrasados = [p for p in activos if p.get("fechaVencimiento") and p["fechaVencimiento"] < hoy]
        print(f"  Comedor:    {len(consumos)} consumo(s)")
        print(f"  Biblioteca: {len(activos)} préstamo(s) activo(s), {len(atrasados)} atrasado(s)")
        for p in atrasados[:3]:
            print(f"      - {p.get('libroTitulo') or '—'} vence el {p.get('fechaVencimiento')}")


def comando_revisar(db, args):
    """Revisa la consistencia de los datos: asistencias con cédula que no
    coincide con ningún estudiante, préstamos sin estudiante válido y
    cédulas duplicadas."""
    estudiantes, usuarios, asistencias, prestamos = _cargar_datos(args)
    cedulas = {str(e.get("cedula") or "").strip() for e in estudiantes}
    ids = {str(e.get("id") or "") for e in estudiantes}
    print("=== REVISIÓN DE DATOS ===")
    problemas = 0
    for a in asistencias:
        ac = str(a.get("cedula") or "").strip()
        if ac and ac not in cedulas:
            problemas += 1
            print(f"  [asistencia {a.get('id')}] cédula '{ac}' no coincide con ningún estudiante (fecha {a.get('fecha')}, nombre {a.get('estudiante') or '—'})")
    for p in prestamos:
        pid = str(p.get("prestamistaId") or "")
        if str(p.get("tipoPrestamista") or "").lower() == "estudiante" and pid and pid not in ids:
            problemas += 1
            print(f"  [préstamo {p.get('id')}] prestamistaId '{pid}' no existe en estudiantes ({p.get('libroTitulo') or '—'})")
    vistos = {}
    for e in estudiantes:
        cc = str(e.get("cedula") or "").strip()
        if cc:
            vistos.setdefault(cc, []).append(e.get("nombre") or "—")
    for cc, nombres in vistos.items():
        if len(nombres) > 1:
            problemas += 1
            print(f"  [estudiantes] cédula duplicada '{cc}': {nombres}")
    if problemas == 0:
        print("  Sin problemas detectados.")
    else:
        print(f"Total: {problemas} problema(s) detectado(s).")


def main():
    parser = argparse.ArgumentParser(description="ComeID - Herramienta de administración en Python")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_resp = sub.add_parser("respaldar", help="Exporta todas las colecciones a respaldo/")
    p_resp.set_defaults(func=comando_respaldar)

    p_res = sub.add_parser("restaurar", help="Restaura desde un respaldo")
    p_res.add_argument("archivo")
    p_res.set_defaults(func=comando_restaurar)

    p_imp = sub.add_parser("importar_libros", help="Importa el catálogo desde CSV")
    p_imp.add_argument("csv")
    p_imp.set_defaults(func=comando_importar_libros)

    p_rep = sub.add_parser("reporte", help="Resumen de biblioteca y comedor")
    p_rep.set_defaults(func=comando_reporte)

    p_pre = sub.add_parser("predecir", help="Predicción de demanda")
    p_pre.add_argument("--guardar", action="store_true", help="Guarda en Firestore")
    p_pre.set_defaults(func=comando_predecir)

    p_cor = sub.add_parser("correos", help="Avisos de vencimientos/reservas")
    p_cor.add_argument("--simular", action="store_true", help="No envía correos, solo avisos en la app")
    p_cor.add_argument("--destino", help="Correo de prueba (los destinatarios sin correo lo usan)")
    p_cor.set_defaults(func=comando_correos)

    p_vin = sub.add_parser("vincular", help="Crea cuentas del portal para estudiantes sin cuenta (migración)")
    p_vin.add_argument("--clave", default="", help="Contraseña temporal para las cuentas nuevas")
    p_vin.add_argument("--simular", action="store_true", help="Solo muestra lo que haría, no guarda nada")
    p_vin.set_defaults(func=comando_vincular)

    p_bus = sub.add_parser("buscar", help="Busca estudiantes por cédula o nombre y muestra su estado")
    p_bus.add_argument("busqueda", help="Cédula o nombre (acepta parte de la cédula)")
    p_bus.add_argument("--respaldo", default="", help="Archivo de respaldo JSON local (no requiere serviceAccount.json)")
    p_bus.set_defaults(func=comando_buscar)

    p_rev = sub.add_parser("revisar", help="Detecta datos inconsistentes (cédulas sin estudiante, duplicados)")
    p_rev.add_argument("--respaldo", default="", help="Archivo de respaldo JSON local (no requiere serviceAccount.json)")
    p_rev.set_defaults(func=comando_revisar)

    args = parser.parse_args()
    if getattr(args, "respaldo", None):
        args.func(None, args)
    else:
        db = inicializar()
        args.func(db, args)


if __name__ == "__main__":
    main()
