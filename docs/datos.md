# Datos

## Resumen

- **Nube**: PostgreSQL de Supabase con seguridad por fila (RLS), funciones de sincronización (`sync_push`, `sync_pull`, `catalog_pull`, `email_is_registered`, `server_time`, `keepalive`), disparadores, Storage y datos semilla.
- **Computador**: SQLite 3.35 o superior (`foreign_keys` activo, WAL, `synchronous = NORMAL`) en `%APPDATA%\Windgets\windgets.db`, con las mismas entidades sincronizadas más las tablas solo locales (`pending_change`, `sync_state`, `device_setting`, `local_file`, `file_upload_queue`, `external_widget_cache`).
- **Una sola base local**, la de la cuenta con sesión iniciada; se borra al cerrar sesión (D-190).
- **Sincronización**: cada escritura local se guarda en SQLite y en `pending_change` en la misma transacción; el servidor combina por campo (D-048, D-189).

## Archivos ejecutables

| Archivo | Contenido |
|---|---|
| `supabase/migrations/0001_esquema.sql` | Tipos, tablas, claves, CHECK, UNIQUE e índices. |
| `supabase/migrations/0002_rls.sql` | RLS y permisos. |
| `supabase/migrations/0003_funciones.sql` | Disparadores, `sync_push`, `sync_pull`, `keepalive`, semilla por cuenta y purgas. |
| `supabase/migrations/0004_storage.sql` | Buckets y políticas de Storage. |
| `supabase/seed.sql` | Catálogos y valores por defecto. |
| `local/sqlite_esquema.sql` | Base local del Núcleo. |
| `pruebas/` | `ejecutar_pruebas.sh`, `pruebas.sql`, `prueba_sqlite.py` y el sustituto mínimo de Supabase (solo pruebas). |
| `img/er_*.png`, `img/er_*.svg` | Ocho diagramas entidad-relación (nube y base local), generados desde los SQL. |
| `windgets_nube.dbml`, `windgets_local.dbml` | Esquemas en DBML, para importar en dbdiagram.io. |

Al montar el repositorio: copia `supabase/` a `supabase/` de la raíz y `local/sqlite_esquema.sql` a `apps/desktop/src-tauri/` (el Núcleo lo ejecuta al crear la base local).

Los valores semilla de los catálogos (nombres, colores, tipografías, paletas y geometría de los widgets por defecto) son propuestas mínimas y usables; el catálogo de imágenes y el de animaciones están vacíos hasta que se carguen los archivos.

<!-- ANEXO GENERADO -->

## Modelo · 1. Identificadores y abreviaturas

| Sigla | Significado |
| --- | --- |
| HE-nn, CD-nn | Épica del backlog (HE-01 Cuentas … HE-17 Ciclo de vida de la ventana) y componente de distribución (CD-01 Landing page, CD-02 Instalador). |
| HE-nn-HUnn, -CAnn, -ETnn | Historia de usuario, criterio de aceptación y especificación técnica de esa historia. |
| RNF-nn, RT-nn | Requisito no funcional y regla transversal del backlog. |
| D-nnn | Decisión del proyecto (D-048 combinación por campo, D-049 sincronización incremental, D-188 reglas en el Núcleo, D-189 combinación solo en el servidor, D-190 datos locales al cerrar sesión, D-192 secretos y RLS, D-197 `keepalive`, D-198 catálogos). |
| H-D-nn, H-C-nn | Hueco que el backlog no define (se marca «Duda/propuesta»). |
| Núcleo | Proceso en Rust de la aplicación: reglas de negocio, SQLite local, sincronización. |
| RLS | Seguridad por fila de PostgreSQL. |
| RPC | Función de PostgreSQL llamada desde el cliente (`/rest/v1/rpc/<nombre>`). |
| LWW por campo | «Gana la hora de modificación más reciente de cada campo» (D-048). |

## Modelo · 2. Convenciones

- **Nombres en código** en inglés y `snake_case`; los valores enumerados son códigos en inglés (`task`, `todo`, `done`) y la interfaz muestra el nombre en español.
- **Identificadores.** Los genera el Núcleo (UUID v4) para crear sin conexión. `card_label.id` y `theme_widget.id` son UUID v5 deterministas de la pareja (padre, hijo); `user_preference.id` y `applied_theme.id` son el `user_id`; `profile` usa `user_id` como clave.
- **Tipos.** Longitudes en caracteres Unicode (`char_length`), no en bytes: la base debe ser UTF-8.

