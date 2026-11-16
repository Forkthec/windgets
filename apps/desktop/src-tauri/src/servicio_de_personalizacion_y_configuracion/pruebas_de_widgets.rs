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

async fn insertar_widget(
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
