-- ============================================================================
-- Windgets · local/sqlite_esquema.sql
-- Base local del Núcleo (SQLite 3.35 o superior): réplica de las entidades de PostgreSQL más la cola
-- de cambios pendientes y los metadatos de sincronización (datos.md, secciones 1 y 6).
-- Una sola base por computador, la de la cuenta con sesión iniciada (D-190).
--
-- Diferencias con PostgreSQL (convención 1.1):
--   * uuid -> TEXT de 36 caracteres en minúsculas; boolean -> INTEGER 0/1; date -> TEXT 'YYYY-MM-DD';
--     timestamptz -> TEXT RFC 3339 UTC con milisegundos y 'Z'; jsonb -> TEXT con json_valid().
--   * Sin `deleted_at`: SQLite no guarda tombstones; al eliminar se borra la fila y la orden queda en
--     pending_change (HE-15-HU03-ET03). Las cascadas lógicas de PG (8.5) son aquí ON DELETE CASCADE.
--   * `lower()` de SQLite solo cambia ASCII: el Núcleo normaliza los nombres antes de guardar y el
--     servidor decide en último término (D-188, D-189).
--   * Los disparadores de límite son una red de seguridad: el Núcleo valida primero (D-188) y, al aplicar
--     una página de sync_pull, aplica primero las eliminaciones y después las altas.
-- ============================================================================
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;       -- RNF-14: una transacción por cambio, sin perder datos ante un cierre inesperado
PRAGMA synchronous = NORMAL;

-- ============================================================================
-- Catálogos en caché (D-180, D-198): solo bajada. `fetched_at` = cuándo se descargó.
-- ============================================================================
CREATE TABLE catalog_font (
  id           TEXT PRIMARY KEY,
  family_name  TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 60),
  file_path    TEXT NOT NULL,
  license      TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  fetched_at   TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);
