//! Pruebas del Núcleo de los errores visibles del planificador (docs/rediseno.md RD-84): lo que se puede
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
