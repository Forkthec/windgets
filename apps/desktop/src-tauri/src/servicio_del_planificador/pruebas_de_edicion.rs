//! Pruebas del Núcleo de HE-07-HU04 (editar una tarjeta) y HE-07-HU05 (eliminar una tarjeta).

use super::pruebas::*;
use super::*;
use crate::tipos::CardPatch;

fn editar(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    id: &str,
    patch: CardPatch,
) -> Result<ConMensaje<Card>, AppError> {
    bloquear(servicio.actualizar_tarjeta(
        USUARIO,
        CardUpdateParams {
            id: Uuid(id.into()),
            patch,
        },
    ))
}

fn vacio_patch() -> CardPatch {
    CardPatch {
        r#type: None,
        title: None,
        due_date: None,
        description: None,
        priority: None,
        label_ids: None,
    }
}

/// Una tarjeta creada hoy con fecha límite 20/11/2026.
fn una_tarjeta(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Card {
    crear(servicio, params("Informe", "2026-11-20"))
        .unwrap()
        .valor
}

/// No guarda nada: la tarjeta sigue igual y no se encola ningún cambio nuevo.
fn rechaza(patch: CardPatch, code: ErrorCode, message: &str, field: &str) {
    let servicio = con_semilla();
    let antes = una_tarjeta(&servicio);
    let pendientes = contar(&servicio, "SELECT count(*) FROM pending_change");
    let e = editar(&servicio, &antes.id.0, patch).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (code, message, Some(field))
    );
    assert_eq!(
        bloquear(servicio.tarjeta(USUARIO, &antes.id.0)).unwrap(),
        Some(antes)
    );
    assert_eq!(
        contar(&servicio, "SELECT count(*) FROM pending_change"),
        pendientes
    );
}

#[test]
fn rd_96_una_tarjeta_admite_3_etiquetas_y_la_4_no_se_guarda() {
    // RD-96: con 3 se guarda; con 4 sale `labels.too_many` en `label_ids` y la tarjeta conserva las 3.
    let servicio = con_semilla();
    let cuatro: Vec<Uuid> = ["A", "B", "C", "D"]
        .iter()
        .map(|n| Uuid(etiqueta(&servicio, n)))
        .collect();
    let tarjeta = crear(
        &servicio,
        CardCreateParams {
            label_ids: Some(cuatro[..3].to_vec()),
            ..params("Informe", "2026-11-20")
        },
    )
    .unwrap()
    .valor;
    assert_eq!(tarjeta.label_ids.len(), 3);
    let otras = CardPatch {
        label_ids: Some(cuatro[1..].to_vec()),
        ..vacio_patch()
    };
    assert_eq!(
        editar(&servicio, &tarjeta.id.0, otras)
            .unwrap()
            .valor
            .label_ids
            .len(),
        3
    );
    let todas = CardPatch {
        label_ids: Some(cuatro),
        ..vacio_patch()
    };
    let e = editar(&servicio, &tarjeta.id.0, todas).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::LabelsTooMany,
            "Puedes asignar hasta 3 etiquetas.",
            Some("label_ids")
        )
    );
    assert_eq!(contar(&servicio, "SELECT count(*) FROM card_label"), 3);
}