CREATE TABLE catalog_template (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  thumbnail_path          TEXT NOT NULL,
  bundle_path             TEXT NOT NULL,
  default_background_path TEXT NOT NULL,
  default_color_primary   TEXT NOT NULL CHECK (length(default_color_primary) = 7 AND default_color_primary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  default_color_secondary TEXT NOT NULL CHECK (length(default_color_secondary) = 7 AND default_color_secondary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  default_color_text      TEXT NOT NULL CHECK (length(default_color_text) = 7 AND default_color_text GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  default_font_id         TEXT NOT NULL REFERENCES catalog_font(id),
  is_default              INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  sort_order              INTEGER NOT NULL DEFAULT 0,
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  bundle_version          INTEGER NOT NULL DEFAULT 1,
  fetched_at              TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);
CREATE UNIQUE INDEX uq_catalog_template_default ON catalog_template (is_default) WHERE is_default = 1;
CREATE TABLE catalog_palette (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  color_primary   TEXT NOT NULL CHECK (length(color_primary) = 7 AND color_primary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_secondary TEXT NOT NULL CHECK (length(color_secondary) = 7 AND color_secondary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_text      TEXT NOT NULL CHECK (length(color_text) = 7 AND color_text GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  fetched_at      TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);
CREATE TABLE catalog_image (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  storage_path   TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  width          INTEGER NOT NULL CHECK (width > 0),
  height         INTEGER NOT NULL CHECK (height > 0),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  fetched_at     TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);
CREATE TABLE catalog_animation (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  storage_path   TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  format         TEXT NOT NULL CHECK (format IN ('lottie','webm')),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  fetched_at     TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);
CREATE TABLE catalog_color (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  hex        TEXT NOT NULL CHECK (length(hex) = 7 AND hex GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  fetched_at TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);

-- ============================================================================
-- Entidades sincronizadas (columnas comunes: id, user_id, created_at, field_mods, updated_seq)
-- ============================================================================

-- Perfil de la cuenta (Alias): solo bajada; el Núcleo nunca lo escribe (3.1)
CREATE TABLE profile (
  user_id       TEXT PRIMARY KEY CHECK (length(user_id) = 36 AND user_id = lower(user_id)),
  alias         TEXT NOT NULL CHECK (trim(alias) <> '' AND length(alias) BETWEEN 1 AND 30),
  auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email','google')),
  created_at    TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  updated_seq   INTEGER NOT NULL DEFAULT 0
);

-- Preferencias (id = user_id)
CREATE TABLE user_preference (
  id              TEXT PRIMARY KEY CHECK (id = user_id),
  user_id         TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods      TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq     INTEGER NOT NULL DEFAULT 0,
  board_card_view TEXT NOT NULL DEFAULT 'compact' CHECK (board_card_view IN ('compact','expanded'))
);

-- Columna del tablero Kanban
CREATE TABLE kanban_column (
  id          TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id     TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods  TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL CHECK (trim(name) <> '' AND length(name) BETWEEN 1 AND 30),
  color_id    TEXT NOT NULL REFERENCES catalog_color(id),
  role        TEXT NOT NULL DEFAULT 'custom' CHECK (role IN ('todo','in_progress','done','custom')),
  position    REAL NOT NULL
);
CREATE UNIQUE INDEX uq_kanban_column_name ON kanban_column (user_id, lower(trim(name)));
CREATE UNIQUE INDEX uq_kanban_column_role ON kanban_column (user_id, role) WHERE role <> 'custom';
CREATE INDEX ix_kanban_column_pos ON kanban_column (user_id, position);

-- Tarjeta
CREATE TABLE card (
  id                 TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id            TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at         TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods         TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq        INTEGER NOT NULL DEFAULT 0,
  type               TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task','reminder','event')),
  title              TEXT NOT NULL CHECK (trim(title) <> '' AND length(title) BETWEEN 1 AND 100),
  description        TEXT CHECK (description IS NULL OR length(description) <= 1000),
  priority           TEXT CHECK (priority IS NULL OR priority IN ('high','medium','low')),
  due_date           TEXT NOT NULL CHECK (date(due_date) IS due_date),
  column_id          TEXT NOT NULL REFERENCES kanban_column(id),
  position           REAL NOT NULL,
  previous_column_id TEXT REFERENCES kanban_column(id),
  completed_on       TEXT CHECK (completed_on IS NULL OR date(completed_on) IS completed_on),
  scheduled_date     TEXT CHECK (scheduled_date IS NULL OR date(scheduled_date) IS scheduled_date),
  scheduled_hour     INTEGER CHECK (scheduled_hour BETWEEN 0 AND 23),
  CHECK ((scheduled_date IS NULL) = (scheduled_hour IS NULL)),
  CHECK (scheduled_date IS NULL OR scheduled_date <= due_date)
);
CREATE INDEX ix_card_column    ON card (user_id, column_id, position);
CREATE INDEX ix_card_due       ON card (user_id, due_date);
CREATE INDEX ix_card_schedule  ON card (user_id, scheduled_date, scheduled_hour) WHERE scheduled_date IS NOT NULL;
CREATE INDEX ix_card_completed ON card (user_id, completed_on) WHERE completed_on IS NOT NULL;

-- Etiqueta
CREATE TABLE label (
  id          TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id     TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods  TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL CHECK (trim(name) <> '' AND length(name) BETWEEN 1 AND 30),
  color_id    TEXT NOT NULL REFERENCES catalog_color(id)
);
CREATE UNIQUE INDEX uq_label_name ON label (user_id, lower(trim(name)));

-- Etiqueta de la tarjeta (id = UUID v5 de card_id:label_id, calculado por el Núcleo)
CREATE TABLE card_label (
  id          TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id     TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods  TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq INTEGER NOT NULL DEFAULT 0,
  card_id     TEXT NOT NULL REFERENCES card(id) ON DELETE CASCADE,
  label_id    TEXT NOT NULL REFERENCES label(id) ON DELETE CASCADE,
  UNIQUE (card_id, label_id)
);
CREATE INDEX ix_card_label_label ON card_label (label_id);

-- Imagen propia (metadatos; el archivo vive en %APPDATA%\Windgets\files y en Storage)
CREATE TABLE uploaded_image (
  id           TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id      TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods   TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq  INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type    TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png')),
  extension    TEXT NOT NULL CHECK (extension IN ('jpg','jpeg','png')),
  size_bytes   INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20971520),
  width        INTEGER NOT NULL CHECK (width > 0),
  height       INTEGER NOT NULL CHECK (height > 0),
  sha256       TEXT NOT NULL CHECK (length(sha256) = 64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  CHECK (storage_path = user_id || '/' || id || '.' || extension),
  CHECK ((mime_type = 'image/png' AND extension = 'png') OR (mime_type = 'image/jpeg' AND extension IN ('jpg','jpeg')))
);

-- Tema
CREATE TABLE theme (
  id                           TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id                      TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at                   TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods                   TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq                  INTEGER NOT NULL DEFAULT 0,
  name                         TEXT NOT NULL CHECK (trim(name) <> '' AND length(name) BETWEEN 1 AND 40),
  template_id                  TEXT NOT NULL REFERENCES catalog_template(id),
  background_source            TEXT NOT NULL DEFAULT 'template_default' CHECK (background_source IN ('template_default','catalog','own')),
  background_catalog_image_id  TEXT REFERENCES catalog_image(id),
  background_uploaded_image_id TEXT REFERENCES uploaded_image(id),
  color_primary                TEXT NOT NULL CHECK (length(color_primary) = 7 AND color_primary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_secondary              TEXT NOT NULL CHECK (length(color_secondary) = 7 AND color_secondary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_text                   TEXT NOT NULL CHECK (length(color_text) = 7 AND color_text GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  palette_id                   TEXT REFERENCES catalog_palette(id),
  font_id                      TEXT NOT NULL REFERENCES catalog_font(id),
  font_size                    TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small','medium','large')),
  last_modified_at             TEXT NOT NULL CHECK (last_modified_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  CHECK ((background_source = 'template_default' AND background_catalog_image_id IS NULL AND background_uploaded_image_id IS NULL)
      OR (background_source = 'catalog' AND background_catalog_image_id IS NOT NULL AND background_uploaded_image_id IS NULL)
      OR (background_source = 'own' AND background_uploaded_image_id IS NOT NULL AND background_catalog_image_id IS NULL))
);
CREATE UNIQUE INDEX uq_theme_name ON theme (user_id, lower(trim(name)));
CREATE INDEX ix_theme_recent ON theme (user_id, last_modified_at DESC);

-- Tema aplicado (id = user_id): copia del contenido aplicado
CREATE TABLE applied_theme (
  id                           TEXT PRIMARY KEY CHECK (id = user_id),
  user_id                      TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at                   TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods                   TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq                  INTEGER NOT NULL DEFAULT 0,
  theme_id                     TEXT NOT NULL REFERENCES theme(id),
  template_id                  TEXT NOT NULL REFERENCES catalog_template(id),
  background_source            TEXT NOT NULL DEFAULT 'template_default' CHECK (background_source IN ('template_default','catalog','own')),
  background_catalog_image_id  TEXT REFERENCES catalog_image(id),
  background_uploaded_image_id TEXT REFERENCES uploaded_image(id),
  color_primary                TEXT NOT NULL CHECK (length(color_primary) = 7 AND color_primary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_secondary              TEXT NOT NULL CHECK (length(color_secondary) = 7 AND color_secondary GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_text                   TEXT NOT NULL CHECK (length(color_text) = 7 AND color_text GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  font_id                      TEXT NOT NULL REFERENCES catalog_font(id),
  font_size                    TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small','medium','large')),
  applied_at                   TEXT NOT NULL CHECK (applied_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  CHECK ((background_source = 'template_default' AND background_catalog_image_id IS NULL AND background_uploaded_image_id IS NULL)
      OR (background_source = 'catalog' AND background_catalog_image_id IS NOT NULL AND background_uploaded_image_id IS NULL)
      OR (background_source = 'own' AND background_uploaded_image_id IS NOT NULL AND background_catalog_image_id IS NULL))
);

-- Widget
CREATE TABLE widget (
  id                        TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id                   TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at                TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods                TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq               INTEGER NOT NULL DEFAULT 0,
  type                      TEXT NOT NULL CHECK (type IN ('clock','calendar','daily_tasks','kanban','weather','news',
                              'music_player','animation','image_carousel','static_image','text')),
  is_default                INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  weather_city              TEXT,
  weather_geo_id            TEXT,
  weather_latitude          REAL,
  weather_longitude         REAL,
  text_content              TEXT,
  static_image_source       TEXT,
  static_catalog_image_id   TEXT REFERENCES catalog_image(id),
  static_uploaded_image_id  TEXT REFERENCES uploaded_image(id),
  animation_id              TEXT REFERENCES catalog_animation(id),
  carousel_interval_seconds INTEGER,
  CHECK (is_default = (type IN ('clock','calendar','daily_tasks','kanban'))),
  CHECK ((type = 'weather' AND weather_city IS NOT NULL AND trim(weather_city) <> '' AND length(weather_city) BETWEEN 1 AND 100
            AND weather_geo_id IS NOT NULL AND weather_latitude IS NOT NULL AND weather_latitude BETWEEN -90 AND 90
            AND weather_longitude IS NOT NULL AND weather_longitude BETWEEN -180 AND 180)
      OR (type <> 'weather' AND weather_city IS NULL AND weather_geo_id IS NULL AND weather_latitude IS NULL AND weather_longitude IS NULL)),
  CHECK ((type = 'text' AND text_content IS NOT NULL AND trim(text_content) <> '' AND length(text_content) BETWEEN 1 AND 200)
      OR (type <> 'text' AND text_content IS NULL)),
  CHECK ((type = 'static_image' AND (
             (static_image_source = 'catalog' AND static_catalog_image_id IS NOT NULL AND static_uploaded_image_id IS NULL)
          OR (static_image_source = 'own' AND static_uploaded_image_id IS NOT NULL AND static_catalog_image_id IS NULL)))
      OR (type <> 'static_image' AND static_image_source IS NULL AND static_catalog_image_id IS NULL AND static_uploaded_image_id IS NULL)),
  CHECK ((type = 'animation' AND animation_id IS NOT NULL) OR (type <> 'animation' AND animation_id IS NULL)),
  CHECK ((type = 'image_carousel' AND carousel_interval_seconds IS NOT NULL AND carousel_interval_seconds BETWEEN 3 AND 60)
      OR (type <> 'image_carousel' AND carousel_interval_seconds IS NULL))
);
CREATE UNIQUE INDEX uq_widget_singleton ON widget (user_id, type)
  WHERE type IN ('news','music_player','clock','calendar','daily_tasks','kanban');
CREATE UNIQUE INDEX uq_widget_weather_city ON widget (user_id, weather_geo_id) WHERE type = 'weather';
CREATE INDEX ix_widget_type ON widget (user_id, type);

-- Widget del tema (id = UUID v5 de theme_id:widget_id, calculado por el Núcleo)
CREATE TABLE theme_widget (
  id          TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id     TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods  TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq INTEGER NOT NULL DEFAULT 0,
  theme_id    TEXT NOT NULL REFERENCES theme(id) ON DELETE CASCADE,
  widget_id   TEXT NOT NULL REFERENCES widget(id) ON DELETE CASCADE,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  x           INTEGER NOT NULL CHECK (x >= 0),
  y           INTEGER NOT NULL CHECK (y >= 0),
  width       INTEGER NOT NULL CHECK (width >= 100),
  height      INTEGER NOT NULL CHECK (height >= 100),
  ref_width   INTEGER NOT NULL CHECK (ref_width > 0),
  ref_height  INTEGER NOT NULL CHECK (ref_height > 0),
  UNIQUE (theme_id, widget_id)
);
CREATE INDEX ix_theme_widget_widget ON theme_widget (widget_id);

-- Imagen del Carrusel de imágenes
CREATE TABLE widget_carousel_item (
  id                TEXT PRIMARY KEY CHECK (length(id) = 36 AND id = lower(id)),
  user_id           TEXT NOT NULL REFERENCES profile(user_id) ON DELETE CASCADE,
  created_at        TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  field_mods        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(field_mods)),
  updated_seq       INTEGER NOT NULL DEFAULT 0,
  widget_id         TEXT NOT NULL REFERENCES widget(id) ON DELETE CASCADE,
  source            TEXT NOT NULL CHECK (source IN ('catalog','own')),
  catalog_image_id  TEXT REFERENCES catalog_image(id),
  uploaded_image_id TEXT REFERENCES uploaded_image(id),
  position          REAL NOT NULL,
  CHECK ((source = 'catalog' AND catalog_image_id IS NOT NULL AND uploaded_image_id IS NULL)
      OR (source = 'own' AND uploaded_image_id IS NOT NULL AND catalog_image_id IS NULL))
);
CREATE INDEX ix_carousel_item_pos ON widget_carousel_item (widget_id, position);

-- ============================================================================
-- Límites (red de seguridad local; el servidor repite estas reglas: 8.4)
-- ============================================================================
CREATE TRIGGER trg_limit_columns BEFORE INSERT ON kanban_column
WHEN (SELECT count(*) FROM kanban_column WHERE user_id = NEW.user_id) >= 10
BEGIN SELECT RAISE(ABORT, 'limit_columns'); END;                       -- HE-09-HU03-ET07; D-167

CREATE TRIGGER trg_limit_labels BEFORE INSERT ON label
WHEN (SELECT count(*) FROM label WHERE user_id = NEW.user_id) >= 20
BEGIN SELECT RAISE(ABORT, 'limit_labels'); END;                        -- HE-08-HU02-ET06

CREATE TRIGGER trg_limit_themes BEFORE INSERT ON theme
WHEN (SELECT count(*) FROM theme WHERE user_id = NEW.user_id) >= 10
BEGIN SELECT RAISE(ABORT, 'limit_themes'); END;                        -- HE-03-HU02-ET05; D-035

CREATE TRIGGER trg_limit_card_labels BEFORE INSERT ON card_label
WHEN (SELECT count(*) FROM card_label WHERE card_id = NEW.card_id) >= 5
BEGIN SELECT RAISE(ABORT, 'limit_card_labels'); END;                   -- HE-07-HU02-ET04

CREATE TRIGGER trg_limit_carousel_items BEFORE INSERT ON widget_carousel_item
WHEN (SELECT count(*) FROM widget_carousel_item WHERE widget_id = NEW.widget_id) >= 10
BEGIN SELECT RAISE(ABORT, 'limit_carousel_items'); END;                -- HE-04-HU08-ET02; RNF-10

CREATE TRIGGER trg_carousel_parent BEFORE INSERT ON widget_carousel_item
WHEN (SELECT type FROM widget WHERE id = NEW.widget_id) IS NOT 'image_carousel'
BEGIN SELECT RAISE(ABORT, 'invalid_field'); END;                       -- HE-04-HU08-ET02

CREATE TRIGGER trg_protect_default_column BEFORE DELETE ON kanban_column
WHEN OLD.role <> 'custom' AND EXISTS (SELECT 1 FROM profile WHERE user_id = OLD.user_id)   -- no estorba al borrar la cuenta (D-190)
BEGIN SELECT RAISE(ABORT, 'invalid_field'); END;                       -- HE-09-HU06-ET02

CREATE TRIGGER trg_protect_default_widget BEFORE DELETE ON widget
WHEN OLD.is_default = 1 AND EXISTS (SELECT 1 FROM profile WHERE user_id = OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'invalid_field'); END;                       -- HE-04-HU13-ET04

CREATE TRIGGER trg_protect_applied_theme BEFORE DELETE ON theme
WHEN EXISTS (SELECT 1 FROM applied_theme WHERE theme_id = OLD.id) AND EXISTS (SELECT 1 FROM profile WHERE user_id = OLD.user_id)
BEGIN SELECT RAISE(ABORT, 'applied_theme'); END;                       -- HE-03-HU05-ET03; D-037

-- Los colores se guardan en mayúsculas (HE-02-HU05-ET06). La condición WHEN evita el bucle.
CREATE TRIGGER trg_theme_upper_colors_ins AFTER INSERT ON theme
WHEN NEW.color_primary <> upper(NEW.color_primary) OR NEW.color_secondary <> upper(NEW.color_secondary) OR NEW.color_text <> upper(NEW.color_text)
BEGIN UPDATE theme SET color_primary = upper(NEW.color_primary), color_secondary = upper(NEW.color_secondary),
       color_text = upper(NEW.color_text) WHERE id = NEW.id; END;
CREATE TRIGGER trg_theme_upper_colors_upd AFTER UPDATE OF color_primary, color_secondary, color_text ON theme
WHEN NEW.color_primary <> upper(NEW.color_primary) OR NEW.color_secondary <> upper(NEW.color_secondary) OR NEW.color_text <> upper(NEW.color_text)
BEGIN UPDATE theme SET color_primary = upper(NEW.color_primary), color_secondary = upper(NEW.color_secondary),
       color_text = upper(NEW.color_text) WHERE id = NEW.id; END;

-- ============================================================================
-- Solo locales (6.1)
-- ============================================================================

-- Cola de subida de imágenes propias (permite elegir una imagen sin conexión; H-D-12)
CREATE TABLE file_upload_queue (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uploaded_image_id TEXT NOT NULL REFERENCES uploaded_image(id) ON DELETE CASCADE,
  local_path        TEXT NOT NULL CHECK (local_path NOT LIKE '%..%'),
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','uploading','done','failed')),
  attempts          INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error        TEXT,
  created_at        TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);

-- Cola de cambios pendientes de sincronizar (patrón outbox; HE-15-HU03-ET06; RNF-12, RNF-14).
-- El cambio se escribe en la misma transacción que la entidad. Un cambio pendiente por entidad:
-- los sucesivos se funden en una fila (H-D-11). La cantidad de filas = «cambios pendientes de sincronizar».
CREATE TABLE pending_change (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,     -- define el orden de envío
  entity_kind          TEXT NOT NULL CHECK (entity_kind IN ('user_preference','kanban_column','card','label','card_label',
                         'uploaded_image','theme','applied_theme','widget','theme_widget','widget_carousel_item')),
  entity_id            TEXT NOT NULL CHECK (length(entity_id) = 36),
  op                   TEXT NOT NULL CHECK (op IN ('upsert','delete')),
  -- { "<campo>": { "value": <json>, "modified_at": "<UTC del computador>" } }; '{}' en delete (HE-15-HU03-ET04)
  fields               TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(fields)),
  modified_at          TEXT NOT NULL CHECK (modified_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  created_at           TEXT NOT NULL CHECK (created_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  attempts             INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),   -- HE-15-HU01-ET04
  last_attempt_at      TEXT CHECK (last_attempt_at IS NULL OR last_attempt_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  last_error           TEXT,                                   -- solo un código; sin tokens ni contenido (D-196)
  depends_on_upload_id INTEGER REFERENCES file_upload_queue(id) ON DELETE SET NULL,
  UNIQUE (entity_kind, entity_id)
);

-- Estado de la sincronización: una sola fila (D-190, D-049)
CREATE TABLE sync_state (
  id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  user_id             TEXT NOT NULL CHECK (length(user_id) = 36),          -- cuenta dueña de la base
  device_id           TEXT NOT NULL CHECK (length(device_id) = 36),        -- UUID de este computador
  last_pulled_seq     INTEGER NOT NULL DEFAULT 0 CHECK (last_pulled_seq >= 0),
  clock_offset_ms     INTEGER NOT NULL DEFAULT 0,                          -- servidor menos computador (8.3)
  clock_calibrated_at TEXT CHECK (clock_calibrated_at IS NULL OR clock_calibrated_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  last_sync_at        TEXT CHECK (last_sync_at IS NULL OR last_sync_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  status              TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('synced','syncing','offline','error')),
  last_error_code     TEXT,
  catalog_version     INTEGER NOT NULL DEFAULT 0 CHECK (catalog_version >= 0)
);

-- Preferencias propias del computador (p. ej. last_screen, D-156). El inicio automático NO va aquí.
CREATE TABLE device_setting (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL CHECK (json_valid(value)),
  updated_at TEXT NOT NULL CHECK (updated_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z')
);

-- Archivos locales: caché de catálogos e imágenes propias descargadas (D-198)
CREATE TABLE local_file (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('template_bundle','template_thumbnail','font','catalog_image',
                                              'catalog_thumbnail','animation','uploaded_image')),
  ref_id        TEXT NOT NULL,
  remote_path   TEXT NOT NULL,
  local_path    TEXT NOT NULL CHECK (local_path NOT LIKE '%..%'),          -- RNF-22: rutas relativas, sin ..
  size_bytes    INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256        TEXT NOT NULL CHECK (length(sha256) = 64),
  downloaded_at TEXT NOT NULL CHECK (downloaded_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  last_used_at  TEXT NOT NULL CHECK (last_used_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  pinned        INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),        -- 1 = plantilla por defecto y su tipografía
  UNIQUE (kind, ref_id)
);

-- Último dato de los widgets Clima y Noticias (HE-04-HU05-ET05; H-D-13)
CREATE TABLE external_widget_cache (
  widget_id  TEXT PRIMARY KEY REFERENCES widget(id) ON DELETE CASCADE,
  payload    TEXT NOT NULL CHECK (json_valid(payload)),
  fetched_at TEXT NOT NULL CHECK (fetched_at GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9][0-9][0-9]Z'),
  status     TEXT NOT NULL CHECK (status IN ('ok','error','offline')),
  error_code TEXT
);
