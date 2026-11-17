//! Pruebas del Núcleo de HE-04-HU13 (eliminar un widget externo o local).

use super::pruebas_de_widgets::{
    CLIMA, NOTICIAS, RELOJ, TEXTO, capa, con_widgets_agregados, insertar_widget, lista,
};
use super::pruebas_del_tema_en_edicion::MI_TEMA;
use super::*;
use crate::servicio_de_sesion::ConMensaje;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::AddableWidgetType;

const AHORA_MS: i64 = 1_793_600_000_000;
const CLIMA_CALI: &str = "00000000-0000-4000-8000-0000000000b8";

fn eliminar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    id: &str,
) -> Result<ConMensaje<()>, AppError> {
    bloquear(servicio.eliminar_widget(base, USUARIO, id, AHORA_MS))
}

fn contar(base: &BaseLocal, sql: &str, id: &str) -> i64 {
    bloquear(async {
        sqlx::query_scalar(sql)
            .bind(id)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn ca_he_04_hu13_ca01() {
    // HE-04-HU13-CA01 · Un widget local agregado sale del escritorio, de la lista y de todos los temas (ET02).
    let (base, servicio) = con_widgets_agregados();
    let r = eliminar(&servicio, &base, TEXTO).unwrap();
    assert_eq!(r.mensaje.message, "Widget eliminado.");
    assert!(
        lista(&base, &servicio)
            .iter()
            .all(|w| w.widget_id.0 != TEXTO)
    );
    assert!(
        capa(&base, &servicio)
            .iter()
            .all(|w| w.widget_id.0 != TEXTO)
    );
    assert_eq!(
        contar(
            &base,
            "SELECT COUNT(*) FROM theme_widget WHERE widget_id = ?",
            TEXTO
        ),
        0
    );
    assert_eq!(
        contar(&base, "SELECT COUNT(*) FROM widget WHERE id = ?", TEXTO),
        0
    );
    // Se encola para sincronizar: el widget y su lugar en el tema.
    assert_eq!(
        contar(
            &base,
            "SELECT COUNT(*) FROM pending_change WHERE op = 'delete' AND entity_id = ?",
            TEXTO
        ),
        1
    );
    let lugares: i64 = bloquear(async {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM pending_change WHERE op = 'delete' AND entity_kind = 'theme_widget'",
        )
        .fetch_one(base.pool().await.unwrap())
        .await
        .unwrap()
    });
    assert_eq!(lugares, 1);
}

#[test]
fn ca_he_04_hu13_ca02() {
    // HE-04-HU13-CA02 · Un widget por defecto no se elimina: su texto y el widget se conserva (ET04).
    let (base, servicio) = con_widgets_agregados();
    let e = eliminar(&servicio, &base, RELOJ).err().unwrap();
    assert_eq!(e.code, ErrorCode::WidgetDefaultNotDeletable);
    assert_eq!(
        e.message,
        "Los widgets por defecto no se pueden eliminar. Puedes desactivarlos."
    );
    assert!(
        lista(&base, &servicio)
            .iter()
            .any(|w| w.widget_id.0 == RELOJ)
    );
}

#[test]
fn ca_he_04_hu13_ca04() {
    // HE-04-HU13-CA04 · Eliminar el Clima de «Cali» conserva el de otra ciudad (ET03, ET05).
    let (base, servicio) = con_widgets_agregados();
    bloquear(insertar_widget(
        &base,
        CLIMA_CALI,
        "type, weather_city, weather_geo_id, weather_latitude, weather_longitude) \
         VALUES (?, ?, ?, 'weather', 'Cali', '3687925', 3.43, -76.52",
        "2026-11-07T00:00:00.000Z",
        MI_TEMA,
        (760, 600, 320, 160),
        true,
    ));
    eliminar(&servicio, &base, CLIMA_CALI).unwrap();
    let climas: Vec<_> = lista(&base, &servicio)
        .into_iter()
        .filter(|w| w.r#type == crate::tipos::WidgetType::Weather)
        .map(|w| w.widget_id.0)
        .collect();
    assert_eq!(climas, [CLIMA]);
    // Sin la fila del widget, ningún servicio de clima lo vuelve a consultar.
    assert_eq!(
        contar(
            &base,
            "SELECT COUNT(*) FROM widget WHERE id = ?",
            CLIMA_CALI
        ),
        0
    );
}

#[test]
fn ca_he_04_hu13_ca05() {
    // HE-04-HU13-CA05 · Eliminar Noticias la vuelve a habilitar en el catálogo de widgets (ET06).
    let (base, servicio) = con_widgets_agregados();
    let noticias = |servicio: &ServicioDePersonalizacion| {
        bloquear(servicio.catalogo_de_widgets(&base, USUARIO))
            .unwrap()
            .external
            .into_iter()
            .find(|e| e.r#type == AddableWidgetType::News)
            .unwrap()
            .enabled
    };
    assert!(!noticias(&servicio));
    eliminar(&servicio, &base, NOTICIAS).unwrap();
    assert!(noticias(&servicio));
}
