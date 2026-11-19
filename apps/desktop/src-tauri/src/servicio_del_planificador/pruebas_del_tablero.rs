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

fn editar_columna(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    id: &str,
    nombre: Option<&str>,
    color: Option<&str>,
) -> Result<ConMensaje<Column>, AppError> {
    bloquear(servicio.actualizar_columna(
        USUARIO,
        ColumnUpdateParams {
            id: Uuid(id.into()),
            name: nombre.map(str::to_string),
            color_id: color.map(str::to_string),
        },
    ))
}

fn crear_revision(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> String {
    bloquear(servicio.crear_columna(USUARIO, nueva_columna("Revisión", None)))
        .unwrap()
        .valor
        .id
        .0
}

#[test]
fn ca_he_09_hu04_ca01() {
    // HE-09-HU04-CA01 · Cambia el nombre, el tablero lo muestra (ET07) y queda en la cola.
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    let r = editar_columna(&servicio, &id, Some("Revisión final"), Some("gray")).unwrap();
    assert_eq!(r.mensaje.message, "Columna actualizada.");
    assert_eq!(r.valor.name, "Revisión final");
    assert!(nombres_de_columnas(&servicio).contains(&"Revisión final".to_string()));
    // La cola guarda un cambio por columna con el nombre nuevo (datos.md, Modelo · 6).
    let fields: String = bloquear(async {
        sqlx::query_scalar("SELECT fields FROM pending_change WHERE entity_id = ?")
            .bind(&id)
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    let fields: Value = serde_json::from_str(&fields).unwrap();
    assert_eq!(fields["name"]["value"], "Revisión final");
}

#[test]
fn ca_he_09_hu04_ca02() {
    // HE-09-HU04-CA02 · Cambia el color por otro del catálogo (ET05).
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    let r = editar_columna(&servicio, &id, Some("Revisión"), Some("blue")).unwrap();
    assert_eq!(
        (r.valor.color_id.as_str(), r.valor.color_hex.0.as_str()),
        ("blue", "#2196F3")
    );
    assert_eq!(r.mensaje.message, "Columna actualizada.");
}

#[test]
fn ca_he_09_hu04_ca03() {
    // HE-09-HU04-CA03 · Renombrar Hecho conserva su función y la tarjeta sigue completada (ET06).
    let servicio = con_semilla();
    let id = tarjeta_en(&servicio, POR_HACER, "Informe", "2026-11-20", 1024.0);
    mover(&servicio, &id, HECHO, al_final()).unwrap();
    let r = editar_columna(&servicio, HECHO, Some("Terminadas"), None).unwrap();
    assert_eq!(
        (r.valor.name.as_str(), &r.valor.role),
        ("Terminadas", &ColumnRole::Done)
    );
    assert_eq!(
        contar(
            &servicio,
            &format!("SELECT count(*) FROM card WHERE id = '{id}' AND completed_on IS NOT NULL")
        ),
        1
    );
}

#[test]
fn ca_he_09_hu04_ca04() {
    // HE-09-HU04-CA04 · Nombre vacío: no guarda.
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    let e = editar_columna(&servicio, &id, Some(" "), None).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::NameRequired,
            "Este campo es obligatorio.",
            Some("name")
        )
    );
    assert!(nombres_de_columnas(&servicio).contains(&"Revisión".to_string()));
}

#[test]
fn ca_he_09_hu04_ca05() {
    // HE-09-HU04-CA05 · 31 caracteres: no guarda (ET09: mismas reglas de HE-09-HU03).
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    let e = editar_columna(&servicio, &id, Some(&"a".repeat(31)), None).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::NameTooLong,
            "El nombre de la columna no puede superar los 30 caracteres."
        )
    );
}

#[test]
fn ca_he_09_hu04_ca06() {
    // HE-09-HU04-CA06 · Bloqueadas por «revisión» con Revisión creada; conservar el propio nombre sí se puede.
    let servicio = con_semilla();
    crear_revision(&servicio);
    let bloqueadas = bloquear(servicio.crear_columna(USUARIO, nueva_columna("Bloqueadas", None)))
        .unwrap()
        .valor
        .id
        .0;
    let e = editar_columna(&servicio, &bloqueadas, Some("revisión"), None).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::NameDuplicate,
            "Ya existe una columna con ese nombre.",
            Some("name")
        )
    );
    editar_columna(&servicio, &bloqueadas, Some("BLOQUEADAS"), None).unwrap();
}

#[test]
fn ipc_col_03_columna_que_ya_no_existe() {
    // IPC-COL-03: una columna que ya no existe responde `column.not_found` sin texto.
    let servicio = con_semilla();
    let e = editar_columna(
        &servicio,
        "00000000-0000-4000-8000-0000000000ff",
        Some("X"),
        None,
    )
    .unwrap_err();
    assert_eq!(e.code, ErrorCode::ColumnNotFound);
}

fn reordenar(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    ids: &[&str],
) -> Result<Vec<Column>, AppError> {
    bloquear(servicio.reordenar_columnas(
        USUARIO,
        ColumnReorderParams {
            column_ids: ids.iter().map(|i| Uuid((*i).into())).collect(),
        },
    ))
}

