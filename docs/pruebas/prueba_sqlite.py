"""Pruebas del esquema SQLite local (local/sqlite_esquema.sql) con el módulo estándar sqlite3.
Uso: python3 -I prueba_sqlite.py <ruta a sqlite_esquema.sql>
Termina con código 0 si todo pasa; si no, imprime «FALLO: ...» y termina con 1."""
import sqlite3
import sys
import uuid
from pathlib import Path

ruta = Path(sys.argv[1])
db = sqlite3.connect(":memory:")
db.executescript(ruta.read_text(encoding="utf-8"))
db.execute("PRAGMA foreign_keys = ON")
db.isolation_level = None  # control explícito

oks = 0


def ok(msg):
    global oks
    oks += 1
    print(f"ok   - {msg}")


def fallo(msg):
    print(f"FALLO: {msg}")
    sys.exit(1)


def uid():
    return str(uuid.uuid4())


def rechaza(sql, params, esperado, msg):
    """Exige que la sentencia falle y que el error contenga `esperado`."""
    try:
        db.execute("SAVEPOINT p")
        db.execute(sql, params)
    except sqlite3.IntegrityError as e:
        db.execute("ROLLBACK TO p")
        db.execute("RELEASE p")
        if esperado and esperado not in str(e):
            fallo(f"{msg}: error distinto ({e})")
        ok(f"{msg} [{str(e).splitlines()[0][:70]}]")
        return
    db.execute("ROLLBACK TO p")
    db.execute("RELEASE p")
    fallo(f"{msg}: no falló")


def acepta(sql, params, msg):
    try:
        db.execute(sql, params)
    except sqlite3.Error as e:
        fallo(f"{msg}: {e}")
    ok(msg)


def escalar(sql, params=()):
    return db.execute(sql, params).fetchone()[0]


TS = "2026-11-09T15:04:05.123Z"

# ---------------------------------------------------------------- estructura
tablas = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
esperadas = {
    "profile", "user_preference", "kanban_column", "card", "label", "card_label", "uploaded_image", "theme",
    "applied_theme", "widget", "theme_widget", "widget_carousel_item",
    "catalog_template", "catalog_font", "catalog_palette", "catalog_image", "catalog_animation", "catalog_color",
    "pending_change", "sync_state", "device_setting", "local_file", "file_upload_queue", "external_widget_cache",
}
if tablas != esperadas:
    fallo(f"tablas distintas: faltan {esperadas - tablas}, sobran {tablas - esperadas}")
ok(f"{len(tablas)} tablas: 12 sincronizadas, 6 de catálogo en caché y 6 solo locales")
if escalar("PRAGMA journal_mode") != "memory":  # en memoria no hay WAL; se comprueba el texto del esquema
    pass
if "journal_mode = WAL" not in ruta.read_text(encoding="utf-8"):
    fallo("el esquema debe activar WAL")
ok("el esquema activa journal_mode = WAL y synchronous = NORMAL (RNF-14)")
if escalar("PRAGMA foreign_keys") != 1:
    fallo("foreign_keys desactivado")
ok("foreign_keys = ON")

# ---------------------------------------------------------------- catálogo y cuenta mínimos
db.execute("INSERT INTO catalog_font VALUES ('inter','Inter','Inter','fonts/inter.woff2','OFL-1.1',1,1,?)", (TS,))
db.execute("INSERT INTO catalog_template VALUES ('default','Windgets','t','b','bg','#00D9E2','#DC026C','#FFFFFF','inter',1,1,1,1,?)", (TS,))
for cid, hexa in [("gray", "#8A8D98"), ("red", "#E5484D"), ("blue", "#3E63DD")]:
    db.execute("INSERT INTO catalog_color VALUES (?,?,?,1,1,?)", (cid, cid, hexa, TS))
