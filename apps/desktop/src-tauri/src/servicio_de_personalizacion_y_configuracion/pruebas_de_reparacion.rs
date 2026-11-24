//! Pruebas de la reparación de los widgets por defecto (`rediseno_final_backend.md` §3.2, D-27).

use super::pruebas_de_widgets::{con_widgets_por_defecto, lista};
use super::pruebas_del_tema_en_edicion::{MI_TEMA, OTRO_TEMA, T, con_temas};
use super::reparacion::reparar_widgets_por_defecto;
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::WidgetType;

fn contar(base: &BaseLocal, sql: &str) -> i64 {
    bloquear(async {
        sqlx::query_scalar(sql)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn una_cuenta_sin_widgets_por_defecto_los_tiene_despues_de_iniciar_sesion() {
    // D-27: la cuenta llega sin widgets. Tras la reparación tiene Reloj, Calendario, Tareas del día y Kanban,
    // activos en cada tema, y los cambios quedan en la cola para subir a la nube.
    let (base, servicio) = con_temas();
    assert!(lista(&base, &servicio).is_empty());
    let creadas = bloquear(reparar_widgets_por_defecto(&base, USUARIO, T)).unwrap();
    assert_eq!(creadas.len(), 4 + 4 * 2);
    let tipos: Vec<WidgetType> = lista(&base, &servicio)
        .into_iter()
        .map(|w| w.r#type)
        .collect();
    assert_eq!(
        tipos,
        [
            WidgetType::Clock,
            WidgetType::Calendar,
            WidgetType::DailyTasks,
            WidgetType::Kanban
        ]
    );
    assert!(
        lista(&base, &servicio)
            .iter()
            .all(|w| w.is_active && !w.can_delete)
    );
    for tema in [MI_TEMA, OTRO_TEMA] {
        assert_eq!(
            contar(
                &base,
                &format!(
                    "SELECT count(*) FROM theme_widget WHERE theme_id = '{tema}' AND is_active = 1"
                )
            ),
            4
        );
    }
    assert_eq!(contar(&base, "SELECT count(*) FROM pending_change"), 12);
}

#[test]
fn la_reparacion_es_idempotente() {
    // D-27: una segunda vez no crea nada (respeta `uq_widget_singleton`).
    let (base, _servicio) = con_temas();
    bloquear(reparar_widgets_por_defecto(&base, USUARIO, T)).unwrap();
    assert_eq!(
        bloquear(reparar_widgets_por_defecto(&base, USUARIO, T))
            .unwrap()
            .len(),
        0
    );
    assert_eq!(contar(&base, "SELECT count(*) FROM widget"), 4);
}

#[test]
fn completa_solo_las_filas_de_tema_que_faltan() {
    // D-27: los widgets existen en «Mi tema» pero no en «Verano»: se crean solo sus filas en «Verano», sin tocar
    // las que ya están.
    let (base, _servicio) = con_widgets_por_defecto();
    let antes = contar(&base, "SELECT count(*) FROM theme_widget");
    let creadas = bloquear(reparar_widgets_por_defecto(&base, USUARIO, T)).unwrap();
    let en_verano = contar(
        &base,
        &format!("SELECT count(*) FROM theme_widget WHERE theme_id = '{OTRO_TEMA}'"),
    );
    assert_eq!(
        creadas.len() as i64,
        contar(&base, "SELECT count(*) FROM theme_widget") - antes
    );
    assert_eq!(en_verano, 4);
    assert_eq!(
        contar(&base, "SELECT count(*) FROM widget WHERE is_default = 1"),
        4
    );
}

#[test]
fn sin_temas_no_repara_nada() {
    // Antes de la primera descarga no hay temas: no se crea nada (el tema inicial llega de la nube).
    let base = BaseLocal::en_memoria();
    assert_eq!(
        bloquear(reparar_widgets_por_defecto(&base, USUARIO, T))
            .unwrap()
            .len(),
        0
    );
}
