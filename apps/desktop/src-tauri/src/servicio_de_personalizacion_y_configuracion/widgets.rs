//! Widgets del tema aplicado (HE-04): IPC-WID-01 `widget_list` y los rectángulos que pinta la capa
//! (IPC-DESK-01 `layer_get_initial_state`). Todo sale de la base local (`widget`, `theme_widget`).

use super::*;
use crate::tipos::{
    AnimationConfig, CarouselConfig, EmptyConfig, ImageRef, ImageSource, StaticImageConfig,
    TextConfig, WeatherConfig, WidgetConfig, WidgetItem, WidgetRect, WidgetType,
};

/// Los cuatro widgets por defecto, en el orden de la lista (HE-04-HU01-ET04).
const ORDEN_POR_DEFECTO: [&str; 4] = ["clock", "calendar", "daily_tasks", "kanban"];

pub(super) fn tipo_de_texto(valor: &str) -> Option<WidgetType> {
    Some(match valor {
        "clock" => WidgetType::Clock,
        "calendar" => WidgetType::Calendar,
        "daily_tasks" => WidgetType::DailyTasks,
        "kanban" => WidgetType::Kanban,
        "weather" => WidgetType::Weather,
        "news" => WidgetType::News,
        "music_player" => WidgetType::MusicPlayer,
        "animation" => WidgetType::Animation,
        "image_carousel" => WidgetType::ImageCarousel,
        "static_image" => WidgetType::StaticImage,
        "text" => WidgetType::Text,
        _ => return None,
    })
}

/// El nombre del widget en la interfaz (glosario; HE-04-HU04-CA01).
pub(super) fn nombre_del_tipo(tipo: &WidgetType) -> &'static str {
    match tipo {
        WidgetType::Clock => "Reloj",
        WidgetType::Calendar => "Calendario",
        WidgetType::DailyTasks => "Tareas del día",
        WidgetType::Kanban => "Kanban",
        WidgetType::Weather => "Clima",
        WidgetType::News => "Noticias",
        WidgetType::MusicPlayer => "Reproductor de música",
        WidgetType::Animation => "Animación",
        WidgetType::ImageCarousel => "Carrusel de imágenes",
        WidgetType::StaticImage => "Imagen estática",
        WidgetType::Text => "Texto",
    }
}

fn imagen(origen: Option<String>, catalogo: Option<String>, propia: Option<String>) -> ImageRef {
    ImageRef {
        source: if origen.as_deref() == Some("own") {
            ImageSource::Own
        } else {
            ImageSource::Catalog
        },
        catalog_image_id: catalogo,
        uploaded_image_id: propia.map(Uuid),
    }
}

const COLUMNAS_DEL_WIDGET: &str = "w.id, w.type, w.is_default, w.weather_city, w.text_content, \
     w.static_image_source, w.static_catalog_image_id, w.static_uploaded_image_id, w.animation_id, \
     w.carousel_interval_seconds, tw.is_active";

impl ServicioDePersonalizacion {
    /// El tema aplicado de la cuenta, si la base local ya lo trae.
    async fn id_del_tema_aplicado(
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<Option<String>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        sqlx::query_scalar("SELECT theme_id FROM applied_theme WHERE user_id = ?")
            .bind(user_id)
            .fetch_optional(pool)
            .await
            .map_err(de_sqlx)
    }