#[test]
fn ca_he_09_hu05_ca01() {
    // HE-09-HU05-CA01 · Hecho a la primera posición: Hecho, Por hacer, En progreso (ET03), guardado al volver a
    // abrir el tablero (ET04) y en la cola para sincronizar.
    let servicio = con_semilla();
    let r = reordenar(&servicio, &[HECHO, POR_HACER, EN_PROGRESO]).unwrap();
    let nombres: Vec<&str> = r.iter().map(|c| c.name.as_str()).collect();
    assert_eq!(nombres, ["Hecho", "Por hacer", "En progreso"]);
    assert_eq!(
        nombres_de_columnas(&servicio),
        ["Hecho", "Por hacer", "En progreso"]
    );
    assert!(
        contar(
            &servicio,
            "SELECT count(*) FROM pending_change WHERE entity_kind = 'kanban_column'"
        ) >= 1
    );
}

#[test]
fn ca_he_09_hu05_ca02() {
    // HE-09-HU05-CA02 · Soltar fuera del área: la vista no llama al Núcleo. Una lista incompleta o con columnas
    // ajenas responde `column.order_invalid` y mantiene el orden anterior (ET02).
    let servicio = con_semilla();
    for ids in [
        vec![HECHO, POR_HACER],
        vec![HECHO, POR_HACER, "00000000-0000-4000-8000-0000000000ff"],
    ] {
        let e = reordenar(&servicio, &ids).unwrap_err();
        assert_eq!(e.code, ErrorCode::ColumnOrderInvalid);
    }
    assert_eq!(
        nombres_de_columnas(&servicio),
        ["Por hacer", "En progreso", "Hecho"]
    );
    assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
}

// HE-09-HU06 · Eliminar las columnas creadas.

/// Las tarjetas de una columna, en su orden: (título, posición).
fn tarjetas_de(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    columna: &str,
) -> Vec<String> {
    let tablero = bloquear(servicio.tablero(USUARIO)).unwrap();
    tablero
        .columns
        .iter()
        .filter(|c| c.column.id.0 == columna)
        .flat_map(|c| c.cards.iter().map(|t| t.title.clone()))
        .collect()
}

#[test]
fn ca_he_09_hu06_ca01() {
    // HE-09-HU06-CA01 · Sin tarjetas: 0 tarjetas (la vista abre M-09) y la columna sigue en el tablero (ET03).
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    let info = bloquear(servicio.info_para_eliminar_columna(USUARIO, &id)).unwrap();
    assert_eq!((info.name.as_str(), info.card_count), ("Revisión", 0));
    assert!(nombres_de_columnas(&servicio).contains(&"Revisión".to_string()));
}

#[test]
fn ca_he_09_hu06_ca02() {
    // HE-09-HU06-CA02 · La elimina del tablero (ET07) y queda en la cola como eliminación.
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    let r = bloquear(servicio.eliminar_columna(USUARIO, &id)).unwrap();
    assert_eq!(r.mensaje.message, "Columna eliminada.");
    assert!(!nombres_de_columnas(&servicio).contains(&"Revisión".to_string()));
    assert_eq!(
        contar(
            &servicio,
            &format!(
                "SELECT COUNT(*) FROM pending_change WHERE entity_id = '{id}' AND op = 'delete'"
            )
        ),
        1
    );
}

#[test]
fn ca_he_09_hu06_ca03() {
    // HE-09-HU06-CA03 · Con 3 tarjetas: la cantidad y el destino «Por hacer» para M-13 (ET04).
    let servicio = con_semilla();
    let id = crear_revision(&servicio);
    for (i, t) in ["A", "B", "C"].iter().enumerate() {
        tarjeta_en(&servicio, &id, t, "2026-11-20", (i as f64 + 1.0) * 1024.0);
    }
    let info = bloquear(servicio.info_para_eliminar_columna(USUARIO, &id)).unwrap();
    assert_eq!(
        (info.card_count, info.destination_name.as_str()),
        (3, "Por hacer")
    );
}

#[test]
fn ca_he_09_hu06_ca04() {
    // HE-09-HU06-CA04 · Las 3 tarjetas pasan al final de Por hacer, en su orden (ET05, ET09).
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Ya estaba", "2026-11-20", 1024.0);
    let id = crear_revision(&servicio);
    for (i, t) in ["A", "B", "C"].iter().enumerate() {
        tarjeta_en(&servicio, &id, t, "2026-11-20", (i as f64 + 1.0) * 1024.0);
    }
    let r = bloquear(servicio.eliminar_columna(USUARIO, &id)).unwrap();
    assert_eq!(r.valor.len(), 3);
    assert_eq!(
        tarjetas_de(&servicio, POR_HACER),
        ["Ya estaba", "A", "B", "C"]
    );
}

#[test]
fn ca_he_09_hu06_ca05() {
    // HE-09-HU06-CA05 · Las columnas por defecto no se eliminan (ET02).
    let servicio = con_semilla();
    for columna in [POR_HACER, EN_PROGRESO, HECHO] {
        let e = bloquear(servicio.eliminar_columna(USUARIO, columna)).unwrap_err();
        assert_eq!(e.code, ErrorCode::ColumnDefaultNotDeletable);
        assert_eq!(e.message, "Las columnas por defecto no se pueden eliminar.");
    }
}

#[test]
fn ca_he_09_hu06_ca07() {
    // HE-09-HU06-CA07 · Con Por hacer renombrada, el destino es su nombre actual (ET06).
    let servicio = con_semilla();
    editar_columna(&servicio, POR_HACER, Some("Prioridades"), None).unwrap();
    let id = crear_revision(&servicio);
    tarjeta_en(&servicio, &id, "A", "2026-11-20", 1024.0);
    let info = bloquear(servicio.info_para_eliminar_columna(USUARIO, &id)).unwrap();
    assert_eq!(info.destination_name, "Prioridades");
}
