//! Widgets (HE-04): IPC-WID-01 `widget_list`, IPC-WID-02 `widget_catalog_get`, IPC-WID-03 `widget_set_active`,
//! IPC-WID-06 `widget_delete` y los rectángulos que pinta la capa (IPC-DESK-01 `layer_get_initial_state`). Todo sale de la base local
//! (`widget`, `theme_widget`).

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::{ConMensaje, instante};
use crate::servicio_del_planificador::{campos, resultado};
use crate::tipos::{
    AddableWidgetType, AnimationConfig, CarouselConfig, EmptyConfig, ImageRef, ImageSource,
    StaticImageConfig, TextConfig, WeatherConfig, WidgetCatalog, WidgetCatalogEntry, WidgetConfig,
    WidgetItem, WidgetRect, WidgetType,
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

/// El catálogo de widgets, sin los widgets por defecto (HE-04-HU04-ET02, ET03): tipo, nombre y descripción de
/// una línea, y si se agrega una sola vez (D-038: Noticias y Reproductor de música).
/// DUDA: HE-04-HU04 ningún CA define la descripción de una línea. Valor usado: el «Para…» de la HU que agrega
/// cada widget (HE-04-HU05 a HU11).
const CATALOGO_EXTERNO: [(AddableWidgetType, &str, &str, bool); 2] = [
    (
        AddableWidgetType::Weather,
        "Clima",
        "Conocer el clima actual sin abrir otra aplicación.",
        false,
    ),
    (
        AddableWidgetType::News,
        "Noticias",
        "Conocer los titulares recientes desde el escritorio.",
        true,
    ),
];

const CATALOGO_LOCAL: [(AddableWidgetType, &str, &str, bool); 5] = [
    (
        AddableWidgetType::Animation,
        "Animación",
        "Dar movimiento al escritorio.",
        false,
    ),
    (
        AddableWidgetType::ImageCarousel,
        "Carrusel de imágenes",
        "Ver varias imágenes que cambian automáticamente sobre el wallpaper.",
        false,
    ),
    (
        AddableWidgetType::StaticImage,
        "Imagen estática",
        "Mostrar una imagen preferida sobre el wallpaper.",
        false,
    ),
    (
        AddableWidgetType::MusicPlayer,
        "Reproductor de música",
        "Seguir la música que suena desde el escritorio.",
        true,
    ),
    (
        AddableWidgetType::Text,
        "Texto",
        "Tener a la vista una frase o nota breve.",
        false,
    ),
];

fn texto_del_agregable(tipo: &AddableWidgetType) -> &'static str {
    match tipo {
        AddableWidgetType::Weather => "weather",
        AddableWidgetType::News => "news",
        AddableWidgetType::MusicPlayer => "music_player",
        AddableWidgetType::Animation => "animation",
        AddableWidgetType::ImageCarousel => "image_carousel",
        AddableWidgetType::StaticImage => "static_image",
        AddableWidgetType::Text => "text",
    }
}

const COLUMNAS_DEL_WIDGET: &str = "w.id, w.type, w.is_default, w.weather_city, w.text_content, \
     w.static_image_source, w.static_catalog_image_id, w.static_uploaded_image_id, w.animation_id, \
     w.carousel_interval_seconds, tw.is_active";

