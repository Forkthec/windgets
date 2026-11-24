//! Pruebas del Núcleo de HE-04 en P07: lista de widgets (HU01), alternar activo o inactivo (HU02) y catálogo
//! de widgets (HU04).

use super::escritorio::Carpetas;
use super::pruebas_del_tema_en_edicion::{MI_TEMA, OTRO_TEMA, T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{WallpaperState, WidgetConfig, WidgetItem, WidgetRect, WidgetType};

pub(super) const RELOJ: &str = "00000000-0000-4000-8000-0000000000b1";
pub(super) const CALENDARIO: &str = "00000000-0000-4000-8000-0000000000b2";
pub(super) const TAREAS: &str = "00000000-0000-4000-8000-0000000000b3";
pub(super) const KANBAN: &str = "00000000-0000-4000-8000-0000000000b4";
pub(super) const CLIMA: &str = "00000000-0000-4000-8000-0000000000b5";
pub(super) const NOTICIAS: &str = "00000000-0000-4000-8000-0000000000b6";
pub(super) const TEXTO: &str = "00000000-0000-4000-8000-0000000000b7";

/// Posiciones por defecto de la semilla de la cuenta (0003_funciones.sql, H-D-18) sobre 1920 × 1080.
pub(super) const POR_DEFECTO: [(&str, &str, i64, i64, i64, i64); 4] = [
    (RELOJ, "clock", 40, 40, 320, 160),
    (CALENDARIO, "calendar", 40, 220, 320, 340),
    (TAREAS, "daily_tasks", 380, 40, 360, 520),
    (KANBAN, "kanban", 760, 40, 640, 520),
];

pub(super) async fn insertar_widget(
    base: &BaseLocal,
    id: &str,
    sql_de_campos: &str,
    creado: &str,
    tema: &str,
    rect: (i64, i64, i64, i64),
    activo: bool,
) {
    let pool = base.pool().await.unwrap();
    sqlx::query(&format!(
        "INSERT INTO widget (id, user_id, created_at, {sql_de_campos})"
    ))
    .bind(id)
    .bind(USUARIO)
    .bind(creado)
    .execute(pool)
    .await
    .unwrap();
    // El id de theme_widget es el del widget con «c» (Mi tema) o «d» (Verano) en lugar de «b».
    let tw = id.replacen("0b", if tema == MI_TEMA { "0c" } else { "0d" }, 1);
    sqlx::query(
        "INSERT INTO theme_widget (id, user_id, created_at, theme_id, widget_id, is_active, x, y, width, height, \
         ref_width, ref_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1920, 1080)",
    )
    .bind(tw)
    .bind(USUARIO)
    .bind(creado)
    .bind(tema)
    .bind(id)
    .bind(i64::from(activo))
    .bind(rect.0)
    .bind(rect.1)
    .bind(rect.2)
    .bind(rect.3)
    .execute(pool)
    .await
    .unwrap();
}

/// La cuenta de `con_temas` con la semilla: los cuatro widgets por defecto, activos y en su posición por
/// defecto en «Mi tema» (el aplicado).
pub(super) fn con_widgets_por_defecto() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_temas();
    bloquear(async {
        for (id, tipo, x, y, w, h) in POR_DEFECTO {
            insertar_widget(
                &base,
                id,
                &format!("type, is_default) VALUES (?, ?, ?, '{tipo}', 1"),
                T,
                MI_TEMA,
                (x, y, w, h),
                true,
            )
            .await;
        }
    });
    (base, servicio)
}

/// Además de los cuatro por defecto, Clima de Bogotá (activo), Noticias (inactivo) y un Texto, agregados en
/// ese orden; Texto solo en «Verano», que no es el tema aplicado.
pub(super) fn con_widgets_agregados() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_widgets_por_defecto();
    bloquear(async {
        insertar_widget(
            &base,
            CLIMA,
            "type, weather_city, weather_geo_id, weather_latitude, weather_longitude) \
             VALUES (?, ?, ?, 'weather', 'Bogotá', '3688689', 4.61, -74.08",
            "2026-11-05T00:00:00.000Z",
            MI_TEMA,
            (40, 600, 320, 160),
            true,
        )
        .await;
        insertar_widget(
            &base,
            NOTICIAS,
            "type) VALUES (?, ?, ?, 'news'",
            "2026-11-06T00:00:00.000Z",
            MI_TEMA,
            (380, 600, 360, 300),
            false,
        )
        .await;
        insertar_widget(
            &base,
            TEXTO,
            "type, text_content) VALUES (?, ?, ?, 'text', 'Hola'",
            "2026-11-04T00:00:00.000Z",
            OTRO_TEMA,
            (40, 800, 320, 100),
            true,
        )
        .await;
    });
    (base, servicio)
}

