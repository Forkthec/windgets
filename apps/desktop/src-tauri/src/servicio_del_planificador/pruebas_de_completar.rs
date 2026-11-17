//! Pruebas del Núcleo de HE-12-HU02 y HE-06-HU03 (alternar la casilla de completada desde el planificador diario
//! y desde el widget Tareas del día), HE-12-HU03 (resumen de avance del día) y HE-06-HU04 (mover con «Mover a»
//! desde el widget). Hoy es el 14/11/2026.

use super::pruebas::*;
use super::*;

const REVISION: &str = "00000000-0000-4000-8000-0000000000c4";

fn alternar(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    id: &str,
    completada: bool,
) -> Result<(Card, Option<ResultMessage>), AppError> {
    bloquear(servicio.marcar_completada(
        USUARIO,
        CardSetCompletedParams {
            card_id: Uuid(id.into()),
            completed: completada,
        },
    ))
}

fn columna_de(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, id: &str) -> String {
    bloquear(servicio.tarjeta(USUARIO, id))
        .unwrap()
        .unwrap()
        .column_id
        .0
}

fn pendientes(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, id: &str) -> i64 {
    contar(
        servicio,
        &format!(
            "SELECT count(*) FROM pending_change WHERE entity_kind = 'card' AND entity_id = '{id}'"
        ),
    )
}

/// La columna Revisión del usuario de prueba (personalizada).
fn con_revision(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) {
    bloquear(async {
        sqlx::query(
            "INSERT INTO kanban_column (id, user_id, created_at, name, color_id, role, position) \
             VALUES (?, ?, '2026-11-01T00:00:00.000Z', 'Revisión', 'blue', 'custom', 2500)",
        )
        .bind(REVISION)
        .bind(USUARIO)
        .execute(servicio.base().pool().await.unwrap())
        .await
        .unwrap();
    });
}

/// Quita la columna Revisión de la base, como si se hubiera eliminado; la tarjeta conserva su
/// `previous_column_id`.
fn sin_revision(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) {
    bloquear(async {
        let pool = servicio.base().pool().await.unwrap();
        let mut conexion = pool.acquire().await.unwrap();
        sqlx::raw_sql(
            "PRAGMA foreign_keys = OFF; \
             DELETE FROM kanban_column WHERE id = '00000000-0000-4000-8000-0000000000c4'; \
             PRAGMA foreign_keys = ON;",
        )
        .execute(&mut *conexion)
        .await
        .unwrap();
    });
}

/// «Pagar la luz», de hoy, en la columna indicada.
fn pagar_la_luz(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, columna: &str) -> String {
    tarjeta_en(servicio, columna, "Pagar la luz", "2026-11-14", 1024.0)
}

#[test]
fn ca_he_12_hu02_ca01() {
    // HE-12-HU02-CA01 · «Pagar la luz» en En progreso: al marcar la casilla va a Hecho (ET02), queda completada
    // (tachada en la vista, ET05) y responde «¡Bien hecho! Tarjeta completada.» (ET07).
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, EN_PROGRESO);
    let (tarjeta, mensaje) = alternar(&servicio, &id, true).unwrap();
    assert_eq!(tarjeta.column_id, Uuid(HECHO.into()));
    assert!(tarjeta.is_completed);
    assert_eq!(tarjeta.completed_on, Some(DateIso("2026-11-14".into())));
    assert_eq!(tarjeta.previous_column_id, Some(Uuid(EN_PROGRESO.into())));
    let mensaje = mensaje.unwrap();
    assert_eq!(
        (mensaje.code.as_str(), mensaje.message.as_str()),
        ("card_set_completed", "¡Bien hecho! Tarjeta completada.")
    );
    // El planificador diario la muestra completada.
    let dia = bloquear(servicio.planificador_de_hoy(USUARIO)).unwrap();
    assert!(dia.items[0].card.is_completed);
}

#[test]
fn ca_he_12_hu02_ca02() {
    // HE-12-HU02-CA02 · Venía de En progreso: al desmarcar vuelve a En progreso, sin completar y sin mensaje (ET03).
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, EN_PROGRESO);
    alternar(&servicio, &id, true).unwrap();
    let (tarjeta, mensaje) = alternar(&servicio, &id, false).unwrap();
    assert_eq!(tarjeta.column_id, Uuid(EN_PROGRESO.into()));
    assert!(!tarjeta.is_completed);
    assert_eq!(tarjeta.completed_on, None);
    assert_eq!(mensaje, None);
}