| PostgreSQL | SQLite |
| --- | --- |
| `uuid` | `TEXT` de 36 caracteres en minúsculas |
| `text` | `TEXT` |
| `smallint`, `integer`, `bigint` | `INTEGER` |
| `double precision` | `REAL` |
| `boolean` | `INTEGER` 0/1 |
| `date` | `TEXT` `YYYY-MM-DD` (fecha local del computador) |
| `timestamptz` | `TEXT` RFC 3339 UTC con milisegundos y `Z` |
| `jsonb` | `TEXT` con `json_valid()` |

- **Columnas de sincronización** (todas las entidades sincronizadas): `id`, `user_id` (dueño; por defecto `auth.uid()`), `created_at`, `field_mods` (hora de modificación por campo, JSON), `deleted_at` (eliminación lógica; solo PostgreSQL) y `updated_seq` (cursor de descarga tomado de la secuencia global `sync_seq`; no es una hora).
- **Eliminar.** En PostgreSQL la fila queda con `deleted_at` (tombstone) y se purga a los 90 días; en SQLite la fila se borra y la orden queda en la cola.

## Modelo · 3. Entidades

Los campos se citan por nombre en código; entre paréntesis, el término del glosario. Los límites están en las migraciones con su fuente (ET/CA/RNF/D) en comentarios.

### 3.1 Sincronizadas (PostgreSQL + SQLite)

| Tabla (término del glosario) | Campos propios y límites |
| --- | --- |
| `profile` (Perfil de la cuenta, Alias) | `alias` (`alias`, 1 a 30 caracteres, no único), `auth_provider` (`email`/`google`). Solo bajada: lo crea el servidor. |
| `user_preference` (Preferencias) | `board_card_view` (`compact`/`expanded`, por defecto `compact`). |
| `kanban_column` (Columna) | `name` (1 a 30, único por usuario sin distinguir mayúsculas), `color_id` → `catalog_color`, `role` (`todo`/`in_progress`/`done`/`custom`; una sola de cada función), `position`. Máximo 10 vivas. |
| `card` (Tarjeta) | `type` (`task`/`reminder`/`event`), `title` (1 a 100), `description` (hasta 1000), `priority` (`high`/`medium`/`low` o nula), `due_date` (Fecha límite), `column_id`, `previous_column_id`, `position`, `completed_on` (Fecha de completado), `scheduled_date` y `scheduled_hour` (Bloque horario, 0 a 23, siempre juntos y no posterior a `due_date`). |
| `label` (Etiqueta) | `name` (1 a 30, único), `color_id` (obligatorio, sin valor por defecto). Máximo 20 vivas. |
| `card_label` (Etiqueta de la tarjeta) | `card_id`, `label_id`; único por pareja. Máximo 5 vivas por tarjeta. |
| `uploaded_image` (Imagen propia) | `storage_path` (`{user_id}/{id}.{ext}`), `mime_type` (`image/jpeg`/`image/png`), `extension`, `size_bytes` (hasta 20 971 520), `width`, `height`, `sha256`. |
| `theme` (Tema) | `name` (1 a 40, único), `template_id`, `background_source` (`template_default`/`catalog`/`own`) con su imagen, tres colores `#RRGGBB` (se guardan en mayúsculas), `palette_id` (nulo = «Personalizada»), `font_id`, `font_size` (`small`/`medium`/`large`), `last_modified_at`. Máximo 10 vivos. |
| `applied_theme` (Tema aplicado) | `theme_id` y la copia del contenido aplicado (plantilla, fondo, colores, tipografía, tamaño), `applied_at`. No se elimina. |
| `widget` (Widget) | `type` (11 tipos), `is_default` (solo Reloj, Calendario, Tareas del día y Kanban), campos propios por tipo: Clima (`weather_city` 1 a 100, `weather_geo_id`, `weather_latitude`, `weather_longitude`), Texto (`text_content` 1 a 200), Imagen estática, Animación (`animation_id`), Carrusel de imágenes (`carousel_interval_seconds` 3 a 60; 5 si no se indica). Los campos de otro tipo deben ser nulos. |
| `theme_widget` (Widget del tema) | `theme_id`, `widget_id`, `is_active`, `x`, `y` (≥ 0), `width`, `height` (≥ 100), `ref_width`, `ref_height`; único por (tema, widget). |
| `widget_carousel_item` (Imagen del Carrusel de imágenes) | `widget_id` (debe ser un Carrusel de imágenes), `source` (`catalog`/`own`) con su imagen, `position`. Máximo 10 vivas. |

