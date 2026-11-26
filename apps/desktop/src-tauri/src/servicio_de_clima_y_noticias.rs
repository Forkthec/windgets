//! Servicio de clima y noticias (arquitectura.md, vista 3b, Núcleo · servicios que usan la nube).
//! Responsabilidad: «Pide clima (cada 30 min) y titulares (cada 60 min) a las Edge Functions, guarda el último
//! dato y aísla la falla de cada widget.»
//!
//! HE-04-HU05: el widget Clima. La ciudad se valida con EF-02 `weather-geocode` y el clima se pide a EF-03
//! `weather-current` (INT-04). El último dato de cada widget se guarda en `external_widget_cache`; la falla de un
//! widget no toca a los demás (RNF-13).

use std::future::Future;

use serde_json::Value;
use sqlx::Row;

use crate::cliente_de_supabase::FallaDeAuth;
use crate::messages;
use crate::repositorios_y_archivos_locales::BaseLocal;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::{de_sqlx, error};
use crate::tipos::{
    AppError, ErrorCode, GeocodeResult, Instant, NewsData, NewsHeadlinesRequest,
    NewsHeadlinesResponse, WeatherCurrentRequest, WeatherCurrentResponse, WeatherData,
    WeatherGeocodeRequest, WeatherGeocodeResponse, WidgetData, WidgetDataPayload, WidgetDataStatus,
};

/// HE-04-HU05-ET05 (RNF-09): el widget Clima se actualiza cada 30 minutos.
pub const ACTUALIZACION_DEL_CLIMA_MS: i64 = 30 * 60 * 1000;
/// HE-04-HU06-ET03 (RNF-09): el widget Noticias se actualiza cada 60 minutos.
pub const ACTUALIZACION_DE_NOTICIAS_MS: i64 = 60 * 60 * 1000;
/// HE-04-HU06-ET02: los 5 titulares más recientes.
pub const TITULARES: usize = 5;
/// HE-04-HU05-ET10: la ciudad tiene de 1 a 100 caracteres.
pub const CIUDAD_MAX: usize = 100;

/// Las Edge Functions del clima con el JWT de la sesión (EF-02, EF-03).
pub trait NubeDeClima: Send + Sync {
    fn geocodificar(
        &self,
        token: &str,
        peticion: &WeatherGeocodeRequest,
    ) -> impl Future<Output = Result<WeatherGeocodeResponse, FallaDeAuth>> + Send;
    fn clima_actual(
        &self,
        token: &str,
        peticion: &WeatherCurrentRequest,
    ) -> impl Future<Output = Result<WeatherCurrentResponse, FallaDeAuth>> + Send;
    /// EF-04 `news-headlines` (HE-04-HU06; INT-05).
    fn titulares(
        &self,
        token: &str,
        peticion: &NewsHeadlinesRequest,
    ) -> impl Future<Output = Result<NewsHeadlinesResponse, FallaDeAuth>> + Send;
}

/// HE-04-HU05: la ciudad del campo Ciudad, sin espacios al inicio ni al final, validada con el servicio de clima
/// (ET06). Si hay varias, se toma la primera (ET15).
pub async fn resolver_ciudad(
    nube: &impl NubeDeClima,
    token: &str,
    ciudad: &str,
) -> Result<GeocodeResult, AppError> {
    let ciudad = ciudad.trim();
    if ciudad.chars().count() > CIUDAD_MAX {
        return Err(error(
            ErrorCode::CityTooLong,
            messages::CIUDAD_MUY_LARGA,
            Some("city"),
        ));
    }
    // ET03: la vista deshabilita «Agregar» con la ciudad vacía; si llega, no hay ciudad que reconocer.
    if ciudad.is_empty() {
        return Err(error(
            ErrorCode::CityNotFound,
            messages::CIUDAD_NO_ENCONTRADA,
            Some("city"),
        ));
    }
    let peticion = WeatherGeocodeRequest {
        query: ciudad.to_string(),
    };
    match nube.geocodificar(token, &peticion).await {
        Ok(respuesta) => respuesta.results.into_iter().next().ok_or_else(|| {
            error(
                ErrorCode::CityNotFound,
                messages::CIUDAD_NO_ENCONTRADA,
                Some("city"),
            )
        }),
        // DUDA: HE-04-HU05 el texto de `net.offline` al validar la ciudad no está definido al agregar (DP-07).
        // Valor usado: el de configurar el widget (IPC-WID-05).
        Err(FallaDeAuth::SinConexion) => Err(error(
            ErrorCode::NetOffline,
            messages::CIUDAD_SIN_CONEXION,
            Some("city"),
        )),
        // DUDA: HE-04-HU05 no define el texto si el servicio de clima falla al validar la ciudad. Valor usado: el
        // aviso del widget (CA07).
        Err(_) => Err(error(
            ErrorCode::ServiceUnavailable,
            messages::CLIMA_NO_DISPONIBLE,
            Some("city"),
        )),
    }
}