db.execute("INSERT INTO catalog_image VALUES ('img1','Img','p','t',100,100,1,1,?)", (TS,))
db.execute("INSERT INTO catalog_animation VALUES ('an1','An','p','t','lottie',1,1,?)", (TS,))
U = uid()
db.execute("INSERT INTO profile VALUES (?,?,?,?,?)", (U, "Ana", "email", TS, 1))
db.execute("INSERT INTO user_preference (id,user_id,created_at) VALUES (?,?,?)", (U, U, TS))
ok("catálogo, perfil y preferencias mínimos insertados")

rechaza("INSERT INTO catalog_template VALUES ('otra','O','t','b','bg','#000000','#000000','#000000','inter',1,1,1,1,?)", (TS,), "UNIQUE", "una sola plantilla por defecto")
rechaza("INSERT INTO catalog_animation VALUES ('a2','A','p','t','gif',1,1,?)", (TS,), "CHECK", "formato de animación fuera de lottie/webm")
rechaza("UPDATE user_preference SET board_card_view = 'huge'", (), "CHECK", "vista de tarjetas inválida")
rechaza("INSERT INTO profile VALUES (?,?,?,?,?)", (uid(), "x" * 31, "email", TS, 1), "CHECK", "alias de 31 caracteres")
rechaza("INSERT INTO profile VALUES (?,?,?,?,?)", (uid(), "   ", "email", TS, 1), "CHECK", "alias de solo espacios")

# ---------------------------------------------------------------- columnas
def col(nombre, rol="custom", pos=1, color="gray", cid=None):
    return ("INSERT INTO kanban_column (id,user_id,created_at,name,color_id,role,position) VALUES (?,?,?,?,?,?,?)",
            (cid or uid(), U, TS, nombre, color, rol, pos))


TODO, DONE, PROG = uid(), uid(), uid()
db.execute(*col("Por hacer", "todo", 1, cid=TODO))
db.execute(*col("En progreso", "in_progress", 2, cid=PROG))
db.execute(*col("Hecho", "done", 3, cid=DONE))
rechaza(*col("  por HACER "), "UNIQUE", "columna: nombre repetido sin distinguir mayúsculas")
rechaza(*col("Otra", "todo"), "UNIQUE", "columna: segunda función «todo»")
rechaza(*col(""), "CHECK", "columna: nombre vacío")
rechaza(*col("c" * 31), "CHECK", "columna: nombre de 31 caracteres")
rechaza(*col("Rara", color="nope"), "FOREIGN KEY", "columna: color fuera del catálogo")
rechaza(*col("Rara", "extra"), "CHECK", "columna: función desconocida")
for i in range(7):
    db.execute(*col(f"Col {i}", pos=10 + i))
rechaza(*col("Col 11"), "limit_columns", "columna: la 11.ª se rechaza (máximo 10)")
rechaza("DELETE FROM kanban_column WHERE id = ?", (DONE,), "invalid_field", "columna «Hecho» no se elimina")
acepta("DELETE FROM kanban_column WHERE name = 'Col 0'", (), "columna personalizada sí se elimina")
acepta(*col("Col 0", pos=99), "tras eliminar una, se puede crear otra")

# ---------------------------------------------------------------- tarjetas
def card(titulo="ok", cid=None, extra=None):
    cols = {"id": cid or uid(), "user_id": U, "created_at": TS, "title": titulo, "due_date": "2026-12-01",
            "column_id": TODO, "position": 1}
    cols.update(extra or {})
    return (f"INSERT INTO card ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", tuple(cols.values()))


