//! Pruebas del Núcleo de los errores visibles del planificador (docs/rediseno.md RD-84 y RD-85): lo que se puede
//! prever llega con su código y su texto, nunca como `internal.unexpected`.

use super::pruebas::*;
use super::*;

#[test]
fn rd_84_crear_tarjeta_sin_la_columna_por_hacer_dice_que_falta_el_tablero() {
    // RD-84: primera apertura sin conexión, antes de la primera descarga: la cuenta aún no tiene columnas.
    let servicio = con_semilla();
    let sin_tablero = "00000000-0000-4000-8000-000000000009";
    let e = bloquear(servicio.crear_tarjeta(sin_tablero, params("Entregar informe", "2026-11-14")))
        .unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field),
        (
            ErrorCode::ColumnNotFound,
            "Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.",
            None
        )
    );
    assert_eq!(contar(&servicio, "SELECT count(*) FROM card"), 0);
    assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
}

/// Un color que el catálogo desactivó con la ventana abierta.
fn desactivar_azul(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) {
    bloquear(async {
        sqlx::query("UPDATE catalog_color SET is_active = 0 WHERE id = 'blue'")
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
    });
}

fn color_no_disponible(e: AppError) {
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::ColorInvalid,
            "Este color ya no está disponible. Elige otro.",
            Some("color_id")
        )
    );
}

#[test]
fn rd_85_crear_columna_con_un_color_desactivado_lo_dice_en_el_campo_color() {
    let servicio = con_semilla();
    desactivar_azul(&servicio);
    let e = bloquear(servicio.crear_columna(
        USUARIO,
        ColumnCreateParams {
            name: "Revisión".into(),
            color_id: Some("blue".into()),
        },
    ))
    .unwrap_err();
    color_no_disponible(e);
    assert_eq!(bloquear(servicio.columnas(USUARIO)).unwrap().len(), 3);
    assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
}

#[test]
fn rd_85_editar_columna_con_un_color_desactivado_lo_dice_en_el_campo_color() {
    let servicio = con_semilla();
    desactivar_azul(&servicio);
    let e = bloquear(servicio.actualizar_columna(
        USUARIO,
        ColumnUpdateParams {
            id: Uuid(POR_HACER.into()),
            name: None,
            color_id: Some("blue".into()),
        },
    ))
    .unwrap_err();
    color_no_disponible(e);
    assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
}

#[test]
fn rd_85_crear_y_editar_una_etiqueta_con_un_color_desactivado_lo_dice_en_el_campo_color() {
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    desactivar_azul(&servicio);
    color_no_disponible(
        bloquear(servicio.crear_etiqueta(
            USUARIO,
            LabelCreateParams {
                name: "Gimnasio".into(),
                color_id: "blue".into(),
            },
        ))
        .unwrap_err(),
    );
    color_no_disponible(
        bloquear(servicio.actualizar_etiqueta(
            USUARIO,
            crate::tipos::LabelUpdateParams {
                id: Uuid(id),
                name: "Estudio".into(),
                color_id: "blue".into(),
            },
        ))
        .unwrap_err(),
    );
    assert_eq!(contar(&servicio, "SELECT count(*) FROM label"), 1);
    assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
}
