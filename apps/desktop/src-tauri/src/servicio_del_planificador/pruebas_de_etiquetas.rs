//! Pruebas del Núcleo de HE-08 (etiquetas) y HE-07-HU02 (asignar etiquetas a una tarjeta).

use super::pruebas::*;
use super::*;

fn nombres(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<String> {
    bloquear(servicio.etiquetas(USUARIO))
        .unwrap()
        .into_iter()
        .map(|e| e.name)
        .collect()
}

#[test]
fn ca_he_08_hu01_ca01() {
    // HE-08-HU01-CA01 · Cada etiqueta con su nombre y su color (ET02).
    let servicio = con_semilla();
    etiqueta(&servicio, "Estudio");
    let lista = bloquear(servicio.etiquetas(USUARIO)).unwrap();
    assert_eq!(lista.len(), 1);
    assert_eq!(
        (
            lista[0].name.as_str(),
            lista[0].color_id.as_str(),
            lista[0].color_hex.0.as_str()
        ),
        ("Estudio", "blue", "#2196F3")
    );
}

#[test]
fn ca_he_08_hu01_ca02() {
    // HE-08-HU01-CA02 · Sin etiquetas: lista vacía (la vista muestra el estado vacío, ET04).
    assert!(nombres(&con_semilla()).is_empty());
}

#[test]
fn ca_he_08_hu01_ca03() {
    // HE-08-HU01-CA03 · De la A a la Z (ET05, D-165).
    let servicio = con_semilla();
    for nombre in ["Trabajo", "casa", "Estudio"] {
        etiqueta(&servicio, nombre);
    }
    assert_eq!(nombres(&servicio), ["casa", "Estudio", "Trabajo"]);
}

fn nueva(nombre: &str, color: &str) -> LabelCreateParams {
    LabelCreateParams {
        name: nombre.into(),
        color_id: color.into(),
    }
}

fn codigo_al_crear(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    nombre: &str,
    color: &str,
) -> AppError {
    bloquear(servicio.crear_etiqueta(USUARIO, nueva(nombre, color))).unwrap_err()
}

#[test]
fn ca_he_08_hu02_ca01() {
    // HE-08-HU02-CA01 · Crea la etiqueta con nombre y color, la lista la muestra y el mensaje es «Etiqueta creada.»
    // (ET03, ET05, ET08, ET09). Valores límite: 1 y 30 caracteres.
    let servicio = con_semilla();
    let creada = bloquear(servicio.crear_etiqueta(USUARIO, nueva("Estudio", "green"))).unwrap();
    assert_eq!(creada.mensaje.message, "Etiqueta creada.");
    assert_eq!(
        (
            creada.valor.name.as_str(),
            creada.valor.color_hex.0.as_str()
        ),
        ("Estudio", "#4CAF50")
    );
    bloquear(servicio.crear_etiqueta(USUARIO, nueva("A", "blue"))).unwrap();
    bloquear(servicio.crear_etiqueta(USUARIO, nueva(&"b".repeat(30), "blue"))).unwrap();
    assert_eq!(nombres(&servicio).len(), 3);
}

#[test]
fn ca_he_08_hu02_ca02() {
    // HE-08-HU02-CA02 · Nombre vacío o solo espacios: «Este campo es obligatorio.» en Nombre (ET10).
    let servicio = con_semilla();
    for nombre in ["", "   "] {
        let e = codigo_al_crear(&servicio, nombre, "blue");
        assert_eq!(
            (e.code, e.message.as_str(), e.field.as_deref()),
            (
                ErrorCode::NameRequired,
                "Este campo es obligatorio.",
                Some("name")
            )
        );
    }
    assert!(nombres(&servicio).is_empty());
}

#[test]
fn ca_he_08_hu02_ca03() {
    // HE-08-HU02-CA03 · 31 caracteres (con tildes, que cuentan uno) se rechaza (ET11).
    let servicio = con_semilla();
    let e = codigo_al_crear(&servicio, &"á".repeat(31), "blue");
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::NameTooLong,
            "El nombre de la etiqueta no puede superar los 30 caracteres.",
            Some("name")
        )
    );
    assert!(nombres(&servicio).is_empty());
}

#[test]
fn ca_he_08_hu02_ca04() {
    // HE-08-HU02-CA04 · Mismo nombre con otras mayúsculas o minúsculas, también con tilde (ET04, ET12).
    let servicio = con_semilla();
    etiqueta(&servicio, "Estudio");
    etiqueta(&servicio, "Árbol");
    for nombre in ["ESTUDIO", " estudio ", "árbol"] {
        let e = codigo_al_crear(&servicio, nombre, "blue");
        assert_eq!(
            (e.code, e.message.as_str(), e.field.as_deref()),
            (
                ErrorCode::NameDuplicate,
                "Ya existe una etiqueta con ese nombre.",
                Some("name")
            )
        );
    }
    assert_eq!(nombres(&servicio).len(), 2);
}