C1 = uid()
acepta(*card("ñ" * 100, C1, {"description": "d" * 1000}), "tarjeta: título de 100 caracteres y descripción de 1000")
rechaza(*card(""), "CHECK", "tarjeta: título vacío")
rechaza(*card("   "), "CHECK", "tarjeta: título de espacios")
rechaza(*card("x" * 101), "CHECK", "tarjeta: título de 101 caracteres")
rechaza(*card(extra={"description": "d" * 1001}), "CHECK", "tarjeta: descripción de 1001 caracteres")
rechaza(*card(extra={"priority": "urgent"}), "CHECK", "tarjeta: prioridad inválida")
rechaza(*card(extra={"type": "nota"}), "CHECK", "tarjeta: tipo inválido")
rechaza(*card(extra={"due_date": "2026-13-45"}), "CHECK", "tarjeta: fecha límite imposible")
rechaza(*card(extra={"due_date": "01/12/2026"}), "CHECK", "tarjeta: fecha límite en otro formato")
rechaza(*card(extra={"scheduled_date": "2026-12-01", "scheduled_hour": 24}), "CHECK", "tarjeta: bloque horario 24")
rechaza(*card(extra={"scheduled_date": "2026-12-01"}), "CHECK", "tarjeta: fecha de bloque sin hora")
rechaza(*card(extra={"scheduled_date": "2026-12-02", "scheduled_hour": 9}), "CHECK", "tarjeta: bloque posterior a la fecha límite")
rechaza(*card(extra={"created_at": "2026-11-09 15:04:05"}), "CHECK", "tarjeta: created_at fuera del formato RFC 3339 UTC con «Z»")
rechaza(*card(extra={"field_mods": "no es json"}), "CHECK", "tarjeta: field_mods debe ser JSON válido")
rechaza(*card(extra={"column_id": uid()}), "FOREIGN KEY", "tarjeta: columna inexistente")
acepta(*card(extra={"scheduled_date": "2026-12-01", "scheduled_hour": 23}), "tarjeta: bloque 23:00 el día de la fecha límite")

# ---------------------------------------------------------------- etiquetas y uniones
def etq(nombre, lid=None, color="red"):
    return ("INSERT INTO label (id,user_id,created_at,name,color_id) VALUES (?,?,?,?,?)", (lid or uid(), U, TS, nombre, color))


L1 = uid()
db.execute(*etq("Trabajo", L1))
rechaza(*etq(" TRABAJO"), "UNIQUE", "etiqueta: nombre repetido sin distinguir mayúsculas")
rechaza(*etq("x" * 31), "CHECK", "etiqueta: nombre de 31 caracteres")
for i in range(2, 21):
    db.execute(*etq(f"Etiqueta {i}"))
rechaza(*etq("Etiqueta 21"), "limit_labels", "etiqueta: la 21.ª se rechaza (máximo 20)")

labels = [r[0] for r in db.execute("SELECT id FROM label ORDER BY name LIMIT 6")]
for l in labels[:5]:
    db.execute("INSERT INTO card_label (id,user_id,created_at,card_id,label_id) VALUES (?,?,?,?,?)", (uid(), U, TS, C1, l))
rechaza("INSERT INTO card_label (id,user_id,created_at,card_id,label_id) VALUES (?,?,?,?,?)", (uid(), U, TS, C1, labels[5]),
        "limit_card_labels", "tarjeta: la 6.ª etiqueta se rechaza (máximo 5)")
C2 = uid()
db.execute(*card("Otra", C2))
db.execute("INSERT INTO card_label (id,user_id,created_at,card_id,label_id) VALUES (?,?,?,?,?)", (uid(), U, TS, C2, labels[0]))
rechaza("INSERT INTO card_label (id,user_id,created_at,card_id,label_id) VALUES (?,?,?,?,?)", (uid(), U, TS, C2, labels[0]),
        "UNIQUE", "card_label: la misma unión no se repite")
acepta("DELETE FROM label WHERE id = ?", (labels[0],), "eliminar una etiqueta")
if escalar("SELECT count(*) FROM card_label WHERE card_id = ?", (C1,)) != 4 or escalar("SELECT count(*) FROM card_label WHERE card_id = ?", (C2,)) != 0:
    fallo("cascada: al eliminar la etiqueta debían quitarse sus card_label")