/// HE-04-HU05-ET18 (P29): las sugerencias del campo Ciudad (IPC-WID-08), hasta 5 lugares del servicio de clima
/// para lo que la persona lleva escrito. Menos de 2 caracteres no consulta (lista vacía); más de 100 es
/// `city.too_long`. Sin conexión y con el servicio caído, el mismo error que al validar la ciudad.
pub async fn buscar_ciudades(
    nube: &impl NubeDeClima,
    token: &str,
    texto: &str,
) -> Result<Vec<GeocodeResult>, AppError> {
    let texto = texto.trim();
    if texto.chars().count() > CIUDAD_MAX {
        return Err(error(
            ErrorCode::CityTooLong,
            messages::CIUDAD_MUY_LARGA,
            Some("city"),
        ));
    }
    if texto.chars().count() < BUSQUEDA_MINIMA {
        return Ok(Vec::new());
    }
    let peticion = WeatherGeocodeRequest {
        query: texto.to_string(),
    };
    match nube.geocodificar(token, &peticion).await {
        Ok(respuesta) => Ok(respuesta.results.into_iter().take(SUGERENCIAS).collect()),
        Err(FallaDeAuth::SinConexion) => Err(error(
            ErrorCode::NetOffline,
            messages::CIUDAD_SIN_CONEXION,
            Some("city"),
        )),
        Err(_) => Err(error(
            ErrorCode::ServiceUnavailable,
            messages::CLIMA_NO_DISPONIBLE,
            Some("city"),
        )),
    }
}

/// HE-04-HU05-ET18: las sugerencias empiezan con 2 caracteres y son 5 como máximo.
pub const BUSQUEDA_MINIMA: usize = 2;
pub const SUGERENCIAS: usize = 5;

/// HE-04-HU05-ET18 (P29): el lugar del widget Clima. Si la persona eligió uno de las sugerencias, se usa ese (sin
/// volver a consultar); si no, se valida el texto y se toma la primera coincidencia (ET15). Un lugar con datos
/// imposibles (sin nombre, más de 100 caracteres o coordenadas fuera de rango) es `city.not_found`.
pub async fn elegir_lugar(
    nube: &impl NubeDeClima,
    token: &str,
    ciudad: &str,
    elegido: Option<&GeocodeResult>,
) -> Result<GeocodeResult, AppError> {
    let Some(lugar) = elegido else {
        return resolver_ciudad(nube, token, ciudad).await;
    };
    let valido = !lugar.geo_id.trim().is_empty()
        && !lugar.name.trim().is_empty()
        && lugar.name.chars().count() <= CIUDAD_MAX
        && (-90.0..=90.0).contains(&lugar.latitude)
        && (-180.0..=180.0).contains(&lugar.longitude);
    if valido {
        Ok(lugar.clone())
    } else {
        Err(error(
            ErrorCode::CityNotFound,
            messages::CIUDAD_NO_ENCONTRADA,
            Some("city"),
        ))
    }
}

/// ET13 (INT-04): la condición del clima en español según el código WMO.
pub fn condicion(codigo: &str) -> &'static str {
    match codigo.trim().parse::<u16>().unwrap_or(u16::MAX) {
        0 => "Despejado",
        1 => "Mayormente despejado",
        2 => "Parcialmente nublado",
        3 => "Nublado",
        45 | 48 => "Niebla",
        51 | 53 | 55 | 56 | 57 => "Llovizna",
        61 | 63 | 65 | 66 | 67 => "Lluvia",
        71 | 73 | 75 | 77 => "Nieve",
        80..=82 => "Chubascos",
        85 | 86 => "Chubascos de nieve",
        95 | 96 | 99 => "Tormenta",
        _ => "Condición no disponible",
    }
}

