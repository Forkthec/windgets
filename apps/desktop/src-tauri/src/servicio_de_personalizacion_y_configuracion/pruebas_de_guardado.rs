//! Pruebas del Núcleo de HE-02-HU11 (guardar en el tema en edición los cambios de la vista previa).

use super::pruebas_de_plantillas::{cambio, con_otra_plantilla};
use super::pruebas_del_tema_en_edicion::{MI_TEMA, OTRO_TEMA, editar_un_color};
use super::*;
use crate::servicio_de_sesion::ConMensaje;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::ThemeDraftSaveResult;

const AHORA_MS: i64 = 1_793_600_000_000;

fn guardar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
) -> Result<ConMensaje<ThemeDraftSaveResult>, AppError> {
    bloquear(servicio.guardar_borrador(base, USUARIO, AHORA_MS))
}

fn primario_guardado(base: &BaseLocal, id: &str) -> String {
    bloquear(async {
        sqlx::query_scalar("SELECT color_primary FROM theme WHERE id = ?")
            .bind(id)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

fn campos_pendientes(base: &BaseLocal, id: &str) -> serde_json::Value {
    let texto: String = bloquear(async {
        sqlx::query_scalar(
            "SELECT fields FROM pending_change WHERE entity_kind = 'theme' AND entity_id = ?",
        )
        .bind(id)
        .fetch_one(base.pool().await.unwrap())
        .await
        .unwrap()
    });
    serde_json::from_str(&texto).unwrap()
}

#[test]
fn ca_he_02_hu11_ca01() {
    // HE-02-HU11-CA01 · Guardar en un tema que no es el aplicado: conserva los cambios y no toca el escritorio (ET01, ET02).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    editar_un_color(&servicio);
    let resultado = guardar(&servicio, &base).unwrap();
    assert_eq!(
        resultado.mensaje.message,
        "Cambios guardados en el tema “Verano”."
    );
    assert_eq!(resultado.valor.theme_id.0, OTRO_TEMA);
    assert!(!resultado.valor.is_applied);
    // El tema guardado trae el cambio y no se creó otro tema (ET01).
    assert_eq!(primario_guardado(&base, OTRO_TEMA), "#112233");
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert_eq!(temas.len(), 2);
    // Solo viaja lo que cambió, más la hora de modificación.
    let campos = campos_pendientes(&base, OTRO_TEMA);
    let mut claves: Vec<_> = campos.as_object().unwrap().keys().cloned().collect();
    claves.sort();
    assert_eq!(claves, ["color_primary", "last_modified_at"]);
    // El borrador queda sin cambios y el escritorio (la copia aplicada) sigue en «Mi tema».
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(!vista.dirty);
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.0, MI_TEMA);
    assert_eq!(aplicado.1.colors.primary.0, "#96B2B2");
}

#[test]
fn ca_he_02_hu11_ca02() {
    // HE-02-HU11-CA02 · Guardar en el tema aplicado: queda «Cambios sin aplicar» y el escritorio no cambia (ET03).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    let resultado = guardar(&servicio, &base).unwrap();
    assert_eq!(
        resultado.mensaje.message,
        "Cambios guardados. Selecciona Aplicar para verlos en tu escritorio."
    );
    assert!(resultado.valor.is_applied);
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let mi_tema = temas.iter().find(|t| t.id.0 == MI_TEMA).unwrap();
    assert!(mi_tema.has_unapplied_changes);
    assert!(!mi_tema.has_unsaved_changes);
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.1.colors.primary.0, "#96B2B2");
}

#[test]
fn ca_he_02_hu11_ca03() {
    // HE-02-HU11-CA03 · Sin cambios no hay nada que guardar (ET04) y no se escribe nada.
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    let error = guardar(&servicio, &base).unwrap_err();
    assert_eq!(error.code, ErrorCode::DraftNoChanges);
    assert_eq!(error.message, "No hay cambios para guardar.");
    let pendientes: i64 = bloquear(async {
        sqlx::query_scalar("SELECT COUNT(*) FROM pending_change")
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    });
    assert_eq!(pendientes, 0);
}

#[test]
fn ca_he_02_hu11_ca04() {
    // HE-02-HU11-CA04 · Guardar la plantilla sin aplicarla: el tema la conserva y el escritorio sigue con la anterior.
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &cambio("minimal"))).unwrap();
    guardar(&servicio, &base).unwrap();
    let guardado = bloquear(ServicioDePersonalizacion::guardado(&base, USUARIO, MI_TEMA))
        .unwrap()
        .unwrap();
    assert_eq!(guardado.1.template_id, "minimal");
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.1.template_id, "default");
}

#[test]
fn ca_he_02_hu11_ca05() {
    // HE-02-HU11-CA05 · Reiniciar sin aplicar: lo que el escritorio lee al abrir la aplicación es la copia
    // aplicada, que guardar no toca (ET05). Un servicio nuevo, sin borrador en memoria, lo confirma.
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    guardar(&servicio, &base).unwrap();
    let tras_reiniciar = ServicioDePersonalizacion::nuevo();
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.1.colors.primary.0, "#96B2B2");
    // La pantalla sí muestra lo guardado al volver a abrirla.
    let vista = bloquear(tras_reiniciar.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.content.colors.primary.0, "#112233");
}

#[test]
fn guardar_el_tema_inicial_virtual_lo_crea() {
    // DUDA HE-02-HU11: el tema inicial virtual (sin temas locales) se crea con un id nuevo al guardar.
    let (base, servicio) = con_otra_plantilla();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query("DELETE FROM applied_theme")
            .execute(pool)
            .await
            .unwrap();
        sqlx::query("DELETE FROM theme")
            .execute(pool)
            .await
            .unwrap();
    });
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.name, "Mi tema");
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &cambio("minimal"))).unwrap();
    let resultado = guardar(&servicio, &base).unwrap();
    assert_ne!(resultado.valor.theme_id.0, "mi-tema-inicial");
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert_eq!(temas.len(), 1);
    assert_eq!(temas[0].name, "Mi tema");
}