ok("cascada: eliminar la etiqueta quita sus card_label y la tarjeta sigue (HE-08-HU04-ET06)")
db.execute("DELETE FROM card WHERE id = ?", (C1,))
if escalar("SELECT count(*) FROM card_label WHERE card_id = ?", (C1,)) != 0:
    fallo("cascada: al eliminar la tarjeta debían quitarse sus card_label")
ok("cascada: eliminar la tarjeta quita sus card_label (HE-07-HU05-ET04)")

# ---------------------------------------------------------------- imágenes propias
IM = uid()
def img(**kw):
    c = {"id": IM, "user_id": U, "created_at": TS, "storage_path": f"{U}/{IM}.png", "mime_type": "image/png",
         "extension": "png", "size_bytes": 20971520, "width": 10, "height": 10, "sha256": "a" * 64}
    c.update(kw)
    return (f"INSERT INTO uploaded_image ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


acepta(*img(), "imagen propia: 20 MB exactos")
db.execute("DELETE FROM uploaded_image")
rechaza(*img(size_bytes=20971521), "CHECK", "imagen propia: 20 MB + 1 byte")
rechaza(*img(size_bytes=0), "CHECK", "imagen propia: 0 bytes")
rechaza(*img(mime_type="image/gif", extension="gif", storage_path=f"{U}/{IM}.gif"), "CHECK", "imagen propia: GIF")
rechaza(*img(mime_type="image/jpeg"), "CHECK", "imagen propia: MIME incoherente con la extensión")
rechaza(*img(sha256="abc"), "CHECK", "imagen propia: sha256 corto")
rechaza(*img(sha256="Z" * 64), "CHECK", "imagen propia: sha256 no hexadecimal")
rechaza(*img(storage_path="otra/ruta.png"), "CHECK", "imagen propia: ruta distinta de {user_id}/{id}.{ext}")
db.execute(*img())

# ---------------------------------------------------------------- temas
def tema(nombre, tid=None, **kw):
    c = {"id": tid or uid(), "user_id": U, "created_at": TS, "name": nombre, "template_id": "default",
         "color_primary": "#00d9e2", "color_secondary": "#DC026C", "color_text": "#FFFFFF", "font_id": "inter",
         "last_modified_at": TS}
    c.update(kw)
    return (f"INSERT INTO theme ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


T1 = uid()
db.execute(*tema("Mi tema", T1))
if escalar("SELECT color_primary FROM theme WHERE id = ?", (T1,)) != "#00D9E2":
    fallo("el color debía guardarse en mayúsculas")
ok("tema: el color se guarda en mayúsculas")
rechaza(*tema("mi TEMA"), "UNIQUE", "tema: nombre repetido sin distinguir mayúsculas")
rechaza(*tema("t" * 41), "CHECK", "tema: nombre de 41 caracteres")
rechaza(*tema("A", color_primary="#12345G"), "CHECK", "tema: color con carácter no hexadecimal")
rechaza(*tema("A", color_text="FFFFFF"), "CHECK", "tema: color sin #")
rechaza(*tema("A", color_secondary="#FFF"), "CHECK", "tema: color de 3 dígitos")
rechaza(*tema("A", font_size="huge"), "CHECK", "tema: tamaño de fuente inválido")
rechaza(*tema("A", background_source="own"), "CHECK", "tema: fondo propio sin imagen")
rechaza(*tema("A", background_source="catalog"), "CHECK", "tema: fondo de catálogo sin imagen")
acepta(*tema("Con fondo", background_source="catalog", background_catalog_image_id="img1"), "tema: fondo de catálogo con imagen")
for i in range(3, 11):
    db.execute(*tema(f"Tema {i}"))
rechaza(*tema("Tema 11"), "limit_themes", "tema: el 11.º se rechaza (máximo 10)")
db.execute("INSERT INTO applied_theme (id,user_id,created_at,theme_id,template_id,color_primary,color_secondary,color_text,font_id,applied_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
           (U, U, TS, T1, "default", "#00D9E2", "#DC026C", "#FFFFFF", "inter", TS))
rechaza("DELETE FROM theme WHERE id = ?", (T1,), "applied_theme", "el tema aplicado no se elimina")
rechaza("UPDATE applied_theme SET color_text = 'blanco'", (), "CHECK", "tema aplicado: color inválido")
rechaza("INSERT INTO applied_theme (id,user_id,created_at,theme_id,template_id,color_primary,color_secondary,color_text,font_id,applied_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (uid(), U, TS, T1, "default", "#00D9E2", "#DC026C", "#FFFFFF", "inter", TS), "CHECK", "tema aplicado: id debe ser user_id")

# ---------------------------------------------------------------- widgets
def wid(tipo, wid_=None, **kw):
    c = {"id": wid_ or uid(), "user_id": U, "created_at": TS, "type": tipo,
         "is_default": 1 if tipo in ("clock", "calendar", "daily_tasks", "kanban") else 0}
    c.update(kw)
    return (f"INSERT INTO widget ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


WCLOCK = uid()
for tipo in ("clock", "calendar", "daily_tasks", "kanban"):
    db.execute(*wid(tipo, WCLOCK if tipo == "clock" else None))
rechaza(*wid("clock"), "UNIQUE", "widget: segundo Reloj (D-038)")
rechaza(*wid("text", text_content=""), "CHECK", "widget Texto: vacío")
rechaza(*wid("text", text_content="x" * 201), "CHECK", "widget Texto: 201 caracteres")
acepta(*wid("text", text_content="x" * 200), "widget Texto: 200 caracteres")
acepta(*wid("text", text_content="otro"), "widget Texto: varios permitidos")
db.execute(*wid("news"))
rechaza(*wid("news"), "UNIQUE", "widget Noticias: una sola vez")
rechaza(*wid("clock", is_default=0), "CHECK", "widget: Reloj siempre es por defecto")
rechaza(*wid("hologram"), "CHECK", "widget: tipo desconocido")
db.execute(*wid("weather", weather_city="Popayán", weather_geo_id="g1", weather_latitude=2.4, weather_longitude=-76.6))
rechaza(*wid("weather", weather_city="Otra", weather_geo_id="g1", weather_latitude=2.4, weather_longitude=-76.6), "UNIQUE", "widget Clima: misma ciudad")
rechaza(*wid("weather", weather_city="X", weather_geo_id="g2", weather_latitude=91, weather_longitude=0), "CHECK", "widget Clima: latitud fuera de rango")
rechaza(*wid("weather", weather_geo_id="g3", weather_latitude=1, weather_longitude=1), "CHECK", "widget Clima: ciudad obligatoria")
rechaza(*wid("image_carousel", carousel_interval_seconds=2), "CHECK", "carrusel: 2 s")
rechaza(*wid("image_carousel", carousel_interval_seconds=61), "CHECK", "carrusel: 61 s")
rechaza(*wid("image_carousel"), "CHECK", "carrusel: intervalo obligatorio (el Núcleo envía 5 s por defecto)")
CAR = uid()
acepta(*wid("image_carousel", CAR, carousel_interval_seconds=5), "carrusel: 5 s")
rechaza(*wid("static_image", static_image_source="own"), "CHECK", "imagen estática: fuente propia sin imagen")
acepta(*wid("static_image", static_image_source="own", static_uploaded_image_id=IM), "imagen estática con imagen propia")
rechaza(*wid("animation"), "CHECK", "animación sin animación elegida")
acepta(*wid("animation", animation_id="an1"), "animación con animación del catálogo")
rechaza("DELETE FROM widget WHERE id = ?", (WCLOCK,), "invalid_field", "widget por defecto no se elimina")

# ---------------------------------------------------------------- widget del tema y carrusel
def tw(**kw):
    c = {"id": uid(), "user_id": U, "created_at": TS, "theme_id": T1, "widget_id": WCLOCK, "x": 0, "y": 0,
         "width": 100, "height": 100, "ref_width": 1920, "ref_height": 1080}
    c.update(kw)
    return (f"INSERT INTO theme_widget ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


rechaza(*tw(width=99), "CHECK", "widget del tema: ancho 99")
rechaza(*tw(height=99), "CHECK", "widget del tema: alto 99")
rechaza(*tw(x=-1), "CHECK", "widget del tema: x negativa")
db.execute(*tw())
rechaza(*tw(), "UNIQUE", "widget del tema: una fila por (tema, widget)")
db.execute("DELETE FROM widget WHERE type = 'news'")
db.execute("DELETE FROM widget WHERE id = ? AND is_default = 0", (CAR,))
if escalar("SELECT count(*) FROM theme_widget") != 1:
    fallo("no debía cambiar theme_widget del Reloj")
ok("eliminar widgets no por defecto no toca los de otros")

CAR = uid()
db.execute(*wid("image_carousel", CAR, carousel_interval_seconds=5))
def item(widget, i, **kw):
    c = {"id": uid(), "user_id": U, "created_at": TS, "widget_id": widget, "source": "catalog",
         "catalog_image_id": "img1", "position": i}
    c.update(kw)
    return (f"INSERT INTO widget_carousel_item ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


rechaza(*item(WCLOCK, 1), "invalid_field", "carrusel: la imagen solo cuelga de un widget Carrusel")
rechaza(*item(CAR, 1, source="own"), "CHECK", "carrusel: fuente propia con imagen de catálogo")
for i in range(10):
    db.execute(*item(CAR, i))
rechaza(*item(CAR, 11), "limit_carousel_items", "carrusel: la 11.ª imagen se rechaza (máximo 10)")
db.execute("DELETE FROM widget WHERE id = ?", (CAR,))
if escalar("SELECT count(*) FROM widget_carousel_item") != 0:
    fallo("cascada del carrusel")
ok("cascada: eliminar el carrusel quita sus imágenes")

# ---------------------------------------------------------------- solo locales
db.execute("INSERT INTO file_upload_queue (uploaded_image_id,local_path,created_at) VALUES (?,?,?)", (IM, "uploads/a.png", TS))
rechaza("INSERT INTO file_upload_queue (uploaded_image_id,local_path,created_at) VALUES (?,?,?)", (IM, "../fuera.png", TS), "CHECK", "cola de subida: ruta con ..")
rechaza("INSERT INTO file_upload_queue (uploaded_image_id,local_path,created_at,status) VALUES (?,?,?,?)", (IM, "a", TS, "raro"), "CHECK", "cola de subida: estado inválido")

def pend(kind="card", eid=None, op="upsert", fields="{}", **kw):
    c = {"entity_kind": kind, "entity_id": eid or uid(), "op": op, "fields": fields, "modified_at": TS, "created_at": TS}
    c.update(kw)
    return (f"INSERT INTO pending_change ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


E = uid()
db.execute(*pend(eid=E, fields='{"title":{"value":"a","modified_at":"%s"}}' % TS))
rechaza(*pend(eid=E), "UNIQUE", "cola: un cambio pendiente por entidad (los sucesivos se funden)")
rechaza(*pend(kind="profile"), "CHECK", "cola: profile no se envía (solo bajada)")
rechaza(*pend(kind="catalog_color"), "CHECK", "cola: los catálogos no se envían")
rechaza(*pend(op="update"), "CHECK", "cola: operación inválida")
rechaza(*pend(fields="{no json"), "CHECK", "cola: fields debe ser JSON")
rechaza(*pend(attempts=-1), "CHECK", "cola: intentos negativos")
rechaza(*pend(modified_at="ayer"), "CHECK", "cola: modified_at fuera de formato")
a = db.execute(*pend()).lastrowid
b = db.execute(*pend()).lastrowid
if not (b > a):
    fallo("el id de la cola debe crecer (orden de envío)")
ok("cola: el id autoincremental define el orden de envío")
db.execute("UPDATE pending_change SET depends_on_upload_id = 1 WHERE id = ?", (a,))
db.execute("DELETE FROM file_upload_queue")
if escalar("SELECT depends_on_upload_id FROM pending_change WHERE id = ?", (a,)) is not None:
    fallo("depends_on_upload_id debía quedar nulo")
ok("cola: al terminar la subida el cambio queda libre para enviarse")

DEV = uid()
db.execute("INSERT INTO sync_state (user_id,device_id) VALUES (?,?)", (U, DEV))
if db.execute("SELECT id,last_pulled_seq,clock_offset_ms,status,catalog_version FROM sync_state").fetchone() != (1, 0, 0, "synced", 0):
    fallo("valores por defecto de sync_state")
ok("sync_state: valores por defecto (id 1, cursor 0, sincronizado)")
rechaza("INSERT INTO sync_state (id,user_id,device_id) VALUES (2,?,?)", (U, DEV), "CHECK", "sync_state: una sola fila")
rechaza("UPDATE sync_state SET status = 'roto'", (), "CHECK", "sync_state: estado inválido")
acepta("UPDATE sync_state SET last_pulled_seq = 42, status = 'offline', last_sync_at = ?", (TS,), "sync_state: se actualiza el cursor y el estado")

acepta("INSERT INTO device_setting VALUES ('last_screen', '\"calendar\"', ?)", (TS,), "device_setting: última pantalla (D-156)")
rechaza("INSERT INTO device_setting VALUES ('x', 'no json', ?)", (TS,), "CHECK", "device_setting: valor JSON válido")

def lf(**kw):
    c = {"id": uid(), "kind": "font", "ref_id": "inter", "remote_path": "fonts/inter.woff2", "local_path": "fonts/inter.woff2",
         "size_bytes": 100, "sha256": "a" * 64, "downloaded_at": TS, "last_used_at": TS, "pinned": 1}
    c.update(kw)
    return (f"INSERT INTO local_file ({','.join(c)}) VALUES ({','.join('?' * len(c))})", tuple(c.values()))


db.execute(*lf())
rechaza(*lf(), "UNIQUE", "local_file: un registro por (tipo, referencia)")
rechaza(*lf(ref_id="b", local_path="../../Windows/x"), "CHECK", "local_file: rutas con .. rechazadas (RNF-22)")
rechaza(*lf(ref_id="c", kind="script"), "CHECK", "local_file: tipo de archivo inválido")
rechaza(*lf(ref_id="d", size_bytes=0), "CHECK", "local_file: tamaño 0")

acepta("INSERT INTO external_widget_cache VALUES (?, '{\"temp\":18}', ?, 'ok', NULL)", (WCLOCK, TS), "caché de widgets externos")
rechaza("INSERT INTO external_widget_cache VALUES (?, '{}', ?, 'raro', NULL)", (WCLOCK, TS), "CHECK", "caché externa: estado inválido")

# Al cerrar sesión se borra todo de la cuenta (D-190): borrar el perfil limpia las entidades por cascada
db.execute("DELETE FROM pending_change"); db.execute("DELETE FROM file_upload_queue")
db.execute("DELETE FROM profile WHERE user_id = ?", (U,))
resto = sum(escalar(f"SELECT count(*) FROM {t}") for t in ("user_preference", "kanban_column", "card", "label", "card_label",
            "uploaded_image", "theme", "applied_theme", "widget", "theme_widget", "widget_carousel_item"))
if resto != 0:
    # los widgets por defecto se protegen contra DELETE directo, pero no contra la cascada del perfil
    fallo(f"borrar el perfil dejó {resto} filas")
ok("borrar la cuenta local elimina por cascada todas las entidades (D-190)")

print(f"\nSQLite: {oks} comprobaciones correctas")