### 3.2 Catálogos (PostgreSQL de lectura + caché SQLite)

`catalog_template` (Catálogo de plantillas; una sola `is_default`), `catalog_font` (Catálogo de tipografías), `catalog_palette` (Catálogo de paletas), `catalog_image` (Catálogo de imágenes), `catalog_animation` (Catálogo de animaciones; formato `lottie`/`webm`), `catalog_color` (Catálogo de colores; debe existir `gray`) y `catalog_meta` (Versión de los catálogos; una sola fila). En SQLite cada catálogo agrega `fetched_at` y la versión descargada vive en `sync_state.catalog_version`.

### 3.3 Solo servidor

`external_cache`: caché de clima y noticias (`key`, `payload`, `fetched_at`, `expires_at`). Solo la usan las Edge Functions con la clave de servicio.

### 3.4 Solo locales (SQLite)

| Tabla | Para qué sirve |
| --- | --- |
| `pending_change` | Cola de cambios pendientes (patrón *outbox*): `entity_kind`, `entity_id` (único por entidad: los cambios sucesivos se funden), `op` (`upsert`/`delete`), `fields` (valor y hora por campo), `modified_at`, `attempts`, `last_error`, `depends_on_upload_id`. Su número de filas es la cantidad de cambios pendientes de sincronizar. |
| `sync_state` | Una fila: `user_id`, `device_id`, `last_pulled_seq`, `clock_offset_ms`, `status` (`synced`/`syncing`/`offline`/`error`), `catalog_version`. |
| `device_setting` | Preferencias propias del computador (por ejemplo `last_screen`). El inicio automático no va aquí: su fuente es el registro de Windows. |
| `local_file` | Registro de archivos en caché local (catálogos e imágenes descargadas), con `sha256` y `pinned` (la plantilla por defecto y su tipografía no se borran). Rechaza rutas con `..`. |
| `file_upload_queue` | Cola de subida de imágenes propias elegidas sin conexión. |
| `external_widget_cache` | Último dato de los widgets Clima y Noticias. |

## Modelo · 4. Relaciones

- Toda entidad sincronizada tiene `user_id` → `profile(user_id)` (`ON DELETE CASCADE`); `profile.user_id` → `auth.users(id)` (`ON DELETE CASCADE`): borrar la cuenta borra todos sus datos.
- `card.column_id` y `card.previous_column_id` → `kanban_column`; `card_label` → `card` y `label`; `theme_widget` → `theme` y `widget`; `widget_carousel_item` → `widget`; `applied_theme.theme_id` → `theme`.
- Imágenes: `theme`, `applied_theme`, `widget` y `widget_carousel_item` apuntan a `catalog_image` o a `uploaded_image`; `widget.animation_id` → `catalog_animation`.
- Catálogos: `kanban_column.color_id` y `label.color_id` → `catalog_color`; `theme.template_id`, `theme.palette_id`, `theme.font_id` → `catalog_template`, `catalog_palette`, `catalog_font`; `catalog_template.default_font_id` → `catalog_font`.
- Cascadas lógicas (las aplica `sync_push`; en SQLite son `ON DELETE CASCADE`): eliminar una tarjeta o una etiqueta elimina sus `card_label` (las tarjetas no se eliminan); eliminar un widget elimina sus `theme_widget` y sus imágenes del carrusel; eliminar un tema elimina sus `theme_widget`.

### 4.1 Diagramas entidad-relación

Los diagramas usan la notación de pata de gallo (Information Engineering) y se generan desde el esquema SQL real, no se dibujan a mano. Cada uno lleva título y leyenda; las tablas con detalle muestran el tipo de dato de cada columna y marcan PK, FK, UK y las columnas que admiten NULL. Están en `img/` (PNG y SVG):

