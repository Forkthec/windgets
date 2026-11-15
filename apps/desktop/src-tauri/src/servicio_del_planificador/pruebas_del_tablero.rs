//! Pruebas del Núcleo de HE-09-HU02 (mover una tarjeta entre columnas).

use super::pruebas::*;
use super::*;
use crate::tipos::{
    PlacementVariant1, PlacementVariant1Kind, PlacementVariant2, PlacementVariant2Kind,
};

fn al_final() -> Placement {
    Placement::Variant1(PlacementVariant1 {
        kind: PlacementVariant1Kind::End,
    })
}

fn antes_de(id: &str) -> Placement {
    Placement::Variant2(PlacementVariant2 {
        kind: PlacementVariant2Kind::Before,
        card_id: Uuid(id.into()),
    })
}

fn mover(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    id: &str,
    columna: &str,
    lugar: Placement,
) -> Result<Card, AppError> {
    bloquear(servicio.mover_tarjeta(
        USUARIO,
        CardMoveParams {
            card_id: Uuid(id.into()),
            column_id: Uuid(columna.into()),
            placement: lugar,
        },
    ))
}

/// Títulos de cada columna del tablero, en orden.
fn titulos(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<Vec<String>> {
    bloquear(servicio.tablero(USUARIO))
        .unwrap()
        .columns
        .into_iter()
        .map(|c| c.cards.into_iter().map(|t| t.title).collect())
        .collect()
}

fn cantidades(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<i64> {
    bloquear(servicio.tablero(USUARIO))
        .unwrap()
        .columns
        .iter()
        .map(|c| c.column.card_count)
        .collect()
}

#[test]
fn ca_he_09_hu02_ca01() {
    // HE-09-HU02-CA01 · A otra columna (drag-and-drop, ET01): cambia de columna, se actualizan las cantidades
    // (ET02) y el cambio queda guardado y en la cola (ET03).
    let servicio = con_semilla();
    let id = tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    let t = mover(&servicio, &id, EN_PROGRESO, al_final()).unwrap();
    assert_eq!(t.column_id, Uuid(EN_PROGRESO.into()));
    assert_eq!(cantidades(&servicio), [0, 1, 0]);
    let fields: String = bloquear(async {
        sqlx::query_scalar("SELECT fields FROM pending_change WHERE entity_id = ?")
            .bind(&id)
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    let fields: Value = serde_json::from_str(&fields).unwrap();
    assert_eq!(fields["column_id"]["value"], EN_PROGRESO);
}

#[test]
fn ca_he_09_hu02_ca02() {
    // HE-09-HU02-CA02 · A Hecho una tarjeta vencida: completada (ET04), con la fecha de completado de hoy (ET05),
    // sin «Vencida» (ET06) y recordando su columna anterior.
    let servicio = con_semilla();
    let id = tarjeta_en(
        &servicio,
        EN_PROGRESO,
        "Entregar informe",
        "2026-11-10",
        1024.0,
    );
    let t = mover(&servicio, &id, HECHO, al_final()).unwrap();
    assert!(t.is_completed);
    assert_eq!(t.completed_on, Some(DateIso("2026-11-14".into())));
    assert!(!t.is_overdue);
    assert_eq!(t.previous_column_id, Some(Uuid(EN_PROGRESO.into())));
}

#[test]
fn ca_he_09_hu02_ca03() {
    // HE-09-HU02-CA03 · Fuera de Hecho: deja de estar completada y se borra la fecha de completado (ET07).
    let servicio = con_semilla();
    let id = tarjeta_en(
        &servicio,
        EN_PROGRESO,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    mover(&servicio, &id, HECHO, al_final()).unwrap();
    let t = mover(&servicio, &id, POR_HACER, al_final()).unwrap();
    assert!(!t.is_completed);
    assert_eq!(t.completed_on, None);
}

#[test]
fn ca_he_09_hu02_ca04() {
    // HE-09-HU02-CA04 · Reordenar en la misma columna: «Llamar al cliente» queda primera y el orden se conserva
    // al volver a leer el tablero (ET08).
    let servicio = con_semilla();
    let entregar = tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    tarjeta_en(&servicio, POR_HACER, "Pagar factura", "2026-11-20", 2048.0);
    let llamar = tarjeta_en(
        &servicio,
        POR_HACER,
        "Llamar al cliente",
        "2026-11-20",
        3072.0,
    );
    mover(&servicio, &llamar, POR_HACER, antes_de(&entregar)).unwrap();
    assert_eq!(
        titulos(&servicio)[0],
        ["Llamar al cliente", "Entregar informe", "Pagar factura"]
    );
    // Entre dos tarjetas también.
    let pagar_id: String = bloquear(async {
        sqlx::query_scalar("SELECT id FROM card WHERE title = 'Pagar factura'")
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    mover(&servicio, &llamar, POR_HACER, antes_de(&pagar_id)).unwrap();
    assert_eq!(
        titulos(&servicio)[0],
        ["Entregar informe", "Llamar al cliente", "Pagar factura"]
    );
}

#[test]
fn ca_he_09_hu02_ca06() {
    // HE-09-HU02-CA06 · «Mover a» En progreso: al final de la columna (ET12).
    let servicio = con_semilla();
    tarjeta_en(&servicio, EN_PROGRESO, "Ya estaba", "2026-11-20", 1024.0);
    let id = tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    mover(&servicio, &id, EN_PROGRESO, al_final()).unwrap();
    assert_eq!(titulos(&servicio)[1], ["Ya estaba", "Entregar informe"]);
}

#[test]
fn ca_he_09_hu02_ca07() {
    // HE-09-HU02-CA07 · «Mover a» Hecho: al final, completada, con fecha de completado y sin «Vencida» (ET13).
    let servicio = con_semilla();
    tarjeta_en(&servicio, HECHO, "Hecha antes", "2026-11-20", 1024.0);
    let id = tarjeta_en(
        &servicio,
        EN_PROGRESO,
        "Entregar informe",
        "2026-11-10",
        1024.0,
    );
    let t = mover(&servicio, &id, HECHO, al_final()).unwrap();
    assert_eq!(titulos(&servicio)[2], ["Hecha antes", "Entregar informe"]);
    assert!(t.is_completed && !t.is_overdue);
    assert_eq!(t.completed_on, Some(DateIso("2026-11-14".into())));
}

#[test]
fn ca_he_09_hu02_ca08() {
    // HE-09-HU02-CA08 · «Mover a» Por hacer desde Hecho: al final, sin completar y sin fecha de completado.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Primera", "2026-11-20", 1024.0);
    let id = tarjeta_en(
        &servicio,
        EN_PROGRESO,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    mover(&servicio, &id, HECHO, al_final()).unwrap();
    let t = mover(&servicio, &id, POR_HACER, al_final()).unwrap();
    assert_eq!(titulos(&servicio)[0], ["Primera", "Entregar informe"]);
    assert!(!t.is_completed);
    assert_eq!(t.completed_on, None);
}

#[test]
fn mover_a_una_columna_o_tarjeta_que_no_existe() {
    // IPC-CARD-06: `column.not_found` sin texto y `card.not_found` (DP-04); no cambia nada.
    let servicio = con_semilla();
    let id = tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    let e = mover(
        &servicio,
        &id,
        "00000000-0000-4000-8000-00000000ffff",
        al_final(),
    )
    .unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (ErrorCode::ColumnNotFound, "")
    );
    let e = mover(
        &servicio,
        "00000000-0000-4000-8000-00000000ffff",
        POR_HACER,
        al_final(),
    )
    .unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (ErrorCode::CardNotFound, "Esta tarjeta ya no existe.")
    );
    assert_eq!(cantidades(&servicio), [1, 0, 0]);
}

fn nueva_columna(nombre: &str, color: Option<&str>) -> ColumnCreateParams {
    ColumnCreateParams {
        name: nombre.into(),
        color_id: color.map(str::to_string),
    }
}

fn nombres_de_columnas(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<String> {
    bloquear(servicio.columnas(USUARIO))
        .unwrap()
        .into_iter()
        .map(|c| c.name)
        .collect()
}

#[test]
fn ca_he_09_hu03_ca01() {
    // HE-09-HU03-CA01 · Con el color elegido, al final del tablero (ET05, ET09), y encola el cambio.
    let servicio = con_semilla();
    let creada =
        bloquear(servicio.crear_columna(USUARIO, nueva_columna("Revisión", Some("blue")))).unwrap();
    assert_eq!(creada.mensaje.message, "Columna creada.");
    assert_eq!(
        (creada.valor.name.as_str(), creada.valor.color_id.as_str()),
        ("Revisión", "blue")
    );
    assert_eq!(nombres_de_columnas(&servicio).last().unwrap(), "Revisión");
    assert_eq!(
        contar(
            &servicio,
            "SELECT count(*) FROM pending_change WHERE entity_kind = 'kanban_column'"
        ),
        1
    );
}

#[test]
fn ca_he_09_hu03_ca02() {
    // HE-09-HU03-CA02 · Sin color, gris por defecto (ET06; IPC-COL-02 `color_id` def. 'gray').
    let servicio = con_semilla();
    let creada =
        bloquear(servicio.crear_columna(USUARIO, nueva_columna("Revisión", None))).unwrap();
    assert_eq!(creada.valor.color_id, "gray");
    assert_eq!(creada.mensaje.message, "Columna creada.");
}

#[test]
fn ca_he_09_hu03_ca03() {
    // HE-09-HU03-CA03 · Nombre vacío o solo espacios.
    let servicio = con_semilla();
    for nombre in ["", "  "] {
        let e = bloquear(servicio.crear_columna(USUARIO, nueva_columna(nombre, None))).unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str(), e.field.as_deref()),
            (
                ErrorCode::NameRequired,
                "Este campo es obligatorio.",
                Some("name")
            )
        );
    }
    assert_eq!(nombres_de_columnas(&servicio).len(), 3);
}

#[test]
fn ca_he_09_hu03_ca04() {
    // HE-09-HU03-CA04 · 31 caracteres se rechaza; 30 se acepta (ET03).
    let servicio = con_semilla();
    let e = bloquear(servicio.crear_columna(USUARIO, nueva_columna(&"a".repeat(31), None)))
        .unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::NameTooLong,
            "El nombre de la columna no puede superar los 30 caracteres."
        )
    );
    bloquear(servicio.crear_columna(USUARIO, nueva_columna(&"a".repeat(30), None))).unwrap();
}

#[test]
fn ca_he_09_hu03_ca05() {
    // HE-09-HU03-CA05 · «revisión» con «Revisión» ya creada (ET04).
    let servicio = con_semilla();
    bloquear(servicio.crear_columna(USUARIO, nueva_columna("Revisión", None))).unwrap();
    let e = bloquear(servicio.crear_columna(USUARIO, nueva_columna("revisión", None))).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::NameDuplicate,
            "Ya existe una columna con ese nombre.",
            Some("name")
        )
    );
}

#[test]
fn ca_he_09_hu03_ca06() {
    // HE-09-HU03-CA06 · 10 columnas, contadas las tres por defecto (ET07, D-167).
    let servicio = con_semilla();
    for i in 0..7 {
        bloquear(servicio.crear_columna(USUARIO, nueva_columna(&format!("C{i}"), None))).unwrap();
    }
    let e = bloquear(servicio.crear_columna(USUARIO, nueva_columna("Otra", None))).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::ColumnLimitReached,
            "Alcanzaste el máximo de 10 columnas. Elimina una para crear otra."
        )
    );
    assert_eq!(nombres_de_columnas(&servicio).len(), 10);
}
