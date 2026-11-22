//! Pruebas del Núcleo de HE-03-HU02 (guardar como tema nuevo los cambios de la vista previa).

use super::pruebas_de_colores::primario;
use super::pruebas_del_tema_en_edicion::{MI_TEMA, T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

const AHORA_MS: i64 = 1_793_600_000_000;

fn guardar_como(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    nombre: &str,
) -> Result<ConMensaje<crate::tipos::ThemeIdResult>, AppError> {
    bloquear(servicio.guardar_como_tema(base, USUARIO, nombre, AHORA_MS))
}

#[test]
fn ca_he_03_hu02_ca01() {
    // HE-03-HU02-CA01 · Crea el tema con la vista previa, lo deja en edición y no cambia el escritorio ni el tema
    // del que se partió (ET06 a ET08).
    let (base, servicio) = con_temas();
    let aplicado = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    let r = guardar_como(&servicio, &base, "  Otoño  ").unwrap();
    assert_eq!(r.mensaje.message, "Tema “Otoño” guardado.");
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.theme_id, r.valor.theme_id);
    assert_eq!(vista.name, "Otoño");
    assert!(!vista.dirty);
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert_eq!(temas.len(), 3);
    let nuevo = temas.iter().find(|t| t.id == r.valor.theme_id).unwrap();
    assert!(!nuevo.is_applied);
    let (_, contenido) = bloquear(ServicioDePersonalizacion::guardado(
        &base,
        USUARIO,
        &r.valor.theme_id.0,
    ))
    .unwrap()
    .unwrap();
    assert_eq!(contenido.colors.primary, Hex("#112233".into()));
    let (_, partida) = bloquear(ServicioDePersonalizacion::guardado(&base, USUARIO, MI_TEMA))
        .unwrap()
        .unwrap();
    assert_eq!(partida.colors.primary, Hex("#96B2B2".into()));
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .content,
        aplicado.content
    );
    // Queda encolado para sincronizar.
    let pendientes: i64 = bloquear(async {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM pending_change WHERE entity_kind = 'theme' AND entity_id = ?",
        )
        .bind(&r.valor.theme_id.0)
        .fetch_one(base.pool().await.unwrap())
        .await
        .unwrap()
    });
    assert_eq!(pendientes, 1);
}

#[test]
fn ca_he_03_hu02_ca02() {
    // HE-03-HU02-CA02 · Un nombre vacío o con solo espacios no guarda (ET02, ET10).
    let (base, servicio) = con_temas();
    for nombre in ["", "   "] {
        let e = guardar_como(&servicio, &base, nombre).err().unwrap();
        assert_eq!(e.code, ErrorCode::NameRequired);
    }
    assert_eq!(bloquear(servicio.temas(&base, USUARIO)).unwrap().len(), 2);
}

#[test]
fn ca_he_03_hu02_ca03() {
    // HE-03-HU02-CA03 · Más de 40 caracteres: mensaje en el campo Nombre y no guarda (ET02, ET09); 40 sí.
    let (base, servicio) = con_temas();
    let e = guardar_como(&servicio, &base, &"á".repeat(41))
        .err()
        .unwrap();
    assert_eq!(e.code, ErrorCode::NameTooLong);
    assert_eq!(e.message, "El nombre no puede superar los 40 caracteres.");
    assert_eq!(e.field.as_deref(), Some("name"));
    // Con otro color, para que el tema nuevo no sea igual a «Mi tema» (HE-03-HU02-ET13).
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    assert!(guardar_como(&servicio, &base, &"á".repeat(40)).is_ok());
}

#[test]
fn ca_he_03_hu02_ca04() {
    // HE-03-HU02-CA04 · El nombre de otro tema, con otras mayúsculas o espacios, no se repite (ET04).
    let (base, servicio) = con_temas();
    let e = guardar_como(&servicio, &base, "  VERANO ").err().unwrap();
    assert_eq!(e.code, ErrorCode::NameDuplicate);
    assert_eq!(e.message, "Ya existe un tema con ese nombre. Elige otro.");
    assert_eq!(e.field.as_deref(), Some("name"));
}

#[test]
fn ca_he_03_hu02_ca05() {
    // HE-03-HU02-CA05 · Con 10 temas guardados no se crea otro (ET05, ET11).
    let (base, servicio) = con_temas();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        for i in 0..8 {
            sqlx::query(
                "INSERT INTO theme (id, user_id, created_at, name, template_id, color_primary, color_secondary, \
                 color_text, font_id, last_modified_at) VALUES (?, ?, ?, ?, 'default', '#96B2B2', '#829890', '#14201C', 'nunito', ?)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(USUARIO)
            .bind(T)
            .bind(format!("Tema {i}"))
            .bind(T)
            .execute(pool)
            .await
            .unwrap();
        }
    });
    let e = guardar_como(&servicio, &base, "Otoño").err().unwrap();
    assert_eq!(e.code, ErrorCode::ThemeLimitReached);
    assert_eq!(
        e.message,
        "Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro."
    );
    assert_eq!(bloquear(servicio.temas(&base, USUARIO)).unwrap().len(), 10);
}

#[test]
fn ca_he_03_hu02_ca01_con_widgets() {
    // HE-03-HU02-ET06 · El tema nuevo lleva los widgets activos y la distribución del tema del que se partió.
    let (base, servicio) = super::pruebas_de_widgets::con_widgets_por_defecto();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    let r = guardar_como(&servicio, &base, "Otoño").unwrap();
    let contar = |tema: &str| -> Vec<(String, i64, i64, i64, i64)> {
        bloquear(async {
            sqlx::query_as(
                "SELECT widget_id, x, y, width, height FROM theme_widget WHERE theme_id = ? ORDER BY widget_id",
            )
            .bind(tema)
            .fetch_all(base.pool().await.unwrap())
            .await
            .unwrap()
        })
    };
    let originales = contar(MI_TEMA);
    assert_eq!(originales.len(), 4);
    assert_eq!(contar(&r.valor.theme_id.0), originales);
}

#[test]
fn ca_he_03_hu02_ca08() {
    // HE-03-HU02-CA08 · La vista previa con el mismo contenido que «Verano» (plantilla, fondo, colores, paleta,
    // fuente y tamaño) no se guarda como tema nuevo; el mensaje va en el campo Nombre (ET13, ET14).
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#DCBA04"))).unwrap();
    let e = guardar_como(&servicio, &base, "Otoño").err().unwrap();
    assert_eq!(e.code, ErrorCode::ThemeContentDuplicate);
    assert_eq!(
        e.message,
        "Ya tienes el tema “Verano” con estas mismas propiedades."
    );
    assert_eq!(e.field.as_deref(), Some("name"));
    assert_eq!(bloquear(servicio.temas(&base, USUARIO)).unwrap().len(), 2);
    // ET13: el orden de revisión es nombre, máximo de 10 temas y contenido igual.
    let e = guardar_como(&servicio, &base, "verano").err().unwrap();
    assert_eq!(e.code, ErrorCode::NameDuplicate);
    // Con un color distinto sí se guarda.
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#DCBA05"))).unwrap();
    assert!(guardar_como(&servicio, &base, "Otoño").is_ok());
}
