//! Pruebas del Núcleo de HE-15-HU04 (sincronizar la personalización entre computadores). El reajuste por resolución
//! está en ajuste.rs; la consulta al reanudar, en puente_ipc.rs. La llegada a menos de 1 minuto (ET01) y el envío
//! solo al guardar (ET04, ya en HE-05 y HE-02-HU11/HU12) se prueban a mano con dos computadores.

use super::pruebas_de_colores::primario;
use super::pruebas_de_widgets::{POR_DEFECTO, con_widgets_por_defecto};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::Monitor;

fn monitor(ancho: i64, alto: i64) -> Monitor {
    Monitor {
        id: "0".into(),
        x: 0,
        y: 0,
        width: ancho,
        height: alto,
        scale_factor: 1.0,
    }
}

#[test]
fn ca_he_15_hu04_ca05_en_la_capa() {
    // HE-15-HU04-CA05 · La capa recibe los widgets ajustados a la pantalla que recibe la distribución: los cuatro
    // por defecto, guardados sobre 1920 × 1080, en una pantalla de 1280 × 720 quedan escalados y dentro (ET09).
    let (base, _) = con_widgets_por_defecto();
    let rects = bloquear(ServicioDePersonalizacion::rectangulos_ajustados(
        &base,
        USUARIO,
        &[monitor(1280, 720)],
    ))
    .unwrap();
    assert_eq!(rects.len(), POR_DEFECTO.len());
    for r in &rects {
        assert!(r.x >= 0 && r.y >= 0 && r.x + r.width <= 1280 && r.y + r.height <= 720);
    }
    // En la misma resolución, tal como se guardaron.
    let iguales = bloquear(ServicioDePersonalizacion::rectangulos_ajustados(
        &base,
        USUARIO,
        &[monitor(1920, 1080)],
    ))
    .unwrap();
    assert_eq!(
        iguales
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height))
            .collect::<Vec<_>>(),
        POR_DEFECTO
            .iter()
            .map(|(_, _, x, y, w, h)| (*x, *y, *w, *h))
            .collect::<Vec<_>>()
    );
}

#[test]
fn ca_he_15_hu04_ca08() {
    // HE-15-HU04-CA08 · Llega del otro computador un tema aplicado más reciente: el escritorio lo toma de la base y
    // la vista previa conserva sus cambios sin guardar (ET12), que es lo que avisa EV-11 (`has_unsaved_draft`).
    let (base, servicio) = con_widgets_por_defecto();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    assert!(servicio.hay_cambios_sin_guardar());
    bloquear(async {
        sqlx::query("UPDATE applied_theme SET color_primary = '#ABCDEF' WHERE user_id = ?")
            .bind(USUARIO)
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    let aplicado = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(aplicado.content.colors.primary.0, "#ABCDEF");
    assert!(servicio.hay_cambios_sin_guardar());
}