/// ET05, ET07: toca consultar si nunca se consultó o si pasaron 30 minutos desde la última consulta, también
/// tras una falla (se reintenta en la siguiente actualización periódica). ET08: sin conexión se consulta en
/// cuanto vuelve la conexión.
pub fn toca_actualizar(
    ultima: Option<(&str, &WidgetDataStatus)>,
    en_linea: bool,
    ahora_ms: i64,
) -> bool {
    toca_actualizar_cada(ultima, en_linea, ahora_ms, ACTUALIZACION_DEL_CLIMA_MS)
}

/// Como [`toca_actualizar`], con el intervalo de cada widget externo: 30 min el Clima y 60 min Noticias
/// (HE-04-HU06-ET03, ET05, ET06).
pub fn toca_actualizar_cada(
    ultima: Option<(&str, &WidgetDataStatus)>,
    en_linea: bool,
    ahora_ms: i64,
    intervalo_ms: i64,
) -> bool {
    if !en_linea {
        return false;
    }
    let Some((fecha, estado)) = ultima else {
        return true;
    };
    if *estado == WidgetDataStatus::Offline {
        return true;
    }
    chrono::DateTime::parse_from_rfc3339(fecha)
        .map(|f| ahora_ms - f.timestamp_millis() >= intervalo_ms)
        .unwrap_or(true)
}

fn estado_de_texto(texto: &str) -> WidgetDataStatus {
    match texto {
        "error" => WidgetDataStatus::Error,
        "offline" => WidgetDataStatus::Offline,
        _ => WidgetDataStatus::Ok,
    }
}

fn texto_de_estado(estado: &WidgetDataStatus) -> &'static str {
    match estado {
        WidgetDataStatus::Ok => "ok",
        WidgetDataStatus::Error => "error",
        WidgetDataStatus::Offline => "offline",
    }
}

/// IPC-WID-07 `widget_get_data`: el último dato guardado del widget. Sin consulta todavía, `ok` sin datos.
pub async fn datos(base: &BaseLocal, widget_id: &str) -> Result<WidgetData, AppError> {
    let pool = base.pool().await.map_err(de_sqlx)?;
    let fila = sqlx::query(
        "SELECT payload, fetched_at, status FROM external_widget_cache WHERE widget_id = ?",
    )
    .bind(widget_id)
    .fetch_optional(pool)
    .await
    .map_err(de_sqlx)?;
    let Some(fila) = fila else {
        return Ok(WidgetData {
            status: WidgetDataStatus::Ok,
            payload: None,
            fetched_at: None,
        });
    };
    let payload: String = fila.try_get("payload").map_err(de_sqlx)?;
    let estado: String = fila.try_get("status").map_err(de_sqlx)?;
    Ok(WidgetData {
        status: estado_de_texto(&estado),
        payload: serde_json::from_str::<WidgetDataPayload>(&payload).ok(),
        fetched_at: Some(Instant(fila.try_get("fetched_at").map_err(de_sqlx)?)),
    })
}

