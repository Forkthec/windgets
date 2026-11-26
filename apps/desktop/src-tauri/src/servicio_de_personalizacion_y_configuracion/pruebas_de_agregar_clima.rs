//! Pruebas del Núcleo de HE-04-HU05 (agregar el widget Clima) con el servicio de clima simulado. La vista tiene
//! las suyas en AgregarClima.test.tsx y WidgetClima.test.tsx; la Edge Function, en clima.test.ts.

use std::sync::Mutex;

use super::pruebas_de_widgets::{con_widgets_por_defecto, lista};
use super::*;
use crate::cliente_de_supabase::FallaDeAuth;
use crate::servicio_de_clima_y_noticias::{
    self as clima, ACTUALIZACION_DEL_CLIMA_MS, NubeDeClima, actualizar_clima, condicion,
    resolver_ciudad, toca_actualizar,
};
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{
    GeocodeResult, Instant, WeatherCurrentRequest, WeatherCurrentResponse,
    WeatherCurrentResponseCache, WeatherGeocodeRequest, WeatherGeocodeResponse, WidgetDataPayload,
    WidgetDataStatus,
};

const AHORA_MS: i64 = 1_794_657_600_000;

/// Servicio de clima simulado: Popayán y Cali existen; el clima responde lo que se le indique.
pub(super) struct ClimaSimulado {
    clima: Mutex<Result<(f64, &'static str), FallaDeAuth>>,
    de_dia: Mutex<Option<bool>>,
    noticias: Mutex<Result<usize, FallaDeAuth>>,
    consultas: Mutex<Vec<String>>,
}

impl ClimaSimulado {
    pub(super) fn nuevo() -> Self {
        Self {
            clima: Mutex::new(Ok((21.4, "2"))),
            de_dia: Mutex::new(None),
            noticias: Mutex::new(Ok(6)),
            consultas: Mutex::new(Vec::new()),
        }
    }

    fn responde(&self, r: Result<(f64, &'static str), FallaDeAuth>) {
        *self.clima.lock().unwrap() = r;
    }
}

fn ciudad(geo: &str, nombre: &str) -> GeocodeResult {
    GeocodeResult {
        geo_id: geo.into(),
        name: nombre.into(),
        admin1: None,
        country: "Colombia".into(),
        latitude: 2.44,
        longitude: -76.61,
    }
}

impl ClimaSimulado {
    pub(super) fn noticias(&self, r: Result<usize, FallaDeAuth>) {
        *self.noticias.lock().unwrap() = r;
    }
}

impl NubeDeClima for ClimaSimulado {
    async fn geocodificar(
        &self,
        _token: &str,
        peticion: &WeatherGeocodeRequest,
    ) -> Result<WeatherGeocodeResponse, FallaDeAuth> {
        self.consultas.lock().unwrap().push(peticion.query.clone());
        let results = match peticion.query.to_lowercase().as_str() {
            "popayán" => vec![ciudad("3673269", "Popayán"), ciudad("1", "Popayán (otra)")],
            "cali" => vec![ciudad("3687925", "Cali")],
            _ => Vec::new(),
        };
        Ok(WeatherGeocodeResponse { results })
    }

    async fn clima_actual(
        &self,
        _token: &str,
        peticion: &WeatherCurrentRequest,
    ) -> Result<WeatherCurrentResponse, FallaDeAuth> {
        let r = self.clima.lock().unwrap().clone();
        r.map(|(t, codigo)| WeatherCurrentResponse {
            geo_id: peticion.geo_id.clone(),
            temperature_c: t,
            condition_code: codigo.into(),
            condition_text: String::new(),
            is_day: *self.de_dia.lock().unwrap(),
            observed_at: Instant("2026-11-14T12:00:00.000Z".into()),
            cache: WeatherCurrentResponseCache::Miss,
        })
    }