#[test]
fn ca_he_12_hu02_ca03() {
    // HE-12-HU02-CA03 · Venía de Revisión, que ya no existe: al desmarcar va a Por hacer (ET04).
    let servicio = con_semilla();
    con_revision(&servicio);
    let id = pagar_la_luz(&servicio, REVISION);
    alternar(&servicio, &id, true).unwrap();
    sin_revision(&servicio);
    let (tarjeta, _) = alternar(&servicio, &id, false).unwrap();
    assert_eq!(tarjeta.column_id, Uuid(POR_HACER.into()));
    assert!(!tarjeta.is_completed);
}

#[test]
fn la_casilla_ya_marcada_no_cambia_nada() {
    // Dos selecciones seguidas de «marcar» (por ejemplo, desde el planificador y el widget): la segunda no mueve
    // la tarjeta ni repite el mensaje.
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, EN_PROGRESO);
    let (primera, _) = alternar(&servicio, &id, true).unwrap();
    let (segunda, mensaje) = alternar(&servicio, &id, true).unwrap();
    assert_eq!(primera, segunda);
    assert_eq!(mensaje, None);
}

#[test]
fn una_tarjeta_que_ya_no_existe_responde_su_error() {
    // IPC-CARD-07: `card.not_found` → «Esta tarjeta ya no existe.» (DP-04), nunca `internal.unexpected`.
    let servicio = con_semilla();
    let e = alternar(&servicio, "00000000-0000-4000-8000-00000000ffff", true).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (ErrorCode::CardNotFound, "Esta tarjeta ya no existe.")
    );
}

#[test]
fn ca_he_06_hu03_ca01() {
    // HE-06-HU03-CA01 · Desde el widget: la casilla mueve la tarjeta a Hecho y queda completada (ET01); el
    // Puente IPC emite `cards_changed` para el tablero, el planificador y el widget Kanban (ET03).
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, POR_HACER);
    let (tarjeta, _) = alternar(&servicio, &id, true).unwrap();
    assert_eq!(tarjeta.column_id, Uuid(HECHO.into()));
    assert!(tarjeta.is_completed);
    assert_eq!(columna_de(&servicio, &id), HECHO);
}

#[test]
fn ca_he_06_hu03_ca02() {
    // HE-06-HU03-CA02 · Al desmarcar vuelve a la columna en la que estaba antes de Hecho (ET01).
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, EN_PROGRESO);
    alternar(&servicio, &id, true).unwrap();
    let (tarjeta, _) = alternar(&servicio, &id, false).unwrap();
    assert_eq!(tarjeta.column_id, Uuid(EN_PROGRESO.into()));
    assert!(!tarjeta.is_completed);
}

#[test]
fn ca_he_06_hu03_ca03() {
    // HE-06-HU03-CA03 · Su columna anterior a Hecho ya no existe: vuelve a Por hacer (ET02).
    let servicio = con_semilla();
    con_revision(&servicio);
    let id = pagar_la_luz(&servicio, REVISION);
    alternar(&servicio, &id, true).unwrap();
    sin_revision(&servicio);
    let (tarjeta, _) = alternar(&servicio, &id, false).unwrap();
    assert_eq!(tarjeta.column_id, Uuid(POR_HACER.into()));
}

#[test]
fn ca_he_06_hu03_ca04() {
    // HE-06-HU03-CA04 · Sin conexión: el cambio queda en la base local y en `pending_change` para enviarlo al
    // volver la conexión (ET05). El planificador no usa la red.
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, POR_HACER);
    assert_eq!(pendientes(&servicio, &id), 0);
    alternar(&servicio, &id, true).unwrap();
    assert_eq!(columna_de(&servicio, &id), HECHO);
    assert_eq!(pendientes(&servicio, &id), 1);
    let campos: String = bloquear(async {
        sqlx::query_scalar("SELECT fields FROM pending_change WHERE entity_id = ?")
            .bind(&id)
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    assert!(campos.contains(HECHO) && campos.contains("completed_on"));
}

fn mover_al_final(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    id: &str,
    columna: &str,
) -> Card {
    bloquear(servicio.mover_tarjeta(
        USUARIO,
        CardMoveParams {
            card_id: Uuid(id.into()),
            column_id: Uuid(columna.into()),
            placement: Placement::Variant1(PlacementVariant1 {
                kind: PlacementVariant1Kind::End,
            }),
        },
    ))
    .unwrap()
}

#[test]
fn ca_he_06_hu04_ca01() {
    // HE-06-HU04-CA01 · «Mover a» En progreso desde el widget: la tarjeta queda al final de esa columna (IPC-CARD-06
    // con `end`); el Puente IPC emite `cards_changed` para el tablero y el widget Kanban (ET03).
    let servicio = con_semilla();
    tarjeta_en(&servicio, EN_PROGRESO, "Ya estaba", "2026-11-20", 1024.0);
    let id = pagar_la_luz(&servicio, POR_HACER);
    let tarjeta = mover_al_final(&servicio, &id, EN_PROGRESO);
    assert_eq!(tarjeta.column_id, Uuid(EN_PROGRESO.into()));
    assert!(tarjeta.position > 1024);
    assert!(!tarjeta.is_completed);
}

#[test]
fn ca_he_06_hu04_ca02() {
    // HE-06-HU04-CA02 · «Mover a» lista todas las columnas del tablero en su orden (IPC-COL-01); la vista marca y
    // deshabilita la actual.
    let servicio = con_semilla();
    con_revision(&servicio);
    let nombres: Vec<String> = bloquear(servicio.columnas(USUARIO))
        .unwrap()
        .into_iter()
        .map(|c| c.name)
        .collect();
    assert_eq!(nombres, ["Por hacer", "En progreso", "Revisión", "Hecho"]);
}

#[test]
fn ca_he_06_hu04_ca03() {
    // HE-06-HU04-CA03 · «Mover a» Hecho: la tarjeta queda completada (ET04).
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, POR_HACER);
    let tarjeta = mover_al_final(&servicio, &id, HECHO);
    assert!(tarjeta.is_completed);
    assert_eq!(tarjeta.completed_on, Some(DateIso("2026-11-14".into())));
}