#[test]
fn ca_he_08_hu02_ca05() {
    // HE-08-HU02-CA05 · Sin color: «Este campo es obligatorio.» en Color, sin valor por defecto (ET14, D-162).
    let servicio = con_semilla();
    for color in ["", "no-existe"] {
        let e = codigo_al_crear(&servicio, "Estudio", color);
        assert_eq!(
            (e.code, e.message.as_str(), e.field.as_deref()),
            (
                ErrorCode::ColorRequired,
                "Este campo es obligatorio.",
                Some("color_id")
            )
        );
    }
    assert!(nombres(&servicio).is_empty());
}

#[test]
fn ca_he_08_hu02_ca06() {
    // HE-08-HU02-CA06 · Con 20 etiquetas no se crea otra (ET06); el mensaje es el de la opción deshabilitada.
    let servicio = con_semilla();
    for i in 0..20 {
        etiqueta(&servicio, &format!("Etiqueta {i}"));
    }
    let e = codigo_al_crear(&servicio, "Otra", "blue");
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::LabelLimitReached,
            "Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra."
        )
    );
    assert_eq!(nombres(&servicio).len(), 20);
}

#[test]
fn ca_he_08_hu02_ca08() {
    // HE-08-HU02-CA08 · Sin conexión: se guarda en el computador y queda en pending_change para sincronizar (ET15).
    let servicio = con_semilla();
    let creada = bloquear(servicio.crear_etiqueta(USUARIO, nueva("Casa", "gray"))).unwrap();
    assert_eq!(creada.mensaje.message, "Etiqueta creada.");
    assert_eq!(
        contar(
            &servicio,
            &format!(
                "SELECT count(*) FROM pending_change WHERE entity_kind = 'label' AND entity_id = '{}'",
                creada.valor.id.0
            )
        ),
        1
    );
}

#[test]
fn ipc_cat_01_catalogo_de_colores() {
    // IPC-CAT-01 con kind 'color' (HE-08-HU02-ET05): los colores activos del catálogo.
    let colores = bloquear(con_semilla().colores()).unwrap();
    let ids: Vec<&str> = colores.iter().map(|c| c.id.as_str()).collect();
    assert_eq!(ids.len(), 3);
    assert!(colores.iter().all(|c| c.hex.is_some()));
}

// HE-08-HU03 · Editar el nombre y el color de una etiqueta.

fn editar(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    id: &str,
    nombre: &str,
    color: &str,
) -> Result<ConMensaje<Label>, AppError> {
    bloquear(servicio.actualizar_etiqueta(
        USUARIO,
        crate::tipos::LabelUpdateParams {
            id: Uuid(id.into()),
            name: nombre.into(),
            color_id: color.into(),
        },
    ))
}

/// Asigna la etiqueta a una tarjeta nueva de Por hacer y devuelve el id de la tarjeta.
fn con_tarjeta(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    etiqueta: &str,
    titulo: &str,
) -> String {
    let tarjeta = tarjeta_en(servicio, POR_HACER, titulo, "2026-11-20", 1024.0);
    bloquear(async {
        sqlx::query("INSERT INTO card_label (id, user_id, created_at, card_id, label_id) VALUES (?, ?, ?, ?, ?)")
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(USUARIO)
            .bind("2026-11-01T00:00:00.000Z")
            .bind(&tarjeta)
            .bind(etiqueta)
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
    });
    tarjeta
}

#[test]
fn ca_he_08_hu03_ca01() {
    // HE-08-HU03-CA01 · Cambia nombre y color en la lista y en las tarjetas que la tienen (ET05, ET06).
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let tarjeta = con_tarjeta(&servicio, &id, "Informe");
    let r = editar(&servicio, &id, " Trabajo ", "green").unwrap();
    assert_eq!(r.mensaje.message, "Etiqueta actualizada.");
    assert_eq!(
        (r.valor.name.as_str(), r.valor.color_id.as_str()),
        ("Trabajo", "green")
    );
    assert_eq!(nombres(&servicio), ["Trabajo"]);
    let detalle = bloquear(servicio.tarjeta(USUARIO, &tarjeta))
        .unwrap()
        .unwrap();
    assert_eq!(
        detalle
            .label_ids
            .iter()
            .map(|l| l.0.clone())
            .collect::<Vec<_>>(),
        [id]
    );
}

