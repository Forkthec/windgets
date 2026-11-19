//! Pruebas del Núcleo de HE-03-HU04 (renombrar un tema). La vista tiene las de CA02, CA05 y CA07 en Themes.test.tsx.

use super::pruebas_del_tema_en_edicion::{MI_TEMA, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

const AHORA_MS: i64 = 1_793_600_000_000;

fn renombrar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    id: &str,
    nombre: &str,
) -> Result<ConMensaje<crate::tipos::ThemeSummary>, AppError> {
    bloquear(servicio.renombrar_tema(base, USUARIO, id, nombre, AHORA_MS))
}

fn nombres(servicio: &ServicioDePersonalizacion, base: &BaseLocal) -> Vec<String> {
    let mut n: Vec<String> = bloquear(servicio.temas(base, USUARIO))
        .unwrap()
        .into_iter()
        .map(|t| t.name)
        .collect();
    n.sort();
    n
}

#[test]
fn ca_he_03_hu04_ca01() {
    // HE-03-HU04-CA01 · Cambia solo el nombre: conserva el contenido y «Aplicado» (ET02, ET03) y se sincroniza.
    let (base, servicio) = con_temas();
    let aplicado = bloquear(servicio.temas(&base, USUARIO))
        .unwrap()
        .into_iter()
        .find(|t| t.is_applied)
        .unwrap();
    let antes = bloquear(ServicioDePersonalizacion::guardado(
        &base,
        USUARIO,
        &aplicado.id.0,
    ))
    .unwrap()
    .unwrap();
    let r = renombrar(&servicio, &base, &aplicado.id.0, "  Mi escritorio  ").unwrap();
    assert_eq!(r.mensaje.message, "Tema renombrado.");
    assert_eq!(r.valor.name, "Mi escritorio");
    assert!(r.valor.is_applied);
    assert_eq!(r.valor.last_modified_at, aplicado.last_modified_at);
    let despues = bloquear(ServicioDePersonalizacion::guardado(
        &base,
        USUARIO,
        &aplicado.id.0,
    ))
    .unwrap()
    .unwrap();
    assert_eq!(despues.1, antes.1);
    let pendientes: i64 = bloquear(async {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM pending_change WHERE entity_kind = 'theme' AND entity_id = ?",
        )
        .bind(&aplicado.id.0)
        .fetch_one(base.pool().await.unwrap())
        .await
        .unwrap()
    });
    assert_eq!(pendientes, 1);
}

#[test]
fn ca_he_03_hu04_ca02() {
    // HE-03-HU04-CA02 · Vacío o con solo espacios: no renombra (la vista deshabilita «Guardar», ET05).
    let (base, servicio) = con_temas();
    let antes = nombres(&servicio, &base);
    for nombre in ["", "   "] {
        assert_eq!(
            renombrar(&servicio, &base, MI_TEMA, nombre)
                .unwrap_err()
                .code,
            ErrorCode::NameRequired
        );
    }
    assert_eq!(nombres(&servicio, &base), antes);
}

#[test]
fn ca_he_03_hu04_ca03() {
    // HE-03-HU04-CA03 · Más de 40 caracteres: mensaje en el campo Nombre y no renombra; 40 sí.
    let (base, servicio) = con_temas();
    let e = renombrar(&servicio, &base, MI_TEMA, &"a".repeat(41)).unwrap_err();
    assert_eq!(e.code, ErrorCode::NameTooLong);
    assert_eq!(e.message, "El nombre no puede superar los 40 caracteres.");
    assert_eq!(e.field.as_deref(), Some("name"));
    assert!(renombrar(&servicio, &base, MI_TEMA, &"a".repeat(40)).is_ok());
}

#[test]
fn ca_he_03_hu04_ca04() {
    // HE-03-HU04-CA04 · El nombre de otro tema, con otras mayúsculas: duplicado en el campo Nombre (ET04).
    let (base, servicio) = con_temas();
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let otro = temas.iter().find(|t| t.id.0 != MI_TEMA).unwrap();
    let e = renombrar(
        &servicio,
        &base,
        MI_TEMA,
        &format!(" {} ", otro.name.to_uppercase()),
    )
    .unwrap_err();
    assert_eq!(e.code, ErrorCode::NameDuplicate);
    assert_eq!(e.message, "Ya existe un tema con ese nombre. Elige otro.");
    assert_eq!(e.field.as_deref(), Some("name"));
}

#[test]
fn ca_he_03_hu04_ca06() {
    // HE-03-HU04-CA06 · Solo cambian mayúsculas o minúsculas: no cuenta el propio tema.
    let (base, servicio) = con_temas();
    let propio = bloquear(servicio.temas(&base, USUARIO))
        .unwrap()
        .into_iter()
        .find(|t| t.id.0 == MI_TEMA)
        .unwrap();
    let r = renombrar(&servicio, &base, MI_TEMA, &propio.name.to_uppercase()).unwrap();
    assert_eq!(r.mensaje.message, "Tema renombrado.");
    assert_eq!(r.valor.name, propio.name.to_uppercase());
}