| Diagrama | Qué muestra |
| --- | --- |
| `er_nube_general` | Las 21 tablas de la nube (solo nombre) y sus relaciones, salvo `user_id`. |
| `er_nube_pertenencia` | `auth.users` → `profile` y la clave `user_id` de cada entidad del usuario. |
| `er_nube_cuenta_planificador` | `profile`, `user_preference`, `kanban_column`, `card`, `label`, `card_label` y `catalog_color`, con columnas. |
| `er_nube_personalizacion` | `theme`, `applied_theme`, `widget`, `theme_widget` y `widget_carousel_item`, con columnas, y sus catálogos e imágenes propias. |
| `er_nube_catalogos` | Los catálogos con columnas, `external_cache` y las tablas que los usan. |
| `er_local_general` | Las 24 tablas de SQLite (solo nombre) y sus relaciones, salvo `user_id`. |
| `er_local_pertenencia` | La clave `user_id` hacia `profile` en la base local. |
| `er_local_sincronizacion` | `pending_change`, `file_upload_queue`, `external_widget_cache`, `local_file`, `sync_state` y `device_setting`. |

Cómo se leen las cardinalidades: el extremo junto a la tabla padre es «exactamente uno» si la clave foránea es `NOT NULL` y «cero o uno» si admite NULL; el extremo junto a la tabla hija es «cero o muchos», o «cero o uno» si la clave foránea es PK, `UNIQUE` o está atada por `CHECK (id = user_id)` (`user_preference` y `applied_theme` frente a `profile`; `external_widget_cache` frente a `widget`).

**Cómo se regeneran.** Desde la carpeta de trabajo, con los esquemas SQL como única fuente (los `.dbml` quedan en la raíz de esta carpeta y las imágenes en `img/`):

1. `python3 scripts/sql_a_dbml.py` extrae los `CREATE TABLE` y `CREATE INDEX`, los convierte con `sql2dbml --postgres` y completa notas de tabla (término del glosario) y grupos por área: escribe `windgets_nube.dbml` y `windgets_local.dbml`.
2. `python3 scripts/er_desde_dbml.py` lee los `.dbml` con `@dbml/core` y escribe un `.dot` de Graphviz, un `.png` y un `.svg` por diagrama.
3. `python3 scripts/validar_er.py` comprueba que tablas, columnas, PK y FK del DBML coinciden con el SQL y que cada FK aparece en un diagrama con la cardinalidad correcta. Debe terminar con 0 diferencias.

**Cómo se importan en dbdiagram.io.** Abrir un diagrama nuevo, usar «Import» → «From DBML» (o pegar el contenido) con `windgets_nube.dbml` o `windgets_local.dbml`. Los grupos de tablas (Cuenta, Planificador, Personalización, Catálogos, Solo servidor, Sincronización local) se importan como `TableGroup`. Los `CHECK` y los índices parciales no tienen representación en DBML; el SQL sigue siendo la fuente de verdad.

## Modelo · 5. Seguridad por fila (RLS)

- Todas las tablas de `public` tienen RLS activado y forzado. `anon` no tiene permisos sobre ninguna tabla.
- Entidades sincronizadas y `profile`: una política `SELECT` para `authenticated` con `user_id = auth.uid()`. No hay `INSERT`, `UPDATE` ni `DELETE` para `authenticated`: solo se escribe con `sync_push`, que fuerza el `user_id` de la sesión.
- Catálogos: `SELECT` para `authenticated` solo de filas con `is_active = true`; `catalog_meta` se lee siempre. Solo el equipo los escribe, con migraciones y datos semilla.
- `external_cache`: RLS activado y sin políticas ni permisos.
- Storage: ver la sección 8.
- Total: 19 políticas en `public` y 4 en `storage`.
- Las funciones `SECURITY DEFINER` deben pertenecer a un rol con `BYPASSRLS` (en Supabase, `postgres`), porque el RLS está forzado.

## Modelo · 6. Sincronización y conflictos

**Principio.** Local primero: el Núcleo escribe en SQLite y encola el cambio; la nube se actualiza después. La combinación (D-048) se hace solo en el servidor (D-189), con la hora de modificación de cada campo corregida con la hora del servidor.

**Cuándo.** El Núcleo envía los cambios pendientes 2 s después de guardar, consulta cambios al abrir, al recuperar la conexión y cada 60 s, y nunca con el computador suspendido. No se usa Realtime.

**RPC** (todas en `0003_funciones.sql`):