impl ServicioDePersonalizacion {
    /// El tema aplicado de la cuenta, si la base local ya lo trae.
    pub(super) async fn id_del_tema_aplicado(
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
            // HE-04-HU09-ET07: la Animación en pausa por alto consumo de recursos.
            paused_by_load: tipo == WidgetType::Animation
                && crate::integracion_con_el_sistema::carga::EN_PAUSA
                    .load(std::sync::atomic::Ordering::Relaxed),
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

    /// El tema aplicado de la cuenta (para los avisos de la sincronización, HE-15-HU04).
    pub async fn id_del_tema(base: &BaseLocal, user_id: &str) -> Result<Option<String>, AppError> {
        Self::id_del_tema_aplicado(base, user_id).await
    }

    /// HE-15-HU04-CA05: los widgets activos ajustados al monitor principal desde el escritorio de referencia con
    /// que se guardó cada uno. Sin monitores, tal como se guardaron. Con varios monitores, el principal, el mismo
    /// de la pantalla de edición (HE-05-HU02-ET07; antes el primero de la lista).
    pub async fn rectangulos_ajustados(
        base: &BaseLocal,
        user_id: &str,
        monitores: &[crate::tipos::Monitor],
    ) -> Result<Vec<WidgetRect>, AppError> {
        let rects = Self::rectangulos_activos(base, user_id).await?;
        if monitores.is_empty() {
            return Ok(rects);
        }
        let principal = super::distribucion::monitor_principal(monitores);
        let pantalla = (principal.width, principal.height);
        let Some(tema) = Self::id_del_tema_aplicado(base, user_id).await? else {
            return Ok(rects);
        };
        let pool = base.pool().await.map_err(de_sqlx)?;
        let referencias: Vec<(String, i64, i64)> = sqlx::query_as(
            "SELECT widget_id, ref_width, ref_height FROM theme_widget WHERE user_id = ? AND theme_id = ?",
        )
        .bind(user_id)
        .bind(&tema)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let con_referencia: Vec<_> = rects
            .into_iter()
            .map(|r| {
                let referencia = referencias
                    .iter()
                    .find(|(id, _, _)| *id == r.widget_id.0)
                    .map_or(pantalla, |(_, w, h)| (*w, *h));
                (r, referencia)
            })
            .collect();
        Ok(super::ajuste::ajustar(&con_referencia, pantalla))
    }

    /// IPC-WID-03 `widget_set_active`: activa o desactiva el widget en el tema aplicado sin eliminarlo ni tocar
    /// los demás (HE-04-HU02-ET02). Solo cambia `is_active`: al activarlo vuelve con su última posición y su
    /// último tamaño (ET03). El cambio se encola para sincronizarlo (D-189) y el puente avisa a la capa con
    /// EV-12 (ET01, RNF-01). Un widget que no está en el tema aplicado es `widget.not_found`.
    pub async fn activar_widget(
        &self,
        base: &BaseLocal,
        user_id: &str,
        widget_id: &str,
        activo: bool,
        ahora_ms: i64,
    ) -> Result<WidgetItem, AppError> {
        let no_existe = || error(ErrorCode::WidgetNotFound, "", None);
        let tema = Self::id_del_tema_aplicado(base, user_id)
            .await?
            .ok_or_else(no_existe)?;
        let pool = base.pool().await.map_err(de_sqlx)?;
        let id_del_widget_del_tema: String = sqlx::query_scalar(
            "SELECT id FROM theme_widget WHERE user_id = ? AND theme_id = ? AND widget_id = ?",
        )
        .bind(user_id)
        .bind(&tema)
        .bind(widget_id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?
        .ok_or_else(no_existe)?;

        let ahora = instante(ahora_ms).0;
        let (fields, mods) = campos(&[("is_active", Value::from(activo))], &ahora);
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        sqlx::query(
            "UPDATE theme_widget SET is_active = ?, field_mods = json_patch(field_mods, ?) \
             WHERE id = ? AND user_id = ?",
        )
        .bind(i64::from(activo))
        .bind(mods.to_string())
        .bind(&id_del_widget_del_tema)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(
            &mut tx,
            "theme_widget",
            &id_del_widget_del_tema,
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
            .ok_or_else(no_existe)
    }

    /// IPC-WID-06 `widget_delete` (HE-04-HU13): elimina un widget externo o local de la cuenta y de todos los
    /// temas que lo incluyen, con las imágenes de su carrusel, y encola cada eliminación (D-189; ET02). Al no
    /// quedar el widget, ningún servicio de internet lo vuelve a consultar (ET03) y Noticias vuelve a estar
    /// habilitado en el catálogo (ET06). Los demás widgets, también otros Clima, no cambian (ET05). Los widgets
    /// por defecto no se eliminan (`widget.default_not_deletable`, ET04).
    pub async fn eliminar_widget(
        &self,
        base: &BaseLocal,
        user_id: &str,
        widget_id: &str,
        ahora_ms: i64,
    ) -> Result<ConMensaje<()>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let por_defecto: i64 =
            sqlx::query_scalar("SELECT is_default FROM widget WHERE id = ? AND user_id = ?")
                .bind(widget_id)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(|| error(ErrorCode::WidgetNotFound, "", None))?;
        if por_defecto == 1 {
            return Err(error(
                ErrorCode::WidgetDefaultNotDeletable,
                messages::WIDGET_POR_DEFECTO_NO_ELIMINABLE,
                None,
            ));
        }
        let ahora = instante(ahora_ms).0;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        for tabla in ["theme_widget", "widget_carousel_item"] {
            let ids: Vec<String> = sqlx::query_scalar(&format!(
                "SELECT id FROM {tabla} WHERE widget_id = ? AND user_id = ?"
            ))
            .bind(widget_id)
            .bind(user_id)
            .fetch_all(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            for id in ids {
                sqlx::query(&format!("DELETE FROM {tabla} WHERE id = ?"))
                    .bind(&id)
                    .execute(&mut *tx)
                    .await
                    .map_err(de_sqlx)?;
                encolar_cambio(&mut tx, tabla, &id, "delete", &Value::Null, &ahora)
                    .await
                    .map_err(de_sqlx)?;
            }
        }
        sqlx::query("DELETE FROM widget WHERE id = ? AND user_id = ?")
            .bind(widget_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "widget", widget_id, "delete", &Value::Null, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        Ok(ConMensaje {
            valor: (),
            mensaje: resultado("widget_delete", messages::WIDGET_ELIMINADO),
        })
    }

    /// IPC-WID-02 `widget_catalog_get`: los widgets que se pueden agregar, en «Widgets externos» y «Widgets
    /// locales», sin los cuatro por defecto (HE-04-HU04-CA01, ET02, ET03). Noticias y Reproductor de música ya
    /// agregados salen deshabilitados con «Ya agregaste este widget.»; los demás siempre habilitados: Clima va
    /// una vez por ciudad y los locales, varias veces (CA02, ET04, D-038).
    pub async fn catalogo_de_widgets(
        &self,
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<WidgetCatalog, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let agregados: Vec<String> =
            sqlx::query_scalar("SELECT DISTINCT type FROM widget WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(pool)
                .await
                .map_err(de_sqlx)?;
        let entradas = |grupo: &[(AddableWidgetType, &str, &str, bool)]| {
            grupo
                .iter()
                .map(|(tipo, nombre, descripcion, una_vez)| {
                    let ya_agregado =
                        *una_vez && agregados.iter().any(|t| t == texto_del_agregable(tipo));
                    WidgetCatalogEntry {
                        r#type: tipo.clone(),
                        name: (*nombre).to_string(),
                        description: (*descripcion).to_string(),
                        enabled: !ya_agregado,
                        disabled_reason: ya_agregado
                            .then(|| messages::WIDGET_YA_AGREGADO.to_string()),
                    }
                })
                .collect()
        };
        Ok(WidgetCatalog {
            external: entradas(&CATALOGO_EXTERNO),
            local: entradas(&CATALOGO_LOCAL),
        })
    }
}
