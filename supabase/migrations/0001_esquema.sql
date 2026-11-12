-- ============================================================================
-- Windgets · 0001_esquema.sql
-- Tipos, tablas, claves, CHECK, UNIQUE, índices y columnas de sincronización.
-- Fuente: modelo de datos de Windgets (secciones 1 a 6). Cada comentario cita la
-- ET/CA/RNF/D de origen. Los límites de longitud se cuentan en caracteres Unicode
-- (char_length), no en bytes.
-- ============================================================================

-- Secuencia global de sincronización: cursor de la descarga incremental (D-049,
-- HE-15-HU04-ET06). La asigna el disparador set_updated_seq (0003).
CREATE SEQUENCE IF NOT EXISTS public.sync_seq;

-- Color en formato #RRGGBB (HE-02-HU05-ET02, ET04, ET06).
CREATE DOMAIN public.hex_color AS text
  CONSTRAINT hex_color_formato CHECK (VALUE ~ '^#[0-9A-Fa-f]{6}$');

-- ============================================================================
-- CATÁLOGOS (solo lectura para el usuario; D-180, D-198)
-- ============================================================================

-- Catálogo de tipografías (HE-02-HU06-ET03)
CREATE TABLE public.catalog_font (
  id           text PRIMARY KEY,
  family_name  text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  file_path    text NOT NULL,                 -- archivo .woff2 en el bucket catalog
  license      text NOT NULL,                 -- Duda/propuesta: solo licencias abiertas
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true
);

-- Catálogo de plantillas (HE-02-HU02-ET03 a ET06; HE-02-HU01-ET02)
CREATE TABLE public.catalog_template (
  id                       text PRIMARY KEY,
  name                     text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  thumbnail_path           text NOT NULL,
  bundle_path              text NOT NULL,     -- carpeta en Storage con HTML, CSS y JS
  default_background_path  text NOT NULL,     -- HE-02-HU04-ET01
  default_color_primary    public.hex_color NOT NULL,   -- HE-02-HU08-ET01
  default_color_secondary  public.hex_color NOT NULL,
  default_color_text       public.hex_color NOT NULL,
  default_font_id          text NOT NULL REFERENCES public.catalog_font(id),
  is_default               boolean NOT NULL DEFAULT false,
  sort_order               integer NOT NULL DEFAULT 0,
  is_active                boolean NOT NULL DEFAULT true,
  bundle_version           integer NOT NULL DEFAULT 1
);
-- Una sola plantilla por defecto (glosario: Plantilla por defecto).
CREATE UNIQUE INDEX uq_catalog_template_default ON public.catalog_template ((true)) WHERE is_default;

-- Catálogo de paletas (HE-02-HU07-ET02)
CREATE TABLE public.catalog_palette (
  id              text PRIMARY KEY,
  name            text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  color_primary   public.hex_color NOT NULL,
  color_secondary public.hex_color NOT NULL,
  color_text      public.hex_color NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true
);

-- Catálogo de imágenes (HE-02-HU03-ET03)
CREATE TABLE public.catalog_image (
  id             text PRIMARY KEY,
  name           text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  storage_path   text NOT NULL,
  thumbnail_path text NOT NULL,
  width          integer NOT NULL CHECK (width > 0),
  height         integer NOT NULL CHECK (height > 0),
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true
);

-- Catálogo de animaciones (HE-04-HU09-ET02). Formato: Duda/propuesta.
CREATE TABLE public.catalog_animation (
  id             text PRIMARY KEY,
  name           text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  storage_path   text NOT NULL,
  thumbnail_path text NOT NULL,
  format         text NOT NULL CHECK (format IN ('lottie','webm')),
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true
);

-- Catálogo de colores de etiquetas y columnas (HE-09-HU03-ET05, ET06; HE-08-HU02-ET05)
CREATE TABLE public.catalog_color (
  id         text PRIMARY KEY,                -- slug, p. ej. 'gray'
  name       text NOT NULL,                   -- nombre en español
  hex        public.hex_color NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);

-- Versión de los catálogos (D-198). Sube con cada cambio de un catálogo (0003).
CREATE TABLE public.catalog_meta (
  id      smallint PRIMARY KEY CHECK (id = 1),
  version integer NOT NULL DEFAULT 1
);