    async fn titulares(
        &self,
        _token: &str,
        _peticion: &crate::tipos::NewsHeadlinesRequest,
    ) -> Result<crate::tipos::NewsHeadlinesResponse, FallaDeAuth> {
        let r = self.noticias.lock().unwrap().clone();
        r.map(|cantidad| crate::tipos::NewsHeadlinesResponse {
            headlines: (0..cantidad)
                .map(|i| crate::tipos::Headline {
                    title: format!("Titular {i}"),
                    source: format!("Medio {i}"),
                    url: format!("https://example.com/{i}"),
                    published_at: Instant(format!("2026-11-14T{:02}:00:00.000Z", 10 + i)),
                })
                .collect(),
            fetched_at: Instant("2026-11-14T12:00:00.000Z".into()),
            cache: crate::tipos::NewsHeadlinesResponseCache::Miss,
        })
    }
}

fn agregar(
    base: &BaseLocal,
    servicio: &ServicioDePersonalizacion,
    nube: &ClimaSimulado,
    nombre: &str,
) -> Result<crate::tipos::WidgetItem, AppError> {
    bloquear(async {
        let c = resolver_ciudad(nube, "jwt", nombre).await?;
        servicio.agregar_clima(base, USUARIO, &c, AHORA_MS).await
    })
}

fn rectangulo(base: &BaseLocal, widget_id: &str) -> (i64, i64, i64, i64) {
    bloquear(async {
        sqlx::query_as("SELECT x, y, width, height FROM theme_widget WHERE widget_id = ?")
            .bind(widget_id)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

fn de_clima(base: &BaseLocal, id: &str) -> (String, String, String, f64, f64) {
    bloquear(clima::widgets_de_clima(base, USUARIO))
        .unwrap()
        .into_iter()
        .find(|w| w.0 == id)
        .unwrap()
}

#[test]
fn ca_he_04_hu05_ca01() {
    // HE-04-HU05-CA01 · Agrega y activa el Clima de «Popayán» (la primera ciudad, solo su nombre: ET15), de
    // 320 × 160 en la primera posición libre (ET17), y lo muestra con la temperatura y la condición (ET02, ET13).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "  Popayán ").unwrap();
    assert_eq!(nube.consultas.lock().unwrap().as_slice(), ["Popayán"]);
    assert!(w.is_active);
    assert_eq!(
        (w.display_name.as_str(), w.distinguishing_value.as_deref()),
        ("Clima", Some("Popayán"))
    );
    assert!(
        lista(&base, &servicio)
            .iter()
            .any(|x| x.widget_id == w.widget_id)
    );
    // Los cuatro por defecto ocupan hasta x = 1400 en la primera fila.
    assert_eq!(rectangulo(&base, &w.widget_id.0), (1400, 0, 320, 160));
    let datos = bloquear(actualizar_clima(
        &base,
        &nube,
        "jwt",
        &de_clima(&base, &w.widget_id.0),
        AHORA_MS,
    ))
    .unwrap();
    assert_eq!(datos.status, WidgetDataStatus::Ok);
    let Some(WidgetDataPayload::WeatherData(d)) = datos.payload else {
        panic!("sin clima")
    };
    assert_eq!(
        (d.city.as_str(), d.temperature_c, d.condition_text.as_str()),
        ("Popayán", 21.4, "Parcialmente nublado")
    );
    // ET13: la tabla de condiciones.
    for (codigo, texto) in [
        ("0", "Despejado"),
        ("1", "Mayormente despejado"),
        ("3", "Nublado"),
        ("48", "Niebla"),
        ("57", "Llovizna"),
        ("63", "Lluvia"),
        ("77", "Nieve"),
        ("81", "Chubascos"),
        ("86", "Chubascos de nieve"),
        ("99", "Tormenta"),
        ("4", "Condición no disponible"),
    ] {
        assert_eq!(condicion(codigo), texto);
    }
}

#[test]
fn ca_he_04_hu05_ca02() {
    // HE-04-HU05-CA02 · Otro Clima para «Cali», independiente y con su propia posición (ET04; D-038).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let popayan = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let cali = agregar(&base, &servicio, &nube, "Cali").unwrap();
    assert_ne!(popayan.widget_id, cali.widget_id);
    assert_ne!(
        rectangulo(&base, &popayan.widget_id.0),
        rectangulo(&base, &cali.widget_id.0)
    );
    let mut climas: Vec<_> = lista(&base, &servicio)
        .into_iter()
        .filter_map(|w| w.distinguishing_value.filter(|_| w.display_name == "Clima"))
        .collect();
    climas.sort();
    assert_eq!(climas, ["Cali", "Popayán"]);
}

#[test]
fn ca_he_04_hu05_ca03() {
    // HE-04-HU05-CA03 · Ciudad vacía o con solo espacios: no se agrega (la vista deshabilita «Agregar», ET03).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let antes = lista(&base, &servicio).len();
    assert!(agregar(&base, &servicio, &nube, "   ").is_err());
    assert!(nube.consultas.lock().unwrap().is_empty());
    assert_eq!(lista(&base, &servicio).len(), antes);
}

#[test]
fn ca_he_04_hu05_ca04() {
    // HE-04-HU05-CA04 · Ciudad no reconocida: mensaje en el campo Ciudad y no se agrega.
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let e = agregar(&base, &servicio, &nube, "Xyzzy").unwrap_err();
    assert_eq!(e.code, ErrorCode::CityNotFound);
    assert_eq!(
        e.message,
        "No encontramos esa ciudad. Revisa el nombre e intenta de nuevo."
    );
    assert_eq!(e.field.as_deref(), Some("city"));
    assert_eq!(lista(&base, &servicio).len(), 4);
}

#[test]
fn ca_he_04_hu05_ca05() {
    // HE-04-HU05-CA05 · Ciudad que ya tiene un widget Clima.
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let e = agregar(&base, &servicio, &nube, "popayán").unwrap_err();
    assert_eq!(e.code, ErrorCode::CityDuplicate);
    assert_eq!(e.message, "Ya tienes un widget Clima para esa ciudad.");
    assert_eq!(lista(&base, &servicio).len(), 5);
}

#[test]
fn ca_he_04_hu05_ca06() {
    // HE-04-HU05-CA06 · A los 30 minutos de la última consulta toca actualizar (ET05, RNF-09).
    let consulta = "2026-11-14T12:00:00.000Z";
    let ok = WidgetDataStatus::Ok;
    assert!(!toca_actualizar(
        Some((consulta, &ok)),
        true,
        AHORA_MS + ACTUALIZACION_DEL_CLIMA_MS - 1
    ));
    assert!(toca_actualizar(
        Some((consulta, &ok)),
        true,
        AHORA_MS + ACTUALIZACION_DEL_CLIMA_MS
    ));
    assert!(toca_actualizar(None, true, AHORA_MS));
    // Y la nueva consulta actualiza la temperatura y la condición.
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let widget = de_clima(&base, &w.widget_id.0);
    bloquear(actualizar_clima(&base, &nube, "jwt", &widget, AHORA_MS)).unwrap();
    nube.responde(Ok((18.6, "61")));
    let d = bloquear(actualizar_clima(
        &base,
        &nube,
        "jwt",
        &widget,
        AHORA_MS + ACTUALIZACION_DEL_CLIMA_MS,
    ))
    .unwrap();
    let Some(WidgetDataPayload::WeatherData(d)) = d.payload else {
        panic!("sin clima")
    };
    assert_eq!(
        (d.temperature_c, d.condition_text.as_str()),
        (18.6, "Lluvia")
    );
}

#[test]
fn ca_he_04_hu05_ca07() {
    // HE-04-HU05-CA07 · El servicio deja de responder: estado `error` (la vista muestra el aviso) y se vuelve a
    // consultar en la siguiente actualización periódica (ET07).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let widget = de_clima(&base, &w.widget_id.0);
    nube.responde(Err(FallaDeAuth::SinRespuesta));
    let d = bloquear(actualizar_clima(&base, &nube, "jwt", &widget, AHORA_MS)).unwrap();
    assert_eq!(d.status, WidgetDataStatus::Error);
    let guardado = bloquear(clima::datos(&base, &w.widget_id.0)).unwrap();
    assert_eq!(guardado.status, WidgetDataStatus::Error);
    let error = WidgetDataStatus::Error;
    let fecha = guardado.fetched_at.unwrap().0;
    assert!(!toca_actualizar(
        Some((&fecha, &error)),
        true,
        AHORA_MS + 60_000
    ));
    assert!(toca_actualizar(
        Some((&fecha, &error)),
        true,
        AHORA_MS + ACTUALIZACION_DEL_CLIMA_MS
    ));
}

#[test]
fn ca_he_04_hu05_ca08() {
    // HE-04-HU05-CA08 · Sin conexión: estado `offline` con el último dato, y se consulta al volver la conexión
    // (ET08).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let widget = de_clima(&base, &w.widget_id.0);
    bloquear(actualizar_clima(&base, &nube, "jwt", &widget, AHORA_MS)).unwrap();
    nube.responde(Err(FallaDeAuth::SinConexion));
    let d = bloquear(actualizar_clima(&base, &nube, "jwt", &widget, AHORA_MS + 1)).unwrap();
    assert_eq!(d.status, WidgetDataStatus::Offline);
    assert!(d.payload.is_some(), "conserva el último dato");
    let offline = WidgetDataStatus::Offline;
    let fecha = d.fetched_at.unwrap().0;
    assert!(!toca_actualizar(
        Some((&fecha, &offline)),
        false,
        AHORA_MS + 2
    ));
    assert!(toca_actualizar(
        Some((&fecha, &offline)),
        true,
        AHORA_MS + 2
    ));
}

#[test]
fn ca_he_04_hu05_ca09() {
    // HE-04-HU05-CA09 · Más de 100 caracteres: mensaje en el campo Ciudad y no se agrega (ET10, ET11).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let e = agregar(&base, &servicio, &nube, &"a".repeat(101)).unwrap_err();
    assert_eq!(e.code, ErrorCode::CityTooLong);
    assert_eq!(e.message, "La ciudad no puede superar los 100 caracteres.");
    assert!(nube.consultas.lock().unwrap().is_empty());
    // 100 sí llegan al servicio de clima.
    let _ = agregar(&base, &servicio, &nube, &"a".repeat(100));
    assert_eq!(nube.consultas.lock().unwrap().len(), 1);
}

#[test]
fn ca_he_04_hu05_ca10() {
    // HE-04-HU05-CA10 (P29) · Sugerencias al escribir: con 2 caracteres o más el campo Ciudad muestra hasta 5 lugares
    // del servicio de clima (ET18); con menos no consulta; sin coincidencias la lista viene vacía.
    let nube = ClimaSimulado::nuevo();
    let lugares = bloquear(clima::buscar_ciudades(&nube, "jwt", "  Popayán ")).unwrap();
    assert_eq!(
        lugares
            .iter()
            .map(|l| l.geo_id.as_str())
            .collect::<Vec<_>>(),
        ["3673269", "1"]
    );
    assert!(
        bloquear(clima::buscar_ciudades(&nube, "jwt", "P"))
            .unwrap()
            .is_empty()
    );
    assert_eq!(nube.consultas.lock().unwrap().len(), 1);
    assert!(
        bloquear(clima::buscar_ciudades(&nube, "jwt", "Xyzzy"))
            .unwrap()
            .is_empty()
    );
    let e = bloquear(clima::buscar_ciudades(&nube, "jwt", &"a".repeat(101))).unwrap_err();
    assert_eq!(e.code, ErrorCode::CityTooLong);
    assert_eq!(e.field.as_deref(), Some("city"));
    // Sin conexión, el mensaje claro de la ciudad (no el genérico).
    struct SinRed;
    impl NubeDeClima for SinRed {
        async fn geocodificar(
            &self,
            _: &str,
            _: &WeatherGeocodeRequest,
        ) -> Result<WeatherGeocodeResponse, FallaDeAuth> {
            Err(FallaDeAuth::SinConexion)
        }
        async fn clima_actual(
            &self,
            _: &str,
            _: &WeatherCurrentRequest,
        ) -> Result<WeatherCurrentResponse, FallaDeAuth> {
            Err(FallaDeAuth::SinConexion)
        }
        async fn titulares(
            &self,
            _: &str,
            _: &crate::tipos::NewsHeadlinesRequest,
        ) -> Result<crate::tipos::NewsHeadlinesResponse, FallaDeAuth> {
            Err(FallaDeAuth::SinConexion)
        }
    }
    let e = bloquear(clima::buscar_ciudades(&SinRed, "jwt", "Cali")).unwrap_err();
    assert_eq!(e.code, ErrorCode::NetOffline);
}

#[test]
fn ca_he_04_hu05_ca11() {
    // HE-04-HU05-CA11 (P29) · Elegir un lugar de las sugerencias: el widget queda con ese lugar (no con la primera
    // coincidencia) y el Núcleo no vuelve a consultar (ET18).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let elegido = ciudad("1", "Popayán (otra)");
    let lugar = bloquear(clima::elegir_lugar(&nube, "jwt", "Popayán", Some(&elegido))).unwrap();
    assert_eq!(lugar, elegido);
    assert!(nube.consultas.lock().unwrap().is_empty());
    let w = bloquear(servicio.agregar_clima(&base, USUARIO, &lugar, AHORA_MS)).unwrap();
    let guardado = de_clima(&base, &w.widget_id.0);
    assert_eq!(
        (guardado.1.as_str(), guardado.2.as_str()),
        ("Popayán (otra)", "1")
    );
    // Sin lugar elegido, como antes: la primera coincidencia.
    let primero = bloquear(clima::elegir_lugar(&nube, "jwt", "Cali", None)).unwrap();
    assert_eq!(primero.geo_id, "3687925");
    // Un lugar con datos imposibles no se acepta.
    let mut malo = ciudad("2", "Sin coordenadas");
    malo.latitude = 120.0;
    let e = bloquear(clima::elegir_lugar(&nube, "jwt", "x", Some(&malo))).unwrap_err();
    assert_eq!(e.code, ErrorCode::CityNotFound);
}

#[test]
fn rd_97_guarda_si_es_de_dia() {
    // RD-97 · `is_day` de la consulta llega al dato del widget y a la caché local.
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let widget = de_clima(&base, &w.widget_id.0);
    for (ms, de_dia) in [(0, true), (1, false)] {
        *nube.de_dia.lock().unwrap() = Some(de_dia);
        let nuevo = bloquear(actualizar_clima(
            &base,
            &nube,
            "jwt",
            &widget,
            AHORA_MS + ms,
        ))
        .unwrap();
        let guardado = bloquear(clima::datos(&base, &w.widget_id.0)).unwrap();
        for datos in [nuevo, guardado] {
            let Some(WidgetDataPayload::WeatherData(d)) = datos.payload else {
                panic!("sin clima")
            };
            assert_eq!(d.is_day, Some(de_dia));
        }
    }
}

#[test]
fn rd_97_sin_is_day_funciona_como_antes() {
    // RD-97 · Función sin desplegar: la respuesta no trae `is_day` (o es nulo) y se lee sin error.
    for extra in ["", r#""is_day":null,"#] {
        let respuesta: WeatherCurrentResponse = serde_json::from_str(&format!(
            r#"{{"geo_id":"3673269","temperature_c":21.4,"condition_code":"2",
                "condition_text":"Parcialmente nublado",{extra}
                "observed_at":"2026-11-14T12:00:00.000Z","cache":"hit"}}"#
        ))
        .unwrap();
        assert_eq!(respuesta.is_day, None);
    }
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let widget = de_clima(&base, &w.widget_id.0);
    let datos = bloquear(actualizar_clima(&base, &nube, "jwt", &widget, AHORA_MS)).unwrap();
    assert_eq!(datos.status, WidgetDataStatus::Ok);
    let json = serde_json::to_value(datos.payload.unwrap()).unwrap();
    assert!(json.get("is_day").is_none(), "{json}");
    // Caché local escrita por la versión anterior: se lee y se conserva sin conexión.
    bloquear(async {
        sqlx::query("UPDATE external_widget_cache SET payload = ? WHERE widget_id = ?")
            .bind(
                r#"{"city":"Popayán","temperature_c":20.0,"condition_code":"0","condition_text":"Despejado"}"#,
            )
            .bind(&w.widget_id.0)
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    nube.responde(Err(FallaDeAuth::SinConexion));
    let sin_red = bloquear(actualizar_clima(&base, &nube, "jwt", &widget, AHORA_MS + 1)).unwrap();
    let Some(WidgetDataPayload::WeatherData(d)) = sin_red.payload else {
        panic!("sin clima")
    };
    assert_eq!(
        (d.condition_text.as_str(), d.temperature_c, d.is_day),
        ("Despejado", 20.0, None)
    );
}

// HE-04-HU06 · Agregar el widget Noticias.

fn agregar_noticias(
    base: &BaseLocal,
    servicio: &ServicioDePersonalizacion,
) -> Result<crate::tipos::WidgetItem, AppError> {
    bloquear(servicio.agregar_noticias(base, USUARIO, AHORA_MS))
}

fn titulares(d: &crate::tipos::WidgetData) -> Vec<(String, String)> {
    match &d.payload {
        Some(WidgetDataPayload::NewsData(n)) => n
            .headlines
            .iter()
            .map(|h| (h.title.clone(), h.source.clone()))
            .collect(),
        _ => Vec::new(),
    }
}

#[test]
fn ca_he_04_hu06_ca01() {
    // HE-04-HU06-CA01 · Agrega y activa Noticias de 480 × 360 en la primera posición libre (ET08) y guarda los 5
    // titulares más recientes con su fuente (ET02). Va una sola vez (HE-04-HU04-ET04).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar_noticias(&base, &servicio).unwrap();
    assert!(w.is_active);
    assert_eq!(w.display_name, "Noticias");
    assert_eq!(rectangulo(&base, &w.widget_id.0), (1400, 0, 480, 360));
    let d = bloquear(clima::actualizar_noticias(
        &base,
        &nube,
        "jwt",
        &w.widget_id.0,
        AHORA_MS,
    ))
    .unwrap();
    assert_eq!(
        titulares(&d),
        (1..6)
            .rev()
            .map(|i| (format!("Titular {i}"), format!("Medio {i}")))
            .collect::<Vec<_>>()
    );
    assert_eq!(
        agregar_noticias(&base, &servicio).unwrap_err().code,
        ErrorCode::WidgetAlreadyAdded
    );
}

#[test]
fn ca_he_04_hu06_ca02() {
    // HE-04-HU06-CA02 · A los 60 minutos de la última consulta toca actualizar (ET03, RNF-09).
    let ok = WidgetDataStatus::Ok;
    let consulta = "2026-11-14T12:00:00.000Z";
    let cada = clima::ACTUALIZACION_DE_NOTICIAS_MS;
    assert!(!clima::toca_actualizar_cada(
        Some((consulta, &ok)),
        true,
        AHORA_MS + cada - 1,
        cada
    ));
    assert!(clima::toca_actualizar_cada(
        Some((consulta, &ok)),
        true,
        AHORA_MS + cada,
        cada
    ));
}

#[test]
fn ca_he_04_hu06_ca03() {
    // HE-04-HU06-CA03 · El servicio de noticias no responde: `error` con los últimos titulares (ET05).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar_noticias(&base, &servicio).unwrap();
    bloquear(clima::actualizar_noticias(
        &base,
        &nube,
        "jwt",
        &w.widget_id.0,
        AHORA_MS,
    ))
    .unwrap();
    nube.noticias(Err(FallaDeAuth::SinRespuesta));
    let d = bloquear(clima::actualizar_noticias(
        &base,
        &nube,
        "jwt",
        &w.widget_id.0,
        AHORA_MS + 1,
    ))
    .unwrap();
    assert_eq!(d.status, WidgetDataStatus::Error);
    assert_eq!(titulares(&d).len(), 5);
}

#[test]
fn ca_he_04_hu06_ca04() {
    // HE-04-HU06-CA04 · Sin conexión: `offline`, y se consulta al volver la conexión (ET06).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar_noticias(&base, &servicio).unwrap();
    nube.noticias(Err(FallaDeAuth::SinConexion));
    let d = bloquear(clima::actualizar_noticias(
        &base,
        &nube,
        "jwt",
        &w.widget_id.0,
        AHORA_MS,
    ))
    .unwrap();
    assert_eq!(d.status, WidgetDataStatus::Offline);
    let offline = WidgetDataStatus::Offline;
    let fecha = d.fetched_at.unwrap().0;
    let cada = clima::ACTUALIZACION_DE_NOTICIAS_MS;
    assert!(clima::toca_actualizar_cada(
        Some((&fecha, &offline)),
        true,
        AHORA_MS + 1,
        cada
    ));
}

// HE-04-HU12 · Configurar un widget agregado (Clima y Texto).

fn configurar_ciudad(
    base: &BaseLocal,
    servicio: &ServicioDePersonalizacion,
    nube: &ClimaSimulado,
    widget_id: &str,
    nombre: &str,
) -> Result<crate::tipos::WidgetItem, AppError> {
    bloquear(async {
        let c = resolver_ciudad(nube, "jwt", nombre).await?;
        servicio
            .configurar_widget(
                base,
                USUARIO,
                widget_id,
                super::agregar::Configuracion::Ciudad(&c),
                AHORA_MS,
            )
            .await
    })
}

#[test]
fn ca_he_04_hu12_ca01() {
    // HE-04-HU12-CA01 · Cambiar la ciudad: la lista dice «Cali» y el clima guardado de «Popayán» se descarta para
    // consultar el de «Cali» (ET01, ET02).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    assert!(w.can_configure);
    bloquear(actualizar_clima(
        &base,
        &nube,
        "jwt",
        &de_clima(&base, &w.widget_id.0),
        AHORA_MS,
    ))
    .unwrap();
    let c = configurar_ciudad(&base, &servicio, &nube, &w.widget_id.0, "Cali").unwrap();
    assert_eq!(c.distinguishing_value.as_deref(), Some("Cali"));
    assert_eq!(de_clima(&base, &w.widget_id.0).2, "3687925");
    assert!(
        bloquear(clima::datos(&base, &w.widget_id.0))
            .unwrap()
            .payload
            .is_none()
    );
}

#[test]
fn ca_he_04_hu12_ca02() {
    // HE-04-HU12-CA02 · Cambiar el texto (ET04: de 1 a 200 caracteres).
    let (base, servicio) = con_widgets_por_defecto();
    let w = bloquear(servicio.agregar_texto(&base, USUARIO, "Estudiar", AHORA_MS)).unwrap();
    let c = bloquear(servicio.configurar_widget(
        &base,
        USUARIO,
        &w.widget_id.0,
        super::agregar::Configuracion::Texto(" Repasar simulación "),
        AHORA_MS,
    ))
    .unwrap();
    assert_eq!(
        c.distinguishing_value.as_deref(),
        Some("Repasar simulación")
    );
    let largo = bloquear(servicio.configurar_widget(
        &base,
        USUARIO,
        &w.widget_id.0,
        super::agregar::Configuracion::Texto(&"a".repeat(201)),
        AHORA_MS,
    ))
    .unwrap_err();
    assert_eq!(largo.code, ErrorCode::TextTooLong);
}

#[test]
fn ca_he_04_hu12_ca03() {
    // HE-04-HU12-CA03 · Ciudad vacía: no cambia el widget (la vista deshabilita «Guardar»).
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    assert!(configurar_ciudad(&base, &servicio, &nube, &w.widget_id.0, "  ").is_err());
    assert_eq!(de_clima(&base, &w.widget_id.0).1, "Popayán");
}

#[test]
fn ca_he_04_hu12_ca04() {
    // HE-04-HU12-CA04 · Ciudad no encontrada: mensaje en el campo Ciudad y no cambia.
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    let w = agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let e = configurar_ciudad(&base, &servicio, &nube, &w.widget_id.0, "Xyzzy").unwrap_err();
    assert_eq!(
        e.message,
        "No encontramos esa ciudad. Revisa el nombre e intenta de nuevo."
    );
    assert_eq!(de_clima(&base, &w.widget_id.0).1, "Popayán");
}

#[test]
fn ca_he_04_hu12_ca05() {
    // HE-04-HU12-CA05 · La ciudad de otro Clima: duplicada; la del propio widget no cuenta.
    let (base, servicio) = con_widgets_por_defecto();
    let nube = ClimaSimulado::nuevo();
    agregar(&base, &servicio, &nube, "Popayán").unwrap();
    let cali = agregar(&base, &servicio, &nube, "Cali").unwrap();
    let e = configurar_ciudad(&base, &servicio, &nube, &cali.widget_id.0, "Popayán").unwrap_err();
    assert_eq!(e.code, ErrorCode::CityDuplicate);
    assert_eq!(e.message, "Ya tienes un widget Clima para esa ciudad.");
    assert!(configurar_ciudad(&base, &servicio, &nube, &cali.widget_id.0, "Cali").is_ok());
}