pub(super) fn lista(base: &BaseLocal, servicio: &ServicioDePersonalizacion) -> Vec<WidgetItem> {
    bloquear(servicio.widgets(base, USUARIO)).unwrap()
}

/// Lo que pinta la capa: el estado inicial con el wallpaper por defecto (no hace falta el archivo del fondo).
pub(super) fn capa(base: &BaseLocal, servicio: &ServicioDePersonalizacion) -> Vec<WidgetRect> {
    let carpetas = Carpetas {
        archivos: std::env::temp_dir(),
        recursos: std::env::temp_dir(),
    };
    bloquear(servicio.estado_de_la_capa(
        base,
        USUARIO,
        &carpetas,
        Vec::new(),
        WallpaperState::FallbackDefault,
    ))
    .unwrap()
    .widgets
}

#[test]
fn ca_he_04_hu01_ca01() {
    // HE-04-HU01-CA01 · Widgets por defecto al primer inicio: Reloj, Calendario, Tareas del día y Kanban,
    // activos, y la capa los pinta en su posición por defecto (ET01, ET04).
    let (base, servicio) = con_widgets_por_defecto();
    let widgets = lista(&base, &servicio);
    let nombres: Vec<&str> = widgets.iter().map(|w| w.display_name.as_str()).collect();
    assert_eq!(nombres, ["Reloj", "Calendario", "Tareas del día", "Kanban"]);
    assert!(widgets.iter().all(|w| w.is_default && w.is_active));
    let rectangulos = capa(&base, &servicio);
    let esperados: Vec<(String, i64, i64, i64, i64)> = POR_DEFECTO
        .iter()
        .map(|(id, _, x, y, w, h)| ((*id).to_string(), *x, *y, *w, *h))
        .collect();
    let pintados: Vec<(String, i64, i64, i64, i64)> = rectangulos
        .iter()
        .map(|r| (r.widget_id.0.clone(), r.x, r.y, r.width, r.height))
        .collect();
    assert_eq!(pintados, esperados);
    assert_eq!(rectangulos[0].r#type, WidgetType::Clock);
}

#[test]
fn ca_he_04_hu01_ca02() {
    // HE-04-HU01-CA02 · Consultar la lista de widgets: primero los por defecto y luego los agregados del tema
    // aplicado, con su nombre, su tipo, el dato que los distingue, el interruptor y las opciones (ET02, ET03).
    let (base, servicio) = con_widgets_agregados();
    let widgets = lista(&base, &servicio);
    let ids: Vec<&str> = widgets.iter().map(|w| w.widget_id.0.as_str()).collect();
    // Texto está en «Verano», no en el tema aplicado.
    assert_eq!(ids, [RELOJ, CALENDARIO, TAREAS, KANBAN, CLIMA, NOTICIAS]);

    let reloj = &widgets[0];
    assert_eq!(reloj.r#type, WidgetType::Clock);
    assert!(reloj.is_default && !reloj.can_delete && !reloj.can_configure);
    assert_eq!(reloj.distinguishing_value, None);

    let clima = &widgets[4];
    assert_eq!(clima.display_name, "Clima");
    assert_eq!(clima.distinguishing_value.as_deref(), Some("Bogotá"));
    assert!(!clima.is_default && clima.is_active && clima.can_configure && clima.can_delete);
    assert!(matches!(&clima.config, WidgetConfig::WeatherConfig(c) if c.city == "Bogotá"));

    let noticias = &widgets[5];
    assert_eq!(noticias.display_name, "Noticias");
    assert!(!noticias.is_active && !noticias.can_configure && noticias.can_delete);
}

#[test]
fn ca_he_04_hu01_ca03() {
    // HE-04-HU01-CA03 · Todos los widgets inactivos: la lista los muestra en «Inactivo» y la capa solo pinta el
    // wallpaper, sin widgets (ET05).
    let (base, servicio) = con_widgets_agregados();
    bloquear(async {
        sqlx::query("UPDATE theme_widget SET is_active = 0")
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    let widgets = lista(&base, &servicio);
    assert_eq!(widgets.len(), 6);
    assert!(widgets.iter().all(|w| !w.is_active));
    assert!(capa(&base, &servicio).is_empty());
}

const AHORA_MS: i64 = 1_793_600_000_000;

fn activar(
    base: &BaseLocal,
    servicio: &ServicioDePersonalizacion,
    widget_id: &str,
    activo: bool,
) -> Result<WidgetItem, AppError> {
    bloquear(servicio.activar_widget(base, USUARIO, widget_id, activo, AHORA_MS))
}

/// Lo que viaja a la nube de un widget del tema: `fields` del cambio pendiente.
fn pendiente(base: &BaseLocal, theme_widget_id: &str) -> Option<String> {
    bloquear(async {
        sqlx::query_scalar(
            "SELECT fields FROM pending_change WHERE entity_kind = 'theme_widget' AND entity_id = ?",
        )
        .bind(theme_widget_id)
        .fetch_optional(base.pool().await.unwrap())
        .await
        .unwrap()
    })
}

fn rectangulo(rectangulos: &[WidgetRect], id: &str) -> Option<(i64, i64, i64, i64)> {
    rectangulos
        .iter()
        .find(|r| r.widget_id.0 == id)
        .map(|r| (r.x, r.y, r.width, r.height))
}

#[test]
fn ca_he_04_hu02_ca01() {
    // HE-04-HU02-CA01 · Desactivar un widget activo: la capa deja de pintarlo sin afectar a los demás y la lista
    // lo conserva en «Inactivo» (ET01, ET02).
    let (base, servicio) = con_widgets_agregados();
    let antes = capa(&base, &servicio);
    let clima = activar(&base, &servicio, CLIMA, false).unwrap();
    assert!(!clima.is_active);
    let despues = capa(&base, &servicio);
    assert_eq!(rectangulo(&despues, CLIMA), None);
    let sin_clima: Vec<_> = antes
        .into_iter()
        .filter(|r| r.widget_id.0 != CLIMA)
        .collect();
    assert_eq!(despues, sin_clima);
    // No se elimina: sigue en la lista, en «Inactivo», y los demás no cambian.
    let widgets = lista(&base, &servicio);
    assert_eq!(widgets.len(), 6);
    assert!(
        widgets
            .iter()
            .any(|w| w.widget_id.0 == CLIMA && !w.is_active)
    );
    assert!(widgets[..4].iter().all(|w| w.is_active));
    // El cambio viaja a la nube (D-189).
    let fields = pendiente(&base, &CLIMA.replacen("0b", "0c", 1)).unwrap();
    let fields: serde_json::Value = serde_json::from_str(&fields).unwrap();
    assert_eq!(fields["is_active"]["value"], serde_json::Value::Bool(false));
}

#[test]
fn ca_he_04_hu02_ca02() {
    // HE-04-HU02-CA02 · Activar un widget inactivo: la capa lo pinta en su última posición y con su último
    // tamaño (ET03).
    let (base, servicio) = con_widgets_agregados();
    assert_eq!(rectangulo(&capa(&base, &servicio), NOTICIAS), None);
    let noticias = activar(&base, &servicio, NOTICIAS, true).unwrap();
    assert!(noticias.is_active);
    assert_eq!(
        rectangulo(&capa(&base, &servicio), NOTICIAS),
        Some((380, 600, 360, 300))
    );
}

#[test]
fn widget_set_active_de_un_widget_fuera_del_tema_aplicado_es_widget_not_found() {
    // Error previsible de IPC-WID-03: Texto solo está en «Verano» y un id desconocido no existe.
    let (base, servicio) = con_widgets_agregados();
    for id in [TEXTO, "00000000-0000-4000-8000-0000000000ff"] {
        let error = activar(&base, &servicio, id, false).unwrap_err();
        assert_eq!(error.code, ErrorCode::WidgetNotFound);
    }
}

fn catalogo(base: &BaseLocal, servicio: &ServicioDePersonalizacion) -> crate::tipos::WidgetCatalog {
    bloquear(servicio.catalogo_de_widgets(base, USUARIO)).unwrap()
}

#[test]
fn ca_he_04_hu04_ca01() {
    // HE-04-HU04-CA01 · Consultar el catálogo de widgets: «Widgets externos» (Clima y Noticias) y «Widgets
    // locales» (Animación, Carrusel de imágenes, Imagen estática, Reproductor de música y Texto), cada uno con
    // su nombre y una descripción, sin los widgets por defecto (ET02, ET03).
    let (base, servicio) = con_widgets_por_defecto();
    let c = catalogo(&base, &servicio);
    let nombres = |g: &[crate::tipos::WidgetCatalogEntry]| {
        g.iter().map(|e| e.name.clone()).collect::<Vec<_>>()
    };
    assert_eq!(nombres(&c.external), ["Clima", "Noticias"]);
    assert_eq!(
        nombres(&c.local),
        [
            "Animación",
            "Carrusel de imágenes",
            "Imagen estática",
            "Reproductor de música",
            "Texto",
            // rediseno_final_backend.md §5.5 (D-07).
            "Windi"
        ]
    );
    let todos: Vec<_> = c.external.iter().chain(&c.local).collect();
    assert!(
        todos
            .iter()
            .all(|e| e.enabled && e.disabled_reason.is_none() && !e.description.is_empty())
    );
    assert!(todos.iter().all(|e| !e.description.contains('\n')));
}

#[test]
fn ca_he_04_hu04_ca02() {
    // HE-04-HU04-CA02 · Widget que ya se agregó: Noticias y Reproductor de música agregados salen deshabilitados
    // con «Ya agregaste este widget.»; Clima (ya agregado para Bogotá), Animación, Carrusel de imágenes, Imagen
    // estática y Texto (ya agregado) siguen habilitados (ET04, D-038).
    let (base, servicio) = con_widgets_agregados();
    bloquear(async {
        sqlx::query(
            "INSERT INTO widget (id, user_id, created_at, type) VALUES \
             ('00000000-0000-4000-8000-0000000000b8', ?, ?, 'music_player')",
        )
        .bind(USUARIO)
        .bind(T)
        .execute(base.pool().await.unwrap())
        .await
        .unwrap();
    });
    let c = catalogo(&base, &servicio);
    for e in c.external.iter().chain(&c.local) {
        let deshabilitado = e.name == "Noticias" || e.name == "Reproductor de música";
        assert_eq!(e.enabled, !deshabilitado, "{}", e.name);
        assert_eq!(
            e.disabled_reason.as_deref(),
            deshabilitado.then_some("Ya agregaste este widget."),
            "{}",
            e.name
        );
    }
}

#[test]
fn el_widget_windi_se_agrega_una_sola_vez_y_esta_en_el_catalogo_local() {
    // rediseno_final_backend.md §5.5 (D-07, A-07): «Windi» está en el catálogo de widgets locales; se agrega activo en
    // una posición libre, con su nombre, y una sola vez por cuenta (`widget.already_added`, como Noticias). Después
    // queda deshabilitado en el catálogo.
    let (base, servicio) = con_widgets_por_defecto();
    let windi = |c: &crate::tipos::WidgetCatalog| {
        c.local
            .iter()
            .find(|e| e.r#type == crate::tipos::AddableWidgetType::Windi)
            .cloned()
    };
    let entrada = windi(&catalogo(&base, &servicio)).expect("Windi en el catálogo local");
    assert_eq!(entrada.name, "Windi");
    assert!(entrada.enabled);
    let w = bloquear(servicio.agregar_windi(&base, USUARIO, 1_794_657_600_000)).unwrap();
    assert_eq!(
        (w.display_name.as_str(), w.r#type, w.is_active),
        ("Windi", WidgetType::Windi, true)
    );
    assert!(w.can_delete);
    let otra = bloquear(servicio.agregar_windi(&base, USUARIO, 1_794_657_600_000)).unwrap_err();
    assert_eq!(otra.code, crate::tipos::ErrorCode::WidgetAlreadyAdded);
    assert!(!windi(&catalogo(&base, &servicio)).unwrap().enabled);
    // En la capa es interactivo: al seleccionarlo abre el panel de Windi (HE-06-HU08).
    assert!(crate::host_del_wallpaper::seleccion::es_interactivo(
        &WidgetType::Windi
    ));
}