#[test]
fn ca_he_08_hu03_ca02() {
    // HE-08-HU03-CA02 · Nombre vacío: «Este campo es obligatorio.» en Nombre (ET03, ET07).
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let e = editar(&servicio, &id, "  ", "green").unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::NameRequired,
            "Este campo es obligatorio.",
            Some("name")
        )
    );
    assert_eq!(nombres(&servicio), ["Estudio"]);
}

#[test]
fn ca_he_08_hu03_ca03() {
    // HE-08-HU03-CA03 · Más de 30 caracteres (ET08); 30 sí.
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let e = editar(&servicio, &id, &"a".repeat(31), "green").unwrap_err();
    assert_eq!(
        e.message,
        "El nombre de la etiqueta no puede superar los 30 caracteres."
    );
    assert!(editar(&servicio, &id, &"a".repeat(30), "green").is_ok());
}

#[test]
fn ca_he_08_hu03_ca04() {
    // HE-08-HU03-CA04 · El nombre de otra etiqueta, con otras mayúsculas: duplicado (ET04, ET09); la propia no cuenta.
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    etiqueta(&servicio, "Trabajo");
    let e = editar(&servicio, &id, "TRABAJO", "green").unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::NameDuplicate,
            "Ya existe una etiqueta con ese nombre."
        )
    );
    assert!(editar(&servicio, &id, "ESTUDIO", "green").is_ok());
}

#[test]
fn ca_he_08_hu03_ca05() {
    // HE-08-HU03-CA05 · Sin color: «Este campo es obligatorio.» en Color (ET11; D-162).
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let e = editar(&servicio, &id, "Estudio", "").unwrap_err();
    assert_eq!(
        (e.code, e.field.as_deref()),
        (ErrorCode::ColorRequired, Some("color_id"))
    );
}

// HE-08-HU04 · Eliminar una etiqueta.

#[test]
fn ca_he_08_hu04_ca01() {
    // HE-08-HU04-CA01 · Sin tarjetas: la información da 0 tarjetas (la vista abre M-10) y todavía no se elimina.
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let info = bloquear(servicio.info_para_eliminar_etiqueta(USUARIO, &id)).unwrap();
    assert_eq!((info.name.as_str(), info.card_count), ("Estudio", 0));
    assert_eq!(nombres(&servicio), ["Estudio"]);
}

#[test]
fn ca_he_08_hu04_ca02() {
    // HE-08-HU04-CA02 · Eliminar una etiqueta sin tarjetas (ET08, ET09).
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let r = bloquear(servicio.eliminar_etiqueta(USUARIO, &id)).unwrap();
    assert_eq!(r.mensaje.message, "Etiqueta eliminada.");
    assert!(nombres(&servicio).is_empty());
}

#[test]
fn ca_he_08_hu04_ca03() {
    // HE-08-HU04-CA03 · Asignada a varias tarjetas: la cantidad para M-14.
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    con_tarjeta(&servicio, &id, "A");
    con_tarjeta(&servicio, &id, "B");
    assert_eq!(
        bloquear(servicio.info_para_eliminar_etiqueta(USUARIO, &id))
            .unwrap()
            .card_count,
        2
    );
}

#[test]
fn ca_he_08_hu04_ca04() {
    // HE-08-HU04-CA04 · Asignada a una tarjeta (ET10).
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    con_tarjeta(&servicio, &id, "A");
    assert_eq!(
        bloquear(servicio.info_para_eliminar_etiqueta(USUARIO, &id))
            .unwrap()
            .card_count,
        1
    );
}

#[test]
fn ca_he_08_hu04_ca05() {
    // HE-08-HU04-CA05 · La quita de las tarjetas sin eliminarlas (ET06) y encola la eliminación.
    let servicio = con_semilla();
    let id = etiqueta(&servicio, "Estudio");
    let tarjeta = con_tarjeta(&servicio, &id, "Informe");
    let r = bloquear(servicio.eliminar_etiqueta(USUARIO, &id)).unwrap();
    assert_eq!(r.valor, [Uuid(tarjeta.clone())]);
    let detalle = bloquear(servicio.tarjeta(USUARIO, &tarjeta))
        .unwrap()
        .unwrap();
    assert!(detalle.label_ids.is_empty());
    assert_eq!(
        contar(
            &servicio,
            &format!(
                "SELECT COUNT(*) FROM pending_change WHERE entity_kind = 'label' AND entity_id = '{id}' AND op = 'delete'"
            )
        ),
        1
    );
}
