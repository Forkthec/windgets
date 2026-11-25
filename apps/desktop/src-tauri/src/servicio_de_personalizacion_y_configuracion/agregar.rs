//! IPC-WID-04 `widget_add` (HE-04-HU05 a HE-04-HU11): agregar un widget opcional al tema aplicado. Cada tipo
//! llega con su HU; el widget queda activo, con el tamaño inicial de su tipo y en la primera posición libre
//! (contratos.md, «Tamaño inicial y posición libre de un widget nuevo»; D-042).

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::campos;
use crate::tipos::{GeocodeResult, ImageRef, ImageSource, WidgetItem};

/// El escritorio de referencia de las posiciones guardadas (píxeles lógicos, como la semilla).
pub const REFERENCIA: (i64, i64) = (1920, 1080);
/// El dato nuevo de un widget que se configura (HE-04-HU12).
pub enum Configuracion<'a> {
    /// La ciudad que reconoció el servicio de clima.
    Ciudad(&'a GeocodeResult),
    Texto(&'a str),
}

/// HE-04-HU08-ET02, ET05 (D-040): de 2 a 10 imágenes por carrusel.
pub const CARRUSEL_MIN: usize = 2;
pub const CARRUSEL_MAX: usize = 10;
/// HE-04-HU08-ET04: el intervalo va de 3 a 60 segundos, 5 por defecto.
pub const INTERVALO_MIN: i64 = 3;
pub const INTERVALO_MAX: i64 = 60;
pub const INTERVALO_POR_DEFECTO: i64 = 5;
/// HE-04-HU10-ET02: el texto del widget Texto tiene de 1 a 200 caracteres.
pub const TEXTO_MAX: usize = 200;
/// Paso con que se recorre el escritorio para buscar una posición libre.
const PASO: i64 = 20;

/// El tamaño inicial de cada tipo de widget agregable (sobre 1920 × 1080).
pub fn tamano_inicial(tipo: &str) -> (i64, i64) {
    match tipo {
        "news" => (480, 360),
        "static_image" | "animation" => (320, 180),
        "image_carousel" => (480, 270),
        // rediseno_final_backend.md §5.5: los ojos de Windi.
        "windi" => (120, 120),
        // Clima (HE-04-HU05-ET17), Texto y Reproductor de música.
        _ => (320, 160),
    }
}

/// La primera posición, en pasos de 20 px por filas de arriba abajo y de izquierda a derecha, donde el rectángulo
/// cabe entero en el escritorio y no se superpone a ningún widget activo. Sin ninguna, (0, 0) (DP-20).
pub fn posicion_libre(ocupados: &[(i64, i64, i64, i64)], ancho: i64, alto: i64) -> (i64, i64) {
    let (total_x, total_y) = REFERENCIA;
    let choca = |x: i64, y: i64| {
        ocupados
            .iter()
            .any(|&(ox, oy, ow, oh)| x < ox + ow && ox < x + ancho && y < oy + oh && oy < y + alto)
    };
    let mut y = 0;
    while y + alto <= total_y {
        let mut x = 0;
        while x + ancho <= total_x {
            if !choca(x, y) {
                return (x, y);
            }
            x += PASO;
        }
        y += PASO;
    }
    (0, 0)
}

impl ServicioDePersonalizacion {
    /// Crea el widget con sus datos y lo agrega activo al tema aplicado en una posición libre. Encola las dos
    /// filas para sincronizar (D-189).
    async fn insertar_widget(
        &self,
        base: &BaseLocal,
        user_id: &str,
        tipo: &str,
        datos: &[(&str, Value)],
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let tema = Self::id_del_tema_aplicado(base, user_id)
            .await?
            .ok_or_else(inesperado)?;
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ocupados: Vec<(i64, i64, i64, i64)> = sqlx::query_as(
            "SELECT x, y, width, height FROM theme_widget WHERE user_id = ? AND theme_id = ? AND is_active = 1",
        )
        .bind(user_id)
        .bind(&tema)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let (ancho, alto) = tamano_inicial(tipo);
        let (x, y) = posicion_libre(&ocupados, ancho, alto);
        let ahora = instante(ahora_ms).0;
        let widget_id = uuid::Uuid::new_v4().to_string();
        let mut valores: Vec<(&str, Value)> = vec![("type", Value::from(tipo))];
        valores.extend(datos.iter().cloned());
        let (fields, mods) = campos(&valores, &ahora);
        let columnas: Vec<&str> = valores.iter().map(|(c, _)| *c).collect();
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let sql = format!(
            "INSERT INTO widget (id, user_id, created_at, field_mods, {}) VALUES (?, ?, ?, ?, {})",
            columnas.join(", "),
            vec!["?"; columnas.len()].join(", ")
        );
        let mut consulta = sqlx::query(&sql)
            .bind(&widget_id)
            .bind(user_id)
            .bind(&ahora)
            .bind(mods.to_string());
        for (_, valor) in &valores {
            consulta = match valor {
                Value::String(t) => consulta.bind(t.clone()),
                Value::Number(n) if n.is_f64() => consulta.bind(n.as_f64()),
                Value::Number(n) => consulta.bind(n.as_i64()),
                _ => consulta.bind(None::<String>),
            };
        }
        consulta.execute(&mut *tx).await.map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "widget", &widget_id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;

        let id_en_el_tema = uuid::Uuid::new_v4().to_string();
        let (ref_ancho, ref_alto) = REFERENCIA;
        let en_el_tema: Vec<(&str, Value)> = vec![
            ("theme_id", Value::from(tema.as_str())),
            ("widget_id", Value::from(widget_id.as_str())),
            ("is_active", Value::from(true)),
            ("x", Value::from(x)),
            ("y", Value::from(y)),
            ("width", Value::from(ancho)),
            ("height", Value::from(alto)),
            ("ref_width", Value::from(ref_ancho)),
            ("ref_height", Value::from(ref_alto)),
        ];
        let (fields, mods) = campos(&en_el_tema, &ahora);
        sqlx::query(
            "INSERT INTO theme_widget (id, user_id, created_at, field_mods, theme_id, widget_id, is_active, \
             x, y, width, height, ref_width, ref_height) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id_en_el_tema)
        .bind(user_id)
        .bind(&ahora)
        .bind(mods.to_string())
        .bind(&tema)
        .bind(&widget_id)
        .bind(x)
        .bind(y)
        .bind(ancho)
        .bind(alto)
        .bind(ref_ancho)
        .bind(ref_alto)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(
            &mut tx,
            "theme_widget",
            &id_en_el_tema,
            "upsert",
            &fields,
            &ahora,
        )
        .await
        .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;

        self.widgets(base, user_id)
            .await?
            .into_iter()
            .find(|w| w.widget_id.0 == widget_id)
            .ok_or_else(inesperado)
    }

    /// HE-04-HU06: agrega el widget Noticias. Va una sola vez (HE-04-HU04-ET04): si ya está, `widget.already_added`.
    pub async fn agregar_noticias(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ya: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM widget WHERE user_id = ? AND type = 'news'")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(de_sqlx)?;
        if ya > 0 {
            return Err(error(
                ErrorCode::WidgetAlreadyAdded,
                messages::WIDGET_YA_AGREGADO,
                None,
            ));
        }
        self.insertar_widget(base, user_id, "news", &[], ahora_ms)
            .await
    }

    /// rediseno_final_backend.md §5.5 (D-07, A-07): agrega el widget Windi, uno solo por cuenta; si ya está,
    /// `widget.already_added` como Noticias (HE-04-HU04-ET04).
    pub async fn agregar_windi(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ya: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM widget WHERE user_id = ? AND type = 'windi'")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(de_sqlx)?;
        if ya > 0 {
            return Err(error(
                ErrorCode::WidgetAlreadyAdded,
                messages::WIDGET_YA_AGREGADO,
                None,
            ));
        }
        self.insertar_widget(base, user_id, "windi", &[], ahora_ms)
            .await
    }

    /// La imagen elegida existe: una imagen propia del usuario o una del catálogo de imágenes (HE-04-HU07-ET02,
    /// ET03). Devuelve las columnas del widget con la imagen.
    async fn columnas_de_imagen(
        base: &BaseLocal,
        user_id: &str,
        imagen: &ImageRef,
    ) -> Result<Vec<(&'static str, Value)>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let no_existe = || error(ErrorCode::ImageNotFound, "", None);
        match imagen.source {
            ImageSource::Own => {
                let id = imagen
                    .uploaded_image_id
                    .as_ref()
                    .ok_or_else(no_existe)?
                    .0
                    .to_lowercase();
                let hay: i64 = sqlx::query_scalar(
                    "SELECT COUNT(*) FROM uploaded_image WHERE id = ? AND user_id = ?",
                )
                .bind(&id)
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(de_sqlx)?;
                if hay == 0 {
                    return Err(no_existe());
                }
                Ok(vec![
                    ("static_image_source", Value::from("own")),
                    ("static_uploaded_image_id", Value::from(id)),
                ])
            }
            ImageSource::Catalog => {
                let id = imagen.catalog_image_id.clone().ok_or_else(no_existe)?;
                let hay: i64 =
                    sqlx::query_scalar("SELECT COUNT(*) FROM catalog_image WHERE id = ?")
                        .bind(&id)
                        .fetch_one(pool)
                        .await
                        .map_err(de_sqlx)?;
                if hay == 0 {
                    return Err(no_existe());
                }
                Ok(vec![
                    ("static_image_source", Value::from("catalog")),
                    ("static_catalog_image_id", Value::from(id)),
                ])
            }
        }
    }

    /// HE-04-HU07: agrega el widget Imagen estática con una imagen propia o del catálogo de imágenes, de 320 × 180
    /// en la primera posición libre (ET06). Se puede agregar varias veces (D-038).
    pub async fn agregar_imagen_estatica(
        &self,
        base: &BaseLocal,
        user_id: &str,
        imagen: &ImageRef,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let columnas = Self::columnas_de_imagen(base, user_id, imagen).await?;
        self.insertar_widget(base, user_id, "static_image", &columnas, ahora_ms)
            .await
    }

    /// HE-04-HU08: agrega el Carrusel de imágenes con 2 a 10 imágenes, propias o del catálogo, en el orden elegido
    /// (ET02, ET05), y un intervalo de 3 a 60 s, 5 por defecto (ET04). Mide 480 × 270 (ET08).
    /// DUDA: HE-04-HU08 `interval_seconds` es opcional en IPC-WID-04 (5 por defecto), así que el Núcleo no
    /// distingue el campo vacío (CA08, `interval.required`): lo valida la vista.
    pub async fn agregar_carrusel(
        &self,
        base: &BaseLocal,
        user_id: &str,
        imagenes: &[ImageRef],
        intervalo: Option<i64>,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        if imagenes.len() < CARRUSEL_MIN {
            return Err(error(
                ErrorCode::CarouselTooFew,
                messages::CARRUSEL_POCAS_IMAGENES,
                None,
            ));
        }
        if imagenes.len() > CARRUSEL_MAX {
            return Err(error(
                ErrorCode::CarouselTooMany,
                messages::CARRUSEL_DEMASIADAS_IMAGENES,
                None,
            ));
        }
        let intervalo = intervalo.unwrap_or(INTERVALO_POR_DEFECTO);
        if !(INTERVALO_MIN..=INTERVALO_MAX).contains(&intervalo) {
            return Err(error(
                ErrorCode::IntervalOutOfRange,
                messages::INTERVALO_FUERA_DE_RANGO,
                Some("interval_seconds"),
            ));
        }
        let mut elementos = Vec::with_capacity(imagenes.len());
        for imagen in imagenes {
            elementos.push(Self::columnas_de_imagen(base, user_id, imagen).await?);
        }
        let widget = self
            .insertar_widget(
                base,
                user_id,
                "image_carousel",
                &[("carousel_interval_seconds", Value::from(intervalo))],
                ahora_ms,
            )
            .await?;
        let ahora = instante(ahora_ms).0;
        let pool = base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        for (i, columnas) in elementos.iter().enumerate() {
            let id = uuid::Uuid::new_v4().to_string();
            // Las columnas de la imagen del widget, sin el prefijo `static_`.
            let mut valores: Vec<(&str, Value)> = vec![
                ("widget_id", Value::from(widget.widget_id.0.as_str())),
                ("position", Value::from((i as f64 + 1.0) * 1024.0)),
            ];
            for (columna, valor) in columnas {
                let columna = match *columna {
                    "static_image_source" => "source",
                    "static_catalog_image_id" => "catalog_image_id",
                    _ => "uploaded_image_id",
                };
                valores.push((columna, valor.clone()));
            }
            let (fields, mods) = campos(&valores, &ahora);
            let nombres: Vec<&str> = valores.iter().map(|(c, _)| *c).collect();
            let sql = format!(
                "INSERT INTO widget_carousel_item (id, user_id, created_at, field_mods, {}) VALUES (?, ?, ?, ?, {})",
                nombres.join(", "),
                vec!["?"; nombres.len()].join(", ")
            );
            let mut consulta = sqlx::query(&sql)
                .bind(&id)
                .bind(user_id)
                .bind(&ahora)
                .bind(mods.to_string());
            for (_, valor) in &valores {
                consulta = match valor {
                    Value::Number(n) => consulta.bind(n.as_f64()),
                    otro => consulta.bind(otro.as_str().map(str::to_string)),
                };
            }
            consulta.execute(&mut *tx).await.map_err(de_sqlx)?;
            encolar_cambio(
                &mut tx,
                "widget_carousel_item",
                &id,
                "upsert",
                &fields,
                &ahora,
            )
            .await
            .map_err(de_sqlx)?;
        }
        tx.commit().await.map_err(de_sqlx)?;
        self.widgets(base, user_id)
            .await?
            .into_iter()
            .find(|w| w.widget_id == widget.widget_id)
            .ok_or_else(inesperado)
    }

    /// HE-04-HU09: agrega el widget Animación con una animación del catálogo (ET02), de 320 × 180 en la primera
    /// posición libre (ET09). DUDA: HE-04-HU09 no define el error de una animación que no está en el catálogo
    /// (la vista solo ofrece las del catálogo). Valor usado: `asset.unavailable` sin texto.
    pub async fn agregar_animacion(
        &self,
        base: &BaseLocal,
        user_id: &str,
        animation_id: &str,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let hay: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM catalog_animation WHERE id = ? AND is_active = 1",
        )
        .bind(animation_id)
        .fetch_one(pool)
        .await
        .map_err(de_sqlx)?;
        if hay == 0 {
            return Err(error(ErrorCode::AssetUnavailable, "", None));
        }
        self.insertar_widget(
            base,
            user_id,
            "animation",
            &[("animation_id", Value::from(animation_id))],
            ahora_ms,
        )
        .await
    }

    /// HE-04-HU10-ET02, ET03, ET05: el texto, sin espacios al inicio ni al final, de 1 a 200 caracteres.
    pub fn validar_texto(texto: &str) -> Result<String, AppError> {
        let texto = texto.trim();
        if texto.chars().count() > TEXTO_MAX {
            return Err(error(
                ErrorCode::TextTooLong,
                messages::TEXTO_MUY_LARGO,
                Some("text"),
            ));
        }
        if texto.is_empty() {
            // La vista deshabilita «Agregar» con el texto vacío (CA02).
            return Err(error(
                ErrorCode::NameRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("text"),
            ));
        }
        Ok(texto.to_string())
    }

    /// HE-04-HU10: agrega el widget Texto, de 320 × 160 en la primera posición libre (ET06). No tiene fuente ni
    /// tamaño propios: usa la tipografía y el color del texto del tema (ET04; D-041).
    pub async fn agregar_texto(
        &self,
        base: &BaseLocal,
        user_id: &str,
        texto: &str,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let texto = Self::validar_texto(texto)?;
        self.insertar_widget(
            base,
            user_id,
            "text",
            &[("text_content", Value::from(texto))],
            ahora_ms,
        )
        .await
    }

    /// HE-04-HU11: agrega el Reproductor de música (uno solo, ET04; D-038), de 320 × 160 en la primera posición
    /// libre (ET10). No necesita conexión ni cuentas de música (ET05).
    pub async fn agregar_reproductor(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ya: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM widget WHERE user_id = ? AND type = 'music_player'",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(de_sqlx)?;
        if ya > 0 {
            return Err(error(
                ErrorCode::WidgetAlreadyAdded,
                messages::WIDGET_YA_AGREGADO,
                None,
            ));
        }
        self.insertar_widget(base, user_id, "music_player", &[], ahora_ms)
            .await
    }

    /// IPC-WID-05 `widget_configure` (HE-04-HU12): cambia la ciudad del Clima o el texto del Texto con las mismas
    /// reglas que al agregarlos (ET02, ET04). La ciudad no se repite en otro Clima (CA05); el propio no cuenta.
    pub async fn configurar_widget(
        &self,
        base: &BaseLocal,
        user_id: &str,
        widget_id: &str,
        cambio: Configuracion<'_>,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let tipo: String =
            sqlx::query_scalar("SELECT type FROM widget WHERE id = ? AND user_id = ?")
                .bind(widget_id)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(widget_no_existe)?;
        let valores: Vec<(&str, Value)> = match (tipo.as_str(), cambio) {
            ("weather", Configuracion::Ciudad(ciudad)) => {
                let otros: Vec<(String, String)> = sqlx::query_as(
                    "SELECT weather_geo_id, weather_city FROM widget \
                     WHERE user_id = ? AND type = 'weather' AND id <> ?",
                )
                .bind(user_id)
                .bind(widget_id)
                .fetch_all(pool)
                .await
                .map_err(de_sqlx)?;
                let nombre = ciudad.name.trim();
                if otros.iter().any(|(geo, n)| {
                    *geo == ciudad.geo_id || n.trim().to_lowercase() == nombre.to_lowercase()
                }) {
                    return Err(error(
                        ErrorCode::CityDuplicate,
                        messages::CIUDAD_DUPLICADA,
                        Some("city"),
                    ));
                }
                vec![
                    ("weather_city", Value::from(nombre)),
                    ("weather_geo_id", Value::from(ciudad.geo_id.as_str())),
                    ("weather_latitude", Value::from(ciudad.latitude)),
                    ("weather_longitude", Value::from(ciudad.longitude)),
                ]
            }
            ("text", Configuracion::Texto(texto)) => {
                vec![("text_content", Value::from(Self::validar_texto(texto)?))]
            }
            // Solo Clima y Texto tienen «Configurar» (ET01, `can_configure`).
            _ => return Err(inesperado()),
        };
        let ahora = instante(ahora_ms).0;
        let (fields, mods) = campos(&valores, &ahora);
        let asignaciones: Vec<String> = valores.iter().map(|(c, _)| format!("{c} = ?")).collect();
        let sql = format!(
            "UPDATE widget SET {}, field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
            asignaciones.join(", ")
        );
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let mut consulta = sqlx::query(&sql);
        for (_, valor) in &valores {
            consulta = match valor {
                Value::Number(n) => consulta.bind(n.as_f64()),
                otro => consulta.bind(otro.as_str().map(str::to_string)),
            };
        }
        consulta
            .bind(mods.to_string())
            .bind(widget_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        // El clima guardado era de la ciudad anterior: se consulta de nuevo (CA01).
        sqlx::query("DELETE FROM external_widget_cache WHERE widget_id = ?")
            .bind(widget_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "widget", widget_id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        self.widgets(base, user_id)
            .await?
            .into_iter()
            .find(|w| w.widget_id.0 == widget_id)
            .ok_or_else(inesperado)
    }

    /// HE-04-HU05: agrega un widget Clima para la ciudad que reconoció el servicio de clima. Un widget por ciudad
    /// (ET04; D-038): si ya hay uno para esa ciudad, `city.duplicate` (CA05).
    pub async fn agregar_clima(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ciudad: &GeocodeResult,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let existentes: Vec<(String, String)> = sqlx::query_as(
            "SELECT weather_geo_id, weather_city FROM widget WHERE user_id = ? AND type = 'weather'",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let nombre = ciudad.name.trim();
        if existentes.iter().any(|(geo, n)| {
            *geo == ciudad.geo_id || n.trim().to_lowercase() == nombre.to_lowercase()
        }) {
            return Err(error(
                ErrorCode::CityDuplicate,
                messages::CIUDAD_DUPLICADA,
                Some("city"),
            ));
        }
        // ET15: solo el nombre de la ciudad, sin región ni país.
        self.insertar_widget(
            base,
            user_id,
            "weather",
            &[
                ("weather_city", Value::from(nombre)),
                ("weather_geo_id", Value::from(ciudad.geo_id.as_str())),
                ("weather_latitude", Value::from(ciudad.latitude)),
                ("weather_longitude", Value::from(ciudad.longitude)),
            ],
            ahora_ms,
        )
        .await
    }
}
