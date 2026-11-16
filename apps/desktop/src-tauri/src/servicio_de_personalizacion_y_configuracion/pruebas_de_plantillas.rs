//! Pruebas del Núcleo de HE-02-HU02 (seleccionar una plantilla del catálogo de plantillas).

use super::pruebas_del_tema_en_edicion::{T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

fn con_otra_plantilla() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_temas();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query(
            "INSERT INTO catalog_template (id, name, thumbnail_path, bundle_path, default_background_path, \
             default_color_primary, default_color_secondary, default_color_text, default_font_id, sort_order, fetched_at) \
             VALUES ('minimal', 'Minimal', 'templates/minimal/thumbnail.png', 'templates/minimal/', 'm.jpg', \
             '#111111', '#222222', '#FFFFFF', 'nunito', 2, ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
    });
    (base, servicio)
}

fn cambio(plantilla: &str) -> ThemeDraftPatch {
    ThemeDraftPatch {
        template_id: Some(plantilla.to_string()),
        background: None,
        colors: None,
        palette_id: None,
        font_id: None,
        font_size: None,
    }
}

#[test]
fn ca_he_02_hu02_ca01() {
    // HE-02-HU02-CA01 · El catálogo trae el id, el nombre y la miniatura de cada plantilla (ET01); solo el
    // catálogo del equipo (ET03, ET04): no hay comando para crear plantillas ni subir archivos (ET05).
    let (base, servicio) = con_otra_plantilla();
    let plantillas = bloquear(servicio.plantillas(&base)).unwrap();
    let datos: Vec<_> = plantillas
        .iter()
        .map(|p| (p.id.as_str(), p.name.as_str(), p.thumbnail_url.as_str()))
        .collect();
    assert_eq!(
        datos,
        [
            ("default", "Windgets", "t"),
            ("minimal", "Minimal", "templates/minimal/thumbnail.png"),
        ]
    );
    // La plantilla del tema en edición, para la etiqueta «Seleccionada» (ET02).
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.content.template_id, "default");
}

#[test]
fn ca_he_02_hu02_ca02() {
    // HE-02-HU02-CA02 · Otra plantilla: cambia la vista previa y se conservan el fondo, los colores y la
    // tipografía (ET06); el escritorio y lo guardado no cambian (ET07).
    let (base, servicio) = con_otra_plantilla();
    let antes = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    let vista = bloquear(servicio.actualizar_borrador(&base, USUARIO, &cambio("minimal"))).unwrap();
    assert_eq!(vista.content.template_id, "minimal");
    assert_eq!(vista.content.background, antes.content.background);
    assert_eq!(vista.content.colors, antes.content.colors);
    assert_eq!(vista.content.font, antes.content.font);
    assert!(vista.dirty, "el cambio queda sin guardar");
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.1.template_id, "default");
    let guardado = bloquear(ServicioDePersonalizacion::guardado(
        &base,
        USUARIO,
        &antes.theme_id.0,
    ))
    .unwrap()
    .unwrap();
    assert_eq!(guardado.1.template_id, "default");
}

#[test]
fn una_plantilla_que_no_existe_responde_template_not_found() {
    // IPC-THEME-05: `template.not_found`, sin texto y sin tocar el borrador.
    let (base, servicio) = con_otra_plantilla();
    let error =
        bloquear(servicio.actualizar_borrador(&base, USUARIO, &cambio("no-existe"))).unwrap_err();
    assert_eq!(error.code, ErrorCode::TemplateNotFound);
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.content.template_id, "default");
    assert!(!vista.dirty);
}