/// Los widgets Clima del usuario: (id, ciudad, geo_id, latitud, longitud).
pub async fn widgets_de_clima(
    base: &BaseLocal,
    user_id: &str,
) -> Result<Vec<(String, String, String, f64, f64)>, AppError> {
    let pool = base.pool().await.map_err(de_sqlx)?;
    sqlx::query_as(
        "SELECT id, weather_city, weather_geo_id, weather_latitude, weather_longitude FROM widget \
         WHERE user_id = ? AND type = 'weather'",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(de_sqlx)
}

/// La fecha y el estado de la última consulta del widget.
pub async fn ultima_consulta(
    base: &BaseLocal,
    widget_id: &str,
) -> Result<Option<(String, WidgetDataStatus)>, AppError> {
    let pool = base.pool().await.map_err(de_sqlx)?;
    let fila: Option<(String, String)> =
        sqlx::query_as("SELECT fetched_at, status FROM external_widget_cache WHERE widget_id = ?")
            .bind(widget_id)
            .fetch_optional(pool)
            .await
            .map_err(de_sqlx)?;
    Ok(fila.map(|(f, e)| (f, estado_de_texto(&e))))
}

/// Consulta el clima de un widget y guarda el resultado (ET05 a ET08). Sin conexión o con falla del servicio
/// conserva el último dato con el estado `offline` o `error`; la vista muestra el aviso.
pub async fn actualizar_clima(
    base: &BaseLocal,
    nube: &impl NubeDeClima,
    token: &str,
    widget: &(String, String, String, f64, f64),
    ahora_ms: i64,
) -> Result<WidgetData, AppError> {
    let (id, ciudad, geo_id, latitud, longitud) = widget;
    let peticion = WeatherCurrentRequest {
        geo_id: geo_id.clone(),
        latitude: *latitud,
        longitude: *longitud,
    };
    let (estado, nuevo) = match nube.clima_actual(token, &peticion).await {
        Ok(r) => (
            WidgetDataStatus::Ok,
            Some(WidgetDataPayload::WeatherData(WeatherData {
                city: ciudad.clone(),
                temperature_c: r.temperature_c,
                // ET13: el texto lo pone el Núcleo con la tabla del contrato.
                condition_text: condicion(&r.condition_code).to_string(),
                condition_code: r.condition_code,
                is_day: r.is_day,
            })),
        ),
        Err(FallaDeAuth::SinConexion) => (WidgetDataStatus::Offline, None),
        Err(_) => (WidgetDataStatus::Error, None),
    };
    guardar(base, id, estado, nuevo, ahora_ms).await
}

/// Los widgets Noticias del usuario (uno como máximo, HE-04-HU04-ET04).
pub async fn widgets_de_noticias(base: &BaseLocal, user_id: &str) -> Result<Vec<String>, AppError> {
    let pool = base.pool().await.map_err(de_sqlx)?;
    sqlx::query_scalar("SELECT id FROM widget WHERE user_id = ? AND type = 'news'")
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)
}

/// HE-04-HU06: consulta los titulares y guarda los 5 más recientes con su fuente (ET02). Sin conexión o con falla
/// del servicio conserva los últimos con el estado `offline` o `error` (ET05, ET06).
pub async fn actualizar_noticias(
    base: &BaseLocal,
    nube: &impl NubeDeClima,
    token: &str,
    widget_id: &str,
    ahora_ms: i64,
) -> Result<WidgetData, AppError> {
    // DUDA: HE-04-HU06 la edición de los titulares no está definida (DP-18). Valor usado: la de la Edge Function.
    let peticion = NewsHeadlinesRequest { edition: None };
    let (estado, nuevo) = match nube.titulares(token, &peticion).await {
        Ok(mut r) => {
            r.headlines
                .sort_by(|a, b| b.published_at.0.cmp(&a.published_at.0));
            r.headlines.truncate(TITULARES);
            (
                WidgetDataStatus::Ok,
                Some(WidgetDataPayload::NewsData(NewsData {
                    headlines: r.headlines,
                })),
            )
        }
        Err(FallaDeAuth::SinConexion) => (WidgetDataStatus::Offline, None),
        Err(_) => (WidgetDataStatus::Error, None),
    };
    guardar(base, widget_id, estado, nuevo, ahora_ms).await
}

/// Guarda el resultado de una consulta en `external_widget_cache`; sin dato nuevo conserva el anterior.
async fn guardar(
    base: &BaseLocal,
    id: &str,
    estado: WidgetDataStatus,
    nuevo: Option<WidgetDataPayload>,
    ahora_ms: i64,
) -> Result<WidgetData, AppError> {
    let anterior = datos(base, id).await?.payload;
    let payload = nuevo.or(anterior);
    let texto = payload.as_ref().map_or(Value::Null, |p| {
        serde_json::to_value(p).unwrap_or(Value::Null)
    });
    let fecha = instante(ahora_ms).0;
    let pool = base.pool().await.map_err(de_sqlx)?;
    sqlx::query(
        "INSERT INTO external_widget_cache (widget_id, payload, fetched_at, status) VALUES (?, ?, ?, ?) \
         ON CONFLICT(widget_id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at, \
         status = excluded.status",
    )
    .bind(id)
    .bind(texto.to_string())
    .bind(&fecha)
    .bind(texto_de_estado(&estado))
    .execute(pool)
    .await
    .map_err(de_sqlx)?;
    Ok(WidgetData {
        status: estado,
        payload,
        fetched_at: Some(Instant(fecha)),
    })
}
