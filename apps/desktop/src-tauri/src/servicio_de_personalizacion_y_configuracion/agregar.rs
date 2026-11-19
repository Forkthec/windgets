//! IPC-WID-04 `widget_add` (HE-04-HU05 a HE-04-HU11): agregar un widget opcional al tema aplicado. Cada tipo
//! llega con su HU; el widget queda activo, con el tamaño inicial de su tipo y en la primera posición libre
//! (contratos.md, «Tamaño inicial y posición libre de un widget nuevo»; D-042).

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::campos;
use crate::tipos::{GeocodeResult, WidgetItem};

/// El escritorio de referencia de las posiciones guardadas (píxeles lógicos, como la semilla).
pub const REFERENCIA: (i64, i64) = (1920, 1080);
/// Paso con que se recorre el escritorio para buscar una posición libre.
const PASO: i64 = 20;

/// El tamaño inicial de cada tipo de widget agregable (sobre 1920 × 1080).
pub fn tamano_inicial(tipo: &str) -> (i64, i64) {
    match tipo {
        "news" => (480, 360),
        "static_image" | "animation" => (320, 180),
        "image_carousel" => (480, 270),
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