    /// Las imágenes de un Carrusel de imágenes, en su orden.
    async fn imagenes_del_carrusel(
        base: &BaseLocal,
        widget_id: &str,
    ) -> Result<Vec<ImageRef>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT source, catalog_image_id, uploaded_image_id FROM widget_carousel_item \
             WHERE widget_id = ? ORDER BY position",
        )
        .bind(widget_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                Ok(imagen(
                    f.try_get("source")?,
                    f.try_get("catalog_image_id")?,
                    f.try_get("uploaded_image_id")?,
                ))
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// Un elemento de la lista a partir de su fila (HE-04-HU01-ET03).
    async fn elemento(base: &BaseLocal, fila: &SqliteRow) -> Result<WidgetItem, AppError> {
        let id: String = fila.try_get("id").map_err(de_sqlx)?;
        let texto_del_tipo: String = fila.try_get("type").map_err(de_sqlx)?;
        let tipo = tipo_de_texto(&texto_del_tipo).ok_or_else(inesperado)?;
        let ciudad: Option<String> = fila.try_get("weather_city").map_err(de_sqlx)?;
        let texto: Option<String> = fila.try_get("text_content").map_err(de_sqlx)?;
        let config = match tipo {
            WidgetType::Weather => WidgetConfig::WeatherConfig(WeatherConfig {
                city: ciudad.clone().unwrap_or_default(),
            }),
            WidgetType::Text => WidgetConfig::TextConfig(TextConfig {
                text: texto.clone().unwrap_or_default(),
            }),
            WidgetType::Animation => WidgetConfig::AnimationConfig(AnimationConfig {
                animation_id: fila
                    .try_get::<Option<String>, _>("animation_id")
                    .map_err(de_sqlx)?
                    .unwrap_or_default(),
            }),
            WidgetType::StaticImage => WidgetConfig::StaticImageConfig(StaticImageConfig {
                base_image_ref: imagen(
                    fila.try_get("static_image_source").map_err(de_sqlx)?,
                    fila.try_get("static_catalog_image_id").map_err(de_sqlx)?,
                    fila.try_get("static_uploaded_image_id").map_err(de_sqlx)?,
                ),
            }),
            WidgetType::ImageCarousel => WidgetConfig::CarouselConfig(CarouselConfig {
                items: Self::imagenes_del_carrusel(base, &id).await?,
                interval_seconds: fila.try_get("carousel_interval_seconds").map_err(de_sqlx)?,
            }),
            _ => WidgetConfig::EmptyConfig(EmptyConfig {}),
        };
        let es_por_defecto = fila.try_get::<i64, _>("is_default").map_err(de_sqlx)? == 1;
        // Solo Clima (ciudad) y Texto (texto) tienen «Configurar» y un dato que los distingue (HE-04-HU12;
        // HE-04-HU01-ET03).
        let configurable = matches!(tipo, WidgetType::Weather | WidgetType::Text);
        Ok(WidgetItem {
            widget_id: Uuid(id),
            display_name: nombre_del_tipo(&tipo).to_string(),
            distinguishing_value: match tipo {
                WidgetType::Weather => ciudad,
                WidgetType::Text => texto,
                _ => None,
            },
            is_default: es_por_defecto,
            is_active: fila.try_get::<i64, _>("is_active").map_err(de_sqlx)? == 1,
            can_configure: configurable,
            // Los widgets por defecto no se eliminan (`widget.default_not_deletable`, HE-04-HU13).
            can_delete: !es_por_defecto,
            // DUDA: HE-04-HU01 la pausa por carga (`paused_by_load`) llega con las reglas de animación (P21).
            // Valor neutro: false.
            paused_by_load: false,
            r#type: tipo,
            config,
        })
    }

    /// IPC-WID-01 `widget_list`: los widgets del tema aplicado, primero los cuatro por defecto (Reloj,
    /// Calendario, Tareas del día y Kanban) y luego los agregados, del más antiguo al más reciente
    /// (HE-04-HU01-CA02, ET02). DUDA: HE-04-HU01 antes de la primera descarga (sin tema aplicado en la base
    /// local) la lista sale vacía: los widgets por defecto los crea el servidor (`on_account_confirmed`) y
    /// llegan con `sync_pull`.
    pub async fn widgets(
        &self,
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<Vec<WidgetItem>, AppError> {
        let Some(tema) = Self::id_del_tema_aplicado(base, user_id).await? else {
            return Ok(Vec::new());
        };
        let pool = base.pool().await.map_err(de_sqlx)?;
        let orden = ORDEN_POR_DEFECTO
            .iter()
            .enumerate()
            .map(|(i, t)| format!("WHEN '{t}' THEN {i}"))
            .collect::<Vec<_>>()
            .join(" ");
        let filas = sqlx::query(&format!(
            "SELECT {COLUMNAS_DEL_WIDGET} FROM theme_widget tw JOIN widget w ON w.id = tw.widget_id \
             WHERE tw.user_id = ? AND tw.theme_id = ? \
             ORDER BY w.is_default DESC, CASE w.type {orden} ELSE 9 END, w.created_at, w.id"
        ))
        .bind(user_id)
        .bind(&tema)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let mut lista = Vec::with_capacity(filas.len());
        for fila in &filas {
            lista.push(Self::elemento(base, fila).await?);
        }
        Ok(lista)
    }

    /// Los rectángulos de los widgets activos del tema aplicado, para la capa (IPC-DESK-01). Con todos
    /// inactivos, la lista sale vacía y la capa muestra solo el wallpaper (HE-04-HU01-CA03, ET05).
    /// DUDA: HE-04-HU01 las coordenadas se guardan sobre `ref_width` × `ref_height`; el ajuste a la resolución
    /// del monitor llega con la distribución de widgets (HE-05, P14). Valor neutro: x, y, ancho y alto tal
    /// cual se guardaron.
    pub async fn rectangulos_activos(
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<Vec<WidgetRect>, AppError> {
        let Some(tema) = Self::id_del_tema_aplicado(base, user_id).await? else {
            return Ok(Vec::new());
        };
        let pool = base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT w.id, w.type, tw.x, tw.y, tw.width, tw.height FROM theme_widget tw \
             JOIN widget w ON w.id = tw.widget_id \
             WHERE tw.user_id = ? AND tw.theme_id = ? AND tw.is_active = 1 \
             ORDER BY w.is_default DESC, w.created_at, w.id",
        )
        .bind(user_id)
        .bind(&tema)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                let tipo: String = f.try_get("type").map_err(de_sqlx)?;
                Ok(WidgetRect {
                    widget_id: Uuid(f.try_get("id").map_err(de_sqlx)?),
                    r#type: tipo_de_texto(&tipo).ok_or_else(inesperado)?,
                    x: f.try_get("x").map_err(de_sqlx)?,
                    y: f.try_get("y").map_err(de_sqlx)?,
                    width: f.try_get("width").map_err(de_sqlx)?,
                    height: f.try_get("height").map_err(de_sqlx)?,
                    is_active: true,
                })
            })
            .collect()
    }
}