#[test]
fn ca_he_07_hu04_ca01() {
    // HE-07-HU04-CA01 · Otro título válido: guarda, responde «Tarjeta actualizada.» (ET14) y encola el cambio
    // del campo con su hora (ET10: el evento cards_changed lo emite el puente).
    let servicio = con_semilla();
    let t = una_tarjeta(&servicio);
    let r = editar(
        &servicio,
        &t.id.0,
        CardPatch {
            title: Some("Informe final".into()),
            ..vacio_patch()
        },
    )
    .unwrap();
    assert_eq!(r.mensaje.message, "Tarjeta actualizada.");
    assert_eq!(r.mensaje.code, "card_update");
    assert_eq!(r.valor.title, "Informe final");
    let fields: String = bloquear(async {
        sqlx::query_scalar("SELECT fields FROM pending_change WHERE entity_kind = 'card'")
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    let fields: Value = serde_json::from_str(&fields).unwrap();
    assert_eq!(fields["title"]["value"], "Informe final");
    assert_eq!(
        fields["due_date"]["value"], "2026-11-20",
        "el cambio pendiente de la creación se funde con el de la edición (H-D-11)"
    );
}

#[test]
fn ca_he_07_hu04_ca02() {
    // HE-07-HU04-CA02 · Otra fecha límite igual o posterior a hoy: la tarjeta queda con la nueva fecha (ET07,
    // ET11).
    let servicio = con_semilla();
    let t = una_tarjeta(&servicio);
    for fecha in ["2026-11-14", "2026-12-01"] {
        let r = editar(
            &servicio,
            &t.id.0,
            CardPatch {
                due_date: Some(DateIso(fecha.into())),
                ..vacio_patch()
            },
        )
        .unwrap();
        assert_eq!(r.valor.due_date, DateIso(fecha.into()));
    }
}

#[test]
fn ca_he_07_hu04_ca03() {
    // HE-07-HU04-CA03 · Tarjeta vencida: cambia la prioridad y guarda sin tocar la fecha límite (ET08), aunque
    // el formulario reenvíe la fecha de siempre.
    let servicio = con_semilla();
    let id = tarjeta_en(&servicio, POR_HACER, "Atrasada", "2026-11-10", 1024.0);
    let r = editar(
        &servicio,
        &id,
        CardPatch {
            due_date: Some(DateIso("2026-11-10".into())),
            priority: Some(Some(Priority::Low)),
            ..vacio_patch()
        },
    )
    .unwrap();
    assert_eq!(r.mensaje.message, "Tarjeta actualizada.");
    assert_eq!(r.valor.priority, Some(Priority::Low));
    assert!(r.valor.is_overdue);
}

#[test]
fn ca_he_07_hu04_ca04() {
    // HE-07-HU04-CA04 · Título vacío (ET04, ET16).
    for titulo in ["", "   "] {
        rechaza(
            CardPatch {
                title: Some(titulo.into()),
                ..vacio_patch()
            },
            ErrorCode::TitleRequired,
            "Este campo es obligatorio.",
            "title",
        );
    }
}

#[test]
fn ca_he_07_hu04_ca05() {
    // HE-07-HU04-CA05 · Título de 101 caracteres (ET17).
    rechaza(
        CardPatch {
            title: Some("t".repeat(101)),
            ..vacio_patch()
        },
        ErrorCode::TitleTooLong,
        "El título no puede superar los 100 caracteres.",
        "title",
    );
}

#[test]
fn ca_he_07_hu04_ca06() {
    // HE-07-HU04-CA06 · Fecha límite vacía (ET06).
    rechaza(
        CardPatch {
            due_date: Some(DateIso(String::new())),
            ..vacio_patch()
        },
        ErrorCode::DueDateRequired,
        "Este campo es obligatorio.",
        "due_date",
    );
}

#[test]
fn ca_he_07_hu04_ca07() {
    // HE-07-HU04-CA07 · Nueva fecha límite anterior a hoy (ET18).
    rechaza(
        CardPatch {
            due_date: Some(DateIso("2026-11-13".into())),
            ..vacio_patch()
        },
        ErrorCode::DueDateInPast,
        "La fecha límite no puede ser anterior a hoy.",
        "due_date",
    );
}

#[test]
fn ca_he_07_hu04_ca08() {
    // HE-07-HU04-CA08 · Descripción de 1001 caracteres (ET09, ET19).
    rechaza(
        CardPatch {
            description: Some(Some("d".repeat(1001))),
            ..vacio_patch()
        },
        ErrorCode::DescriptionTooLong,
        "La descripción no puede superar los 1000 caracteres.",
        "description",
    );
}

#[test]
fn ca_he_07_hu04_ca10() {
    // HE-07-HU04-CA10 · Nueva fecha límite antes del día del bloque horario: guarda, quita el bloque (ET12,
    // ET13) y lo dice en el mensaje (ET15).
    let servicio = con_semilla();
    let t = una_tarjeta(&servicio);
    con_bloque(&servicio, &t.id.0, "2026-11-18", 9);
    let r = editar(
        &servicio,
        &t.id.0,
        CardPatch {
            due_date: Some(DateIso("2026-11-16".into())),
            ..vacio_patch()
        },
    )
    .unwrap();
    assert_eq!(
        r.mensaje.message,
        "Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite."
    );
    assert_eq!(
        (r.valor.scheduled_date, r.valor.scheduled_hour),
        (None, None)
    );
    // Con la fecha del mismo día del bloque, el bloque se queda.
    let otra = una_tarjeta(&servicio);
    con_bloque(&servicio, &otra.id.0, "2026-11-18", 9);
    let r = editar(
        &servicio,
        &otra.id.0,
        CardPatch {
            due_date: Some(DateIso("2026-11-18".into())),
            ..vacio_patch()
        },
    )
    .unwrap();
    assert_eq!(r.mensaje.message, "Tarjeta actualizada.");
    assert_eq!(r.valor.scheduled_hour, Some(Hour(9)));
}

#[test]
fn ca_he_07_hu04_ca11() {
    // HE-07-HU04-CA11 · La tarjeta se eliminó en otro computador: no guarda (ET20) y responde «Esta tarjeta ya
    // no existe.» (ET21).
    let servicio = con_semilla();
    let e = editar(
        &servicio,
        "00000000-0000-4000-8000-00000000ffff",
        CardPatch {
            title: Some("Otro".into()),
            ..vacio_patch()
        },
    )
    .unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (ErrorCode::CardNotFound, "Esta tarjeta ya no existe.")
    );
    assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
}

#[test]
fn editar_quita_la_descripcion_y_cambia_las_etiquetas() {
    // `null` en description y priority quita el valor; label_ids reemplaza las etiquetas y encola la baja.
    let servicio = con_semilla();
    let (a, b) = (etiqueta(&servicio, "A"), etiqueta(&servicio, "B"));
    let t = crear(
        &servicio,
        CardCreateParams {
            description: Some("Algo".into()),
            priority: Some(Priority::High),
            label_ids: Some(vec![Uuid(a.clone())]),
            ..params("Con todo", "2026-11-20")
        },
    )
    .unwrap()
    .valor;
    let patch: CardPatch = serde_json::from_value(serde_json::json!({
        "description": null,
        "priority": null,
        "label_ids": [b.clone()],
    }))
    .unwrap();
    let r = editar(&servicio, &t.id.0, patch).unwrap();
    assert_eq!((r.valor.description, r.valor.priority), (None, None));
    assert_eq!(r.valor.label_ids, [Uuid(b)]);
    let union_quitada = id_de_card_label(&t.id.0, &a);
    let op: String = bloquear(async {
        sqlx::query_scalar("SELECT op FROM pending_change WHERE entity_id = ?")
            .bind(&union_quitada)
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    assert_eq!(op, "delete");
}

#[test]
fn ca_he_07_hu05_ca02() {
    // HE-07-HU05-CA02 · Eliminar confirmado: la tarjeta deja de existir en todas las vistas (ET04), con sus
    // etiquetas de tarjeta, y responde «Tarjeta eliminada.» (ET06). Es definitivo (ET03): queda la orden de
    // eliminación en la cola para la nube.
    let servicio = con_semilla();
    let a = etiqueta(&servicio, "A");
    let t = crear(
        &servicio,
        CardCreateParams {
            label_ids: Some(vec![Uuid(a.clone())]),
            ..params("Borrar", "2026-11-20")
        },
    )
    .unwrap()
    .valor;
    let otra = una_tarjeta(&servicio);
    let r = bloquear(servicio.eliminar_tarjeta(USUARIO, &t.id.0)).unwrap();
    assert_eq!(
        (r.mensaje.code.as_str(), r.mensaje.message.as_str()),
        ("card_delete", "Tarjeta eliminada.")
    );
    assert_eq!(bloquear(servicio.tarjeta(USUARIO, &t.id.0)).unwrap(), None);
    assert_eq!(contar(&servicio, "SELECT count(*) FROM card_label"), 0);
    let tablero = bloquear(servicio.tablero(USUARIO)).unwrap();
    let ids: Vec<_> = tablero.columns[0]
        .cards
        .iter()
        .map(|c| c.id.clone())
        .collect();
    assert_eq!(ids, [otra.id]);
    let (op, fields): (String, String) = bloquear(async {
        sqlx::query_as("SELECT op, fields FROM pending_change WHERE entity_id = ?")
            .bind(&t.id.0)
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    assert_eq!((op.as_str(), fields.as_str()), ("delete", "{}"));
    let union = id_de_card_label(&t.id.0, &a);
    let op: String = bloquear(async {
        sqlx::query_scalar("SELECT op FROM pending_change WHERE entity_id = ?")
            .bind(&union)
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
    });
    assert_eq!(op, "delete");
}

#[test]
fn eliminar_una_tarjeta_que_ya_no_existe_es_card_not_found() {
    // DP-04; tampoco se elimina la tarjeta de otro usuario (RNF-21).
    let servicio = con_semilla();
    let t = una_tarjeta(&servicio);
    let e = bloquear(servicio.eliminar_tarjeta(OTRO_USUARIO, &t.id.0)).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (ErrorCode::CardNotFound, "Esta tarjeta ya no existe.")
    );
    assert!(
        bloquear(servicio.tarjeta(USUARIO, &t.id.0))
            .unwrap()
            .is_some()
    );
}