#[test]
fn ca_he_06_hu04_ca05() {
    // HE-06-HU04-CA05 · Sin conexión: el cambio de columna queda en la base local y en `pending_change` (ET06).
    let servicio = con_semilla();
    let id = pagar_la_luz(&servicio, POR_HACER);
    mover_al_final(&servicio, &id, EN_PROGRESO);
    assert_eq!(columna_de(&servicio, &id), EN_PROGRESO);
    assert_eq!(pendientes(&servicio, &id), 1);
}

/// Tres tarjetas de hoy, con `completadas` de ellas en Hecho.
fn tres_de_hoy(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    completadas: usize,
) -> Vec<String> {
    let ids: Vec<String> = ["Pagar la luz", "Estudiar redes", "Leer capítulo 3"]
        .iter()
        .enumerate()
        .map(|(i, t)| {
            tarjeta_en(
                servicio,
                POR_HACER,
                t,
                "2026-11-14",
                1024.0 * (i as f64 + 1.0),
            )
        })
        .collect();
    for id in ids.iter().take(completadas) {
        alternar(servicio, id, true).unwrap();
    }
    ids
}

fn resumen(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> (i64, i64, i64, f64) {
    let s = bloquear(servicio.planificador_de_hoy(USUARIO))
        .unwrap()
        .summary;
    (s.completed, s.total, s.remaining, s.percent)
}

#[test]
fn ca_he_12_hu03_ca01() {
    // HE-12-HU03-CA01 · 2 de 3 completadas: «Completadas: 2 de 3», «Te quedan 1» y «67 %» (ET01 a ET03).
    let servicio = con_semilla();
    tres_de_hoy(&servicio, 2);
    assert_eq!(resumen(&servicio), (2, 3, 1, 67.0));
}

#[test]
fn ca_he_12_hu03_ca02() {
    // HE-12-HU03-CA02 · De 1 de 3 a 2 de 3 al marcar «Pagar la luz» (ET04).
    let servicio = con_semilla();
    let ids = tres_de_hoy(&servicio, 0);
    alternar(&servicio, &ids[1], true).unwrap();
    assert_eq!(resumen(&servicio), (1, 3, 2, 33.0));
    alternar(&servicio, &ids[0], true).unwrap();
    assert_eq!(resumen(&servicio), (2, 3, 1, 67.0));
}

#[test]
fn ca_he_12_hu03_ca03() {
    // HE-12-HU03-CA03 · De 2 de 3 a 1 de 3 al desmarcar «Pagar la luz»: «Te quedan 2» y «33 %».
    let servicio = con_semilla();
    let ids = tres_de_hoy(&servicio, 2);
    alternar(&servicio, &ids[0], false).unwrap();
    assert_eq!(resumen(&servicio), (1, 3, 2, 33.0));
}

#[test]
fn ca_he_12_hu03_ca04() {
    // HE-12-HU03-CA04 · Las 3 completadas: «Completadas: 3 de 3», «100 %» y 0 pendientes (ET05; la vista no
    // muestra «Te quedan 0», ET07).
    let servicio = con_semilla();
    tres_de_hoy(&servicio, 3);
    assert_eq!(resumen(&servicio), (3, 3, 0, 100.0));
}

#[test]
fn ca_he_12_hu03_ca05() {
    // HE-12-HU03-CA05 · Sin tarjetas para hoy: total 0; la vista no muestra el resumen (ET06).
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Otro día", "2026-11-20", 1024.0);
    assert_eq!(resumen(&servicio), (0, 0, 0, 0.0));
}