| Función | Para qué |
| --- | --- |
| `server_time()` | Hora del servidor para medir el desfase del reloj. |
| `sync_push(p_device_id uuid, p_clock_offset_ms bigint, p_changes jsonb)` | Aplica hasta 200 cambios en el orden de `change_id`; cada uno en su propio subbloque, de modo que el rechazo de uno no revierte los demás. Devuelve `server_now`, `results` y `max_seq`. |
| `sync_pull(p_since_seq bigint, p_limit integer default 500)` | Devuelve las filas del usuario con `updated_seq` mayor que el cursor (vivas y eliminadas), ordenadas, con `next_seq` y `has_more`. `SECURITY INVOKER`: la RLS limita a lo propio. |
| `catalog_pull(p_known_version integer)` | Devuelve los catálogos activos solo si cambió la versión. |
| `email_is_registered(p_email text)` | `true` si hay una cuenta con ese correo verificado. Accesible a `anon`. |
| `keepalive()` | Devuelve `{ok, at}` y evita la pausa del plan gratuito (D-197). Accesible a `anon`. |

**Reglas de `sync_push`** (cada cambio es `{change_id, entity_kind, entity_id, op, modified_at, fields: {campo: {value, modified_at}}}`):

1. **Hora corregida:** `LEAST(hora_cliente + desfase, ahora)`, truncada a milisegundos. El tope impide que un reloj adelantado gane siempre; un desfase de más de 24 h se rechaza con `clock_out_of_range`.
2. **Propiedad:** una fila ajena se rechaza con `not_owner`; el `user_id` del cliente se ignora y no se acepta como campo.
3. **Creación:** exige los campos obligatorios (`incomplete_create`); `created_at` es la hora mínima de los campos.
4. **LWW por campo:** cada campo se compara solo con su propia hora. Gana la más reciente; campos distintos de la misma fila se combinan sin conflicto. Si el valor recibido pierde y es distinto, la respuesta es `superseded` (o `merged` si otros campos sí se aplicaron) con `conflict: true`, y trae la fila ganadora completa para que el Núcleo la adopte.
5. **Eliminar frente a modificar:** la eliminación solo se aplica si es estrictamente posterior a todas las horas de campo; si no, gana la modificación (`superseded`, `conflict: true`). Modificar una fila eliminada con campos más recientes que la eliminación la resucita; si no, gana la eliminación (`deleted`, `conflict: true`).
6. **Invariantes** (los vuelve a validar el servidor): `limit_columns`, `limit_labels`, `limit_themes`, `duplicate_name` (devuelve la fila existente), `duplicate_role`, `duplicate_widget` (devuelve el widget existente), `applied_theme`, `parent_deleted`, `invalid_field`, `unknown_entity`. `card_label` (5 por tarjeta) y `widget_carousel_item` (10 por widget) conservan las más antiguas y pasan las demás a eliminadas con `conflict: true`.
7. **Normalización de `card`:** una columna eliminada o inexistente se sustituye por la columna `todo`; `completed_on` se fija al pasar a una columna `done` y se borra al salir; un bloque horario posterior a la nueva fecha límite se quita.
8. **Idempotencia:** reenviar el mismo cambio no modifica la fila ni su `updated_seq`.

**Grupos atómicos.** Los campos que una misma acción modifica deben enviarse con la misma hora (por ejemplo, las cuatro columnas del fondo de un tema), para que la combinación por campo no deje combinaciones inválidas.

**Cursor seguro.** `sync_push` toma un bloqueo por usuario; así los `updated_seq` de un usuario se confirman en orden y `sync_pull` nunca se salta filas.

**Aplicación local** (Núcleo): una transacción SQLite por página, en orden padre → hijo; un campo con cambio pendiente más reciente que el descargado no se sobrescribe; las eliminaciones de cada página se aplican antes que las altas; el reajuste por resolución no se encola.

## Modelo · 7. Funciones y disparadores del servidor

| Nombre | Qué hace |
| --- | --- |
| `validate_new_user` (antes de insertar en `auth.users`) | Rechaza correos de más de 64 caracteres (`email_too_long`). |
| `on_account_confirmed` (al confirmarse el correo, o al llegar confirmada una cuenta de Google) | Crea el perfil y la semilla de la cuenta (sección 9) en una sola transacción; es idempotente. |
| `set_updated_seq` | Asigna `updated_seq` en cada escritura de una entidad sincronizada. |
| `enforce_limit` | Máximo de columnas (10), etiquetas (20) y temas (10) vivos por usuario (`limit_*`). |
| `guard_kanban_column`, `guard_widget`, `guard_theme_delete`, `guard_carousel_parent`, `normalize_hex_colors` | La función de una columna no cambia y las columnas `todo`, `in_progress` y `done` no se eliminan; el tipo de un widget no cambia y los widgets por defecto no se eliminan; el tema aplicado no se elimina; las imágenes de carrusel solo cuelgan de un Carrusel de imágenes; los colores se guardan en mayúsculas. |
| `bump_catalog_version` | Sube `catalog_meta.version` con cada cambio de un catálogo. |
| `purge_tombstones()` | Borra lo eliminado hace más de 90 días, hijos primero, sin purgar un padre que alguna fila aún referencia. Diaria con `pg_cron`. |
| `purge_unconfirmed_users()` | Borra altas sin verificar de más de 1 hora. Cada hora con `pg_cron`. |
| Auxiliares `_sync_*` | Apoyan a `sync_push` y `sync_pull`; no son ejecutables por `authenticated` salvo los puros que usa `sync_pull`. |