-- Caché de clima y noticias del servidor (RNF-09). Solo la usan las Edge Functions.
CREATE TABLE public.external_cache (
  key        text PRIMARY KEY,                -- 'weather:{geo_id}' | 'news:{edición}'
  payload    jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- ============================================================================
-- ENTIDADES SINCRONIZADAS (columnas comunes de la sección 1.2)
--   id, user_id, created_at, field_mods, deleted_at, updated_seq
-- ============================================================================

-- 3.1 Perfil de la cuenta (Alias). Solo bajada: lo crea on_account_confirmed.
CREATE TABLE public.profile (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,   -- RNF-21
  alias         text NOT NULL
                CONSTRAINT profile_alias_ck CHECK (btrim(alias) <> '' AND char_length(alias) BETWEEN 1 AND 30), -- HE-01-HU01-ET02..ET04; D-023 (no único: D-003)
  auth_provider text NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email','google')), -- HE-01-HU05-ET02 (Duda/propuesta)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_seq   bigint NOT NULL DEFAULT 0
);

-- 3.2 Preferencias (una fila por usuario: id = user_id)
CREATE TABLE public.user_preference (
  id              uuid PRIMARY KEY CHECK (id = user_id),
  user_id         uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  field_mods      jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at      timestamptz CHECK (deleted_at IS NULL),   -- nunca se elimina
  updated_seq     bigint NOT NULL DEFAULT 0,
  board_card_view text NOT NULL DEFAULT 'compact' CHECK (board_card_view IN ('compact','expanded'))  -- HE-09-HU07-ET02, ET05
);

-- 3.3 Columna del tablero Kanban
CREATE TABLE public.kanban_column (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  field_mods  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at  timestamptz,
  updated_seq bigint NOT NULL DEFAULT 0,
  name        text NOT NULL
              CONSTRAINT kanban_column_name_ck CHECK (btrim(name) <> '' AND char_length(name) BETWEEN 1 AND 30), -- HE-09-HU03-ET03; HE-09-HU04-ET03
  color_id    text NOT NULL REFERENCES public.catalog_color(id),                     -- HE-09-HU03-ET05, ET06
  role        text NOT NULL DEFAULT 'custom' CHECK (role IN ('todo','in_progress','done','custom')), -- HE-09-HU01-ET02; HE-09-HU04-ET06
  position    double precision NOT NULL                                              -- HE-09-HU03-ET09; HE-09-HU05-ET03
);
-- Nombre único por usuario sin distinguir mayúsculas ni espacios de los extremos (HE-09-HU03-ET04; HE-09-HU04-ET04)
CREATE UNIQUE INDEX uq_kanban_column_name ON public.kanban_column (user_id, lower(btrim(name))) WHERE deleted_at IS NULL;
-- Un solo todo / in_progress / done vivos por usuario (HE-09-HU06-ET02)
CREATE UNIQUE INDEX uq_kanban_column_role ON public.kanban_column (user_id, role) WHERE deleted_at IS NULL AND role <> 'custom';
CREATE INDEX ix_kanban_column_pos  ON public.kanban_column (user_id, position) WHERE deleted_at IS NULL;
CREATE INDEX ix_kanban_column_sync ON public.kanban_column (user_id, updated_seq);

-- 3.4 Tarjeta
CREATE TABLE public.card (
  id                 uuid PRIMARY KEY,
  user_id            uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now(),   -- HE-13-HU02-ET13 (fecha de creación de la primera tarjeta)
  field_mods         jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at         timestamptz,
  updated_seq        bigint NOT NULL DEFAULT 0,
  type               text NOT NULL DEFAULT 'task' CHECK (type IN ('task','reminder','event')),           -- HE-07-HU01-ET05
  title              text NOT NULL
                     CONSTRAINT card_title_ck CHECK (btrim(title) <> '' AND char_length(title) BETWEEN 1 AND 100),  -- HE-07-HU01-ET06, ET07; HE-07-HU04-ET05
  description        text CONSTRAINT card_description_ck CHECK (description IS NULL OR char_length(description) <= 1000), -- HE-07-HU01-ET10
  priority           text CHECK (priority IS NULL OR priority IN ('high','medium','low')),               -- HE-07-HU01-ET11
  due_date           date NOT NULL,   -- HE-07-HU01-ET08, ET09: «no anterior a hoy» lo valida el Núcleo (hoy cambia), no un CHECK
  column_id          uuid NOT NULL REFERENCES public.kanban_column(id),                                  -- HE-07-HU01-ET13
  position           double precision NOT NULL,                                                          -- HE-09-HU02-ET08, ET12
  previous_column_id uuid REFERENCES public.kanban_column(id),                                           -- HE-12-HU02-ET03, ET04
  completed_on       date,                                                                               -- HE-09-HU02-ET04..ET07
  scheduled_date     date,                                                                               -- HE-11-HU02-ET03, ET08
  scheduled_hour     smallint CONSTRAINT card_hour_ck CHECK (scheduled_hour BETWEEN 0 AND 23),           -- HE-11-HU01-CA01
  CONSTRAINT card_schedule_pair_ck CHECK ((scheduled_date IS NULL) = (scheduled_hour IS NULL)),
  CONSTRAINT card_schedule_due_ck  CHECK (scheduled_date IS NULL OR scheduled_date <= due_date)          -- HE-11-HU02-ET08; HE-07-HU04-ET13
);
CREATE INDEX ix_card_column    ON public.card (user_id, column_id, position) WHERE deleted_at IS NULL;
CREATE INDEX ix_card_due       ON public.card (user_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX ix_card_schedule  ON public.card (user_id, scheduled_date, scheduled_hour) WHERE deleted_at IS NULL AND scheduled_date IS NOT NULL;
CREATE INDEX ix_card_completed ON public.card (user_id, completed_on) WHERE deleted_at IS NULL AND completed_on IS NOT NULL;  -- reportes
CREATE INDEX ix_card_sync      ON public.card (user_id, updated_seq);

-- 3.5 Etiqueta
CREATE TABLE public.label (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  field_mods  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at  timestamptz,
  updated_seq bigint NOT NULL DEFAULT 0,
  name        text NOT NULL
              CONSTRAINT label_name_ck CHECK (btrim(name) <> '' AND char_length(name) BETWEEN 1 AND 30),  -- HE-08-HU02-ET03; HE-08-HU03-ET03
  color_id    text NOT NULL REFERENCES public.catalog_color(id)                                          -- HE-08-HU02-ET05, ET14; D-162 (sin valor por defecto)
);
CREATE UNIQUE INDEX uq_label_name ON public.label (user_id, lower(btrim(name))) WHERE deleted_at IS NULL;  -- HE-08-HU02-ET04
CREATE INDEX ix_label_sync ON public.label (user_id, updated_seq);

-- 3.6 Etiqueta de la tarjeta (unión). id = UUID v5(card_id:label_id) generado por el Núcleo (1.3)
CREATE TABLE public.card_label (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  field_mods  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at  timestamptz,
  updated_seq bigint NOT NULL DEFAULT 0,
  card_id     uuid NOT NULL REFERENCES public.card(id),    -- HE-07-HU02-ET02
  label_id    uuid NOT NULL REFERENCES public.label(id),   -- HE-07-HU02-ET03
  CONSTRAINT uq_card_label_pair UNIQUE (card_id, label_id)
);
CREATE INDEX ix_card_label_card  ON public.card_label (card_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_card_label_label ON public.card_label (label_id) WHERE deleted_at IS NULL;  -- HE-08-HU04-CA03; HE-13-HU05-ET03
CREATE INDEX ix_card_label_sync  ON public.card_label (user_id, updated_seq);

-- 3.7 Imagen propia (metadatos; el archivo está en Storage, bucket user-images)
CREATE TABLE public.uploaded_image (
  id           uuid PRIMARY KEY,
  user_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  field_mods   jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at   timestamptz,
  updated_seq  bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,                                                       -- D-180; RNF-21
  mime_type    text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png')),       -- RNF-22; HE-02-HU03-ET04
  extension    text NOT NULL CHECK (extension IN ('jpg','jpeg','png')),             -- RNF-22
  size_bytes   integer NOT NULL
               CONSTRAINT uploaded_image_size_ck CHECK (size_bytes > 0 AND size_bytes <= 20971520),  -- RNF-23: 20 MB = 20 971 520 bytes
  width        integer NOT NULL CHECK (width > 0),                                  -- HE-02-HU03-ET05
  height       integer NOT NULL CHECK (height > 0),
  sha256       text NOT NULL CONSTRAINT uploaded_image_sha_ck CHECK (sha256 ~ '^[0-9a-f]{64}$'),  -- Duda/propuesta
  CONSTRAINT uq_uploaded_image_path UNIQUE (storage_path),
  -- forma {user_id}/{id}.{ext} en el bucket user-images (sección 9)
  CONSTRAINT uploaded_image_path_ck CHECK (storage_path = user_id::text || '/' || id::text || '.' || extension),
  CONSTRAINT uploaded_image_mime_ck CHECK ((mime_type = 'image/png' AND extension = 'png')
                                       OR (mime_type = 'image/jpeg' AND extension IN ('jpg','jpeg')))
);
CREATE INDEX ix_uploaded_image_sync ON public.uploaded_image (user_id, updated_seq);

-- 3.8 Tema (máximo 10 vivos por usuario: HE-03-HU02-ET05; D-035 → disparador en 0003)
CREATE TABLE public.theme (
  id                           uuid PRIMARY KEY,
  user_id                      uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  field_mods                   jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at                   timestamptz,
  updated_seq                  bigint NOT NULL DEFAULT 0,
  name                         text NOT NULL
                               CONSTRAINT theme_name_ck CHECK (btrim(name) <> '' AND char_length(name) BETWEEN 1 AND 40),  -- HE-03-HU02-ET02; HE-03-HU04-ET03
  template_id                  text NOT NULL REFERENCES public.catalog_template(id),            -- HE-02-HU02-ET06
  background_source            text NOT NULL DEFAULT 'template_default'
                               CHECK (background_source IN ('template_default','catalog','own')),  -- HE-02-HU03-ET03; HE-02-HU04-ET01
  background_catalog_image_id  text REFERENCES public.catalog_image(id),
  background_uploaded_image_id uuid REFERENCES public.uploaded_image(id),
  color_primary                public.hex_color NOT NULL,                                       -- HE-02-HU05-ET02
  color_secondary              public.hex_color NOT NULL,
  color_text                   public.hex_color NOT NULL,
  palette_id                   text REFERENCES public.catalog_palette(id),                      -- NULL = «Personalizada» (HE-02-HU07-ET03)
  font_id                      text NOT NULL REFERENCES public.catalog_font(id),                -- HE-02-HU06-ET03
  font_size                    text NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small','medium','large')), -- HE-02-HU06-ET04
  last_modified_at             timestamptz NOT NULL DEFAULT now(),                              -- HE-03-HU01-ET02
  -- La fuente del fondo exige exactamente la imagen que le corresponde (HE-02-HU03-ET03)
  CONSTRAINT theme_background_ck CHECK (
       (background_source = 'template_default' AND background_catalog_image_id IS NULL AND background_uploaded_image_id IS NULL)
    OR (background_source = 'catalog' AND background_catalog_image_id IS NOT NULL AND background_uploaded_image_id IS NULL)
    OR (background_source = 'own' AND background_uploaded_image_id IS NOT NULL AND background_catalog_image_id IS NULL))
);
CREATE UNIQUE INDEX uq_theme_name ON public.theme (user_id, lower(btrim(name))) WHERE deleted_at IS NULL;  -- HE-03-HU02-ET04
CREATE INDEX ix_theme_recent ON public.theme (user_id, last_modified_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_theme_sync   ON public.theme (user_id, updated_seq);

-- 3.9 Tema aplicado (una fila por usuario: id = user_id). Copia del contenido aplicado.
CREATE TABLE public.applied_theme (
  id                           uuid PRIMARY KEY CHECK (id = user_id),
  user_id                      uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  field_mods                   jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at                   timestamptz CHECK (deleted_at IS NULL),   -- nunca se elimina
  updated_seq                  bigint NOT NULL DEFAULT 0,
  theme_id                     uuid NOT NULL REFERENCES public.theme(id),                       -- HE-03-HU01-CA01; HE-02-HU12-ET01
  template_id                  text NOT NULL REFERENCES public.catalog_template(id),            -- HE-02-HU01-ET03
  background_source            text NOT NULL DEFAULT 'template_default'
                               CHECK (background_source IN ('template_default','catalog','own')),
  background_catalog_image_id  text REFERENCES public.catalog_image(id),
  background_uploaded_image_id uuid REFERENCES public.uploaded_image(id),
  color_primary                public.hex_color NOT NULL,                                       -- HE-03-HU06-ET01, ET02
  color_secondary              public.hex_color NOT NULL,
  color_text                   public.hex_color NOT NULL,
  font_id                      text NOT NULL REFERENCES public.catalog_font(id),                -- HE-03-HU06-ET05
  font_size                    text NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small','medium','large')),
  applied_at                   timestamptz NOT NULL DEFAULT now(),                              -- HE-02-HU12-ET01
  CONSTRAINT applied_theme_background_ck CHECK (
       (background_source = 'template_default' AND background_catalog_image_id IS NULL AND background_uploaded_image_id IS NULL)
    OR (background_source = 'catalog' AND background_catalog_image_id IS NOT NULL AND background_uploaded_image_id IS NULL)
    OR (background_source = 'own' AND background_uploaded_image_id IS NOT NULL AND background_catalog_image_id IS NULL))
);
CREATE INDEX ix_applied_theme_sync ON public.applied_theme (user_id, updated_seq);

-- 3.10 Widget (instancia del usuario; no pertenece a un tema: HE-04-HU13-ET02)
CREATE TABLE public.widget (
  id                        uuid PRIMARY KEY,
  user_id                   uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at                timestamptz NOT NULL DEFAULT now(),
  field_mods                jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at                timestamptz,
  updated_seq               bigint NOT NULL DEFAULT 0,
  type                      text NOT NULL CHECK (type IN ('clock','calendar','daily_tasks','kanban','weather','news',
                                'music_player','animation','image_carousel','static_image','text')),  -- HE-04-HU01-ET04; HE-04-HU04-CA01
  is_default                boolean NOT NULL DEFAULT false,                                           -- HE-04-HU13-ET04
  weather_city              text,      -- HE-04-HU05-ET02, ET03, ET06 (límite de 100: Duda/propuesta)
  weather_geo_id            text,      -- HE-04-HU05-CA05 (Duda/propuesta)
  weather_latitude          double precision,
  weather_longitude         double precision,
  text_content              text,      -- HE-04-HU10-ET02, ET03, ET05
  static_image_source       text,      -- HE-04-HU07-ET02, ET03
  static_catalog_image_id   text REFERENCES public.catalog_image(id),
  static_uploaded_image_id  uuid REFERENCES public.uploaded_image(id),
  animation_id              text REFERENCES public.catalog_animation(id),    -- HE-04-HU09-ET02
  carousel_interval_seconds smallint,  -- HE-04-HU08-ET04
  -- Por defecto solo Reloj, Calendario, Tareas del día y Kanban (HE-04-HU01-ET04)
  CONSTRAINT widget_default_ck CHECK (is_default = (type IN ('clock','calendar','daily_tasks','kanban'))),
  -- Clima: ciudad obligatoria; en los demás tipos, nulo
  CONSTRAINT widget_weather_ck CHECK (
    (type = 'weather' AND weather_city IS NOT NULL AND btrim(weather_city) <> '' AND char_length(weather_city) BETWEEN 1 AND 100
       AND weather_geo_id IS NOT NULL AND weather_latitude IS NOT NULL AND weather_latitude BETWEEN -90 AND 90
       AND weather_longitude IS NOT NULL AND weather_longitude BETWEEN -180 AND 180)
    OR (type <> 'weather' AND weather_city IS NULL AND weather_geo_id IS NULL AND weather_latitude IS NULL AND weather_longitude IS NULL)),
  -- Texto: de 1 a 200 caracteres (HE-04-HU10-ET03)
  CONSTRAINT widget_text_ck CHECK (
    (type = 'text' AND text_content IS NOT NULL AND btrim(text_content) <> '' AND char_length(text_content) BETWEEN 1 AND 200)
    OR (type <> 'text' AND text_content IS NULL)),
  -- Imagen estática: catálogo o propia, con su imagen (HE-04-HU07-ET02, ET03)
  CONSTRAINT widget_static_image_ck CHECK (
    (type = 'static_image' AND (
         (static_image_source = 'catalog' AND static_catalog_image_id IS NOT NULL AND static_uploaded_image_id IS NULL)
      OR (static_image_source = 'own' AND static_uploaded_image_id IS NOT NULL AND static_catalog_image_id IS NULL)))
    OR (type <> 'static_image' AND static_image_source IS NULL AND static_catalog_image_id IS NULL AND static_uploaded_image_id IS NULL)),
  CONSTRAINT widget_animation_ck CHECK (
    (type = 'animation' AND animation_id IS NOT NULL) OR (type <> 'animation' AND animation_id IS NULL)),
  -- Carrusel: intervalo de 3 a 60 s (HE-04-HU08-ET04)
  CONSTRAINT widget_carousel_ck CHECK (
    (type = 'image_carousel' AND carousel_interval_seconds IS NOT NULL AND carousel_interval_seconds BETWEEN 3 AND 60)
    OR (type <> 'image_carousel' AND carousel_interval_seconds IS NULL))
);
-- D-038: Noticias, Reproductor de música y los cuatro por defecto, una sola vez por usuario
CREATE UNIQUE INDEX uq_widget_singleton ON public.widget (user_id, type)
  WHERE deleted_at IS NULL AND type IN ('news','music_player','clock','calendar','daily_tasks','kanban');
-- D-038: Clima, uno por ciudad (HE-04-HU05-CA05)
CREATE UNIQUE INDEX uq_widget_weather_city ON public.widget (user_id, weather_geo_id)
  WHERE deleted_at IS NULL AND type = 'weather';
CREATE INDEX ix_widget_type ON public.widget (user_id, type) WHERE deleted_at IS NULL;
CREATE INDEX ix_widget_sync ON public.widget (user_id, updated_seq);

-- 3.11 Widget del tema (estado activo y distribución). id = UUID v5(theme_id:widget_id)
CREATE TABLE public.theme_widget (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  field_mods  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at  timestamptz,
  updated_seq bigint NOT NULL DEFAULT 0,
  theme_id    uuid NOT NULL REFERENCES public.theme(id),     -- HE-03-HU02-ET06
  widget_id   uuid NOT NULL REFERENCES public.widget(id),
  is_active   boolean NOT NULL DEFAULT true,                 -- HE-04-HU02-ET02, ET03
  x           integer NOT NULL CONSTRAINT theme_widget_pos_x_ck CHECK (x >= 0),       -- HE-05-HU02-ET02; D-135
  y           integer NOT NULL CONSTRAINT theme_widget_pos_y_ck CHECK (y >= 0),
  width       integer NOT NULL CONSTRAINT theme_widget_width_ck CHECK (width >= 100),  -- HE-05-HU03-ET02, ET03
  height      integer NOT NULL CONSTRAINT theme_widget_height_ck CHECK (height >= 100),
  ref_width   integer NOT NULL CHECK (ref_width > 0),        -- HE-15-HU04-ET09, ET10 (Duda/propuesta)
  ref_height  integer NOT NULL CHECK (ref_height > 0),
  CONSTRAINT uq_theme_widget_pair UNIQUE (theme_id, widget_id)
);
CREATE INDEX ix_theme_widget_theme  ON public.theme_widget (theme_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_theme_widget_widget ON public.theme_widget (widget_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_theme_widget_sync   ON public.theme_widget (user_id, updated_seq);

-- 3.12 Imagen del Carrusel de imágenes (de 2 a 10 vivas por carrusel: HE-04-HU08-ET02; RNF-10; D-040)
CREATE TABLE public.widget_carousel_item (
  id                uuid PRIMARY KEY,
  user_id           uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profile(user_id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  field_mods        jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_mods) = 'object'),
  deleted_at        timestamptz,
  updated_seq       bigint NOT NULL DEFAULT 0,
  widget_id         uuid NOT NULL REFERENCES public.widget(id),                -- HE-04-HU08-ET02
  source            text NOT NULL CHECK (source IN ('catalog','own')),
  catalog_image_id  text REFERENCES public.catalog_image(id),
  uploaded_image_id uuid REFERENCES public.uploaded_image(id),
  position          double precision NOT NULL,
  CONSTRAINT widget_carousel_item_source_ck CHECK (
       (source = 'catalog' AND catalog_image_id IS NOT NULL AND uploaded_image_id IS NULL)
    OR (source = 'own' AND uploaded_image_id IS NOT NULL AND catalog_image_id IS NULL))
);
CREATE INDEX ix_carousel_item_pos  ON public.widget_carousel_item (widget_id, position) WHERE deleted_at IS NULL;
CREATE INDEX ix_carousel_item_sync ON public.widget_carousel_item (user_id, updated_seq);