Si `pg_cron` no está disponible, la migración avisa y las dos purgas deben programarse por otro medio.

## Modelo · 8. Storage

| Bucket | Acceso | Contenido | Límites |
| --- | --- | --- | --- |
| `user-images` | Privado; políticas `SELECT`, `INSERT` y `DELETE` (sin `UPDATE`) solo sobre la carpeta `{auth.uid()}/` | `{user_id}/{id}.{jpg\|jpeg\|png}` (la política de subida exige esta forma) | 20 971 520 bytes; `image/jpeg` e `image/png` |
| `catalog` | Privado; `SELECT` para `authenticated`; sin escritura desde la aplicación | `templates/`, `images/`, `fonts/`, `animations/` | Sin límite propio |

El servidor solo impone tamaño y tipo MIME; la firma del archivo (JPG/PNG) la verifica el Núcleo antes de subirlo.

## Modelo · 9. Datos semilla

**Catálogo (`seed.sql`, repetible sin duplicar).** Una plantilla por defecto (`default`, «Windgets»), 4 tipografías de licencia abierta (`inter` es la de la plantilla), 3 paletas, 9 colores (incluido `gray`) y `catalog_meta` con versión 1. Los catálogos de imágenes y animaciones quedan vacíos hasta que el equipo cargue los archivos. Los nombres, colores y cantidades son una propuesta: el backlog no los fija (H-D-10).

**Por cuenta (`on_account_confirmed`).** `profile` (alias según el registro con correo, el nombre de Google recortado a 30 caracteres o la parte del correo anterior a la `@`); `user_preference` en vista compacta; 3 columnas («Por hacer», «En progreso», «Hecho», con colores `gray`, `blue` y `green`: propuesta H-D-17); el tema «Mi tema» con los colores y la tipografía de la plantilla por defecto y su copia aplicada; los 4 widgets por defecto, activos, con 4 `theme_widget` en posiciones sin superposición sobre 1920 × 1080 (propuesta H-D-18). Sin tarjetas, etiquetas ni imágenes.

**Local.** El instalador trae la plantilla por defecto, su fondo y su tipografía; el Núcleo los registra en `local_file` con `pinned = 1`.

## Modelo · 10. Estructura de la entrega y cómo ejecutar

```
supabase/migrations/0001_esquema.sql    tipos, tablas, claves, CHECK, UNIQUE, índices
supabase/migrations/0002_rls.sql        RLS y permisos
supabase/migrations/0003_funciones.sql  disparadores, sync_push, sync_pull, keepalive, semilla por cuenta, purgas
supabase/migrations/0004_storage.sql    buckets y políticas de Storage
supabase/seed.sql                       catálogos y valores por defecto
local/sqlite_esquema.sql                base local del Núcleo
pruebas/pruebas.sql, ejecutar_pruebas.sh, prueba_sqlite.py, 00_stub_supabase.sql, resultado.txt
img/er_*.png, img/er_*.svg               diagramas entidad-relación (8)
windgets_nube.dbml, windgets_local.dbml  esquemas en DBML, generados desde los SQL
```

**Con Supabase CLI.** Copie `supabase/` al repositorio (D-200) y ejecute `supabase db reset`: aplica las migraciones en orden y luego `seed.sql`.

**Con psql.** Sobre una base UTF-8 con los esquemas de Supabase ya presentes:

```
for f in supabase/migrations/000{1,2,3,4}_*.sql supabase/seed.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

**SQLite.** El Núcleo ejecuta `local/sqlite_esquema.sql` al crear la base local (SQLite 3.35 o superior; activa `foreign_keys`, WAL y `synchronous = NORMAL`).

**Pruebas.** `bash pruebas/ejecutar_pruebas.sh` levanta un clúster temporal de PostgreSQL, crea el sustituto mínimo de Supabase, aplica las migraciones reales (y el seed dos veces), ejecuta `pruebas.sql` (cuentas y semilla, RLS con dos usuarios, Storage, CHECK y límites, `sync_push`/`sync_pull` con conflictos por campo, reloj, catálogos, purgas y borrado de cuenta) y `prueba_sqlite.py`, y termina con «TODAS LAS PRUEBAS OK» o con el error. Variables: `PG_BIN`, `WINDGETS_PGDATA`, `WINDGETS_PGPORT`. La última salida está en `pruebas/resultado.txt` (349 comprobaciones en PostgreSQL y 118 en SQLite).

**Limitación.** Las pruebas se hicieron en PostgreSQL 16 local con un sustituto mínimo de los esquemas de Supabase (roles `anon`, `authenticated` y `service_role`, `auth.users`, `auth.uid()`, `storage.buckets`, `storage.objects` y `storage.foldername`), no en Supabase real. No se probaron PostgREST, JWT reales, `pg_cron`, el motor de Storage ni los límites del plan gratuito. Antes de producción hay que repetir las pruebas de RLS contra un proyecto real.

## Modelo · 11. Decisiones técnicas del esquema

1. **Firma de `sync_pull` y `sync_push`.** Se usan `sync_pull(p_since_seq bigint, p_limit integer)` y `sync_push(p_device_id, p_clock_offset_ms, p_changes)`, como en los contratos de RPC. El cursor es la secuencia `updated_seq` y no una hora, porque una hora de servidor puede dejar filas sin descargar.
2. **Desempate de empates exactos.** Con la misma hora y valores distintos, gana el valor mayor en orden de texto (resultado igual sea cual sea el orden de llegada). No se compara por `device_id` porque `field_mods` guarda solo la hora; `p_device_id` queda en la firma sin efecto.
3. **Identificadores de uniones.** El servidor no recalcula los UUID v5. Para evitar duplicados, una unión con otro `id` pero la misma pareja (`card_label`, `theme_widget`) se trata como modificación de la existente.
4. **Límites en disparadores.** Los máximos de columnas, etiquetas y temas se imponen con disparadores de la propia tabla (valen también para escrituras directas con la clave de servicio); `sync_push` solo traduce el error. Los máximos por padre se recortan en `sync_push`.
5. **Inmutables y protegidos.** La función de una columna y el tipo de un widget no cambian después de crearse; `user_preference` y `applied_theme` no se eliminan (restricción `deleted_at IS NULL`). Es lo mínimo que sostiene las invariantes.
6. **Campos obligatorios del Clima.** Se exigen también `weather_geo_id`, `weather_latitude` y `weather_longitude`, porque la unicidad por ciudad y la consulta dependen de ellos.
7. **Intervalo del carrusel.** El valor por defecto de 5 s lo pone un disparador al crear (la restricción exige nulo en los demás tipos, por lo que no puede ser un `DEFAULT` de columna). En SQLite el Núcleo debe enviar el 5.
8. **Errores.** Los errores de negocio usan el SQLSTATE `WG001` (y `WG401` para sesión ausente) con el código como mensaje. Una referencia a un catálogo inexistente se informa como `invalid_field`; un error no previsto se propaga en lugar de ocultarse.
9. **Fecha de completado.** Si el servidor debe normalizar `completed_on`, usa la fecha UTC de la hora del cambio.
10. **Salida en UTC.** Los instantes de `sync_push` y `sync_pull` salen en RFC 3339 UTC con milisegundos y `Z`, y las funciones fijan la zona horaria a UTC.
11. **SQLite sin `deleted_at`.** Se omite el campo, y los disparadores de límite y de protección son una red de seguridad local; dejan de proteger cuando se borra la cuenta local (D-190).
12. **Sustituto de Supabase.** `auth.users` del sustituto incluye `email_confirmed_at`, `raw_user_meta_data`, `raw_app_meta_data` y `created_at`, que los disparadores necesitan (Supabase real los trae).
13. **`pg_cron` condicional.** Si la extensión no existe, la migración solo avisa.
14. **Valores semilla propuestos.** Nombres, colores, tipografías, paletas y geometría de los widgets por defecto son propuestas pendientes de ratificar (H-D-10, H-D-17, H-D-18).
