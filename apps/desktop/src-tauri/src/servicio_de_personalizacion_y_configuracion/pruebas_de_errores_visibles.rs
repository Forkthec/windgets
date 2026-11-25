//! Pruebas del Núcleo de los errores visibles de la personalización (docs/rediseno.md RD-86 y RD-87): lo que se puede
//! prever llega con su código y su texto, nunca como `internal.unexpected`.

use super::agregar::Configuracion;
use super::pruebas_de_colores::primario;
use super::pruebas_de_widgets::{CLIMA, con_widgets_agregados};
use super::pruebas_del_tema_en_edicion::{OTRO_TEMA, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::ApplyMode;

const AHORA_MS: i64 = 1_793_600_000_000;

/// «Verano» se eliminó en otro computador y la descarga ya lo quitó de la base local.
fn eliminar_en_otro_computador(base: &BaseLocal) {
    bloquear(async {
        sqlx::query("DELETE FROM theme WHERE id = ?")
            .bind(OTRO_TEMA)
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
}

fn ya_no_existe<T>(r: Result<T, AppError>) {
    let e = r.err().expect("debe fallar");
    assert_eq!(
        (e.code, e.message.as_str(), e.field),
        (ErrorCode::ThemeNotFound, "Este tema ya no existe.", None)
    );
}

fn cuantos(base: &BaseLocal, sql: &str) -> i64 {
    bloquear(async {
        sqlx::query_scalar(sql)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn rd_86_aplicar_renombrar_eliminar_y_elegir_un_tema_eliminado_lo_dicen() {
    let (base, servicio) = con_temas();
    eliminar_en_otro_computador(&base);
    ya_no_existe(bloquear(
        servicio.aplicar_tema(&base, USUARIO, OTRO_TEMA, false, AHORA_MS),
    ));
    ya_no_existe(bloquear(
        servicio.renombrar_tema(&base, USUARIO, OTRO_TEMA, "Playa", AHORA_MS),
    ));
    ya_no_existe(bloquear(
        servicio.eliminar_tema(&base, USUARIO, OTRO_TEMA, AHORA_MS),
    ));
    ya_no_existe(bloquear(
        servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, false),
    ));
    assert_eq!(cuantos(&base, "SELECT count(*) FROM pending_change"), 0);
}

#[test]
fn rd_86_elegir_un_tema_eliminado_no_pregunta_antes_por_los_cambios_ni_los_pierde() {
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    eliminar_en_otro_computador(&base);
    ya_no_existe(bloquear(
        servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, false),
    ));
    let borrador = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(borrador.dirty);
    assert_eq!(borrador.content.colors.primary, Hex("#112233".into()));
}

#[test]
fn rd_86_guardar_y_aplicar_la_vista_previa_de_un_tema_eliminado_lo_dicen_y_conservan_los_cambios() {
    let (base, servicio) = con_temas();
    bloquear(servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, false)).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    eliminar_en_otro_computador(&base);
    ya_no_existe(bloquear(
        servicio.guardar_borrador(&base, USUARIO, AHORA_MS),
    ));
    for modo in [
        ApplyMode::Apply,
        ApplyMode::SaveAndApply,
        ApplyMode::ApplyWithoutSaving,
    ] {
        ya_no_existe(bloquear(
            servicio.aplicar_borrador(&base, USUARIO, &modo, AHORA_MS),
        ));
    }
    assert_eq!(cuantos(&base, "SELECT count(*) FROM pending_change"), 0);
    let borrador = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(borrador.content.colors.primary, Hex("#112233".into()));
    // La salida: «Guardar como tema» crea uno nuevo con la vista previa.
    bloquear(servicio.guardar_como_tema(&base, USUARIO, "Playa", AHORA_MS)).unwrap();
}

#[test]
fn rd_87_elegir_una_paleta_desactivada_lo_dice_y_no_cambia_la_vista_previa() {
    let (base, servicio) = con_temas();
    bloquear(async {
        sqlx::query(
            "INSERT INTO catalog_palette (id, name, color_primary, color_secondary, color_text, is_active, fetched_at) \
             VALUES ('oceano', 'Océano', '#0B3954', '#087E8B', '#F5F5F5', 0, '2026-11-01T00:00:00.000Z')",
        )
        .execute(base.pool().await.unwrap())
        .await
        .unwrap();
    });
    let antes = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    let parche = ThemeDraftPatch {
        template_id: None,
        background: None,
        colors: None,
        palette_id: Some(Some("oceano".into())),
        font_id: None,
        font_size: None,
    };
    let e = bloquear(servicio.actualizar_borrador(&base, USUARIO, &parche))
        .err()
        .expect("debe fallar");
    assert_eq!(
        (e.code, e.message.as_str(), e.field),
        (
            ErrorCode::PaletteNotFound,
            "Esta paleta ya no está disponible. Elige otra.",
            None
        )
    );
    let despues = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(
        (despues.dirty, despues.content.colors),
        (false, antes.content.colors)
    );
}

#[test]
fn rd_92_activar_configurar_y_eliminar_un_widget_eliminado_dice_que_ya_no_existe() {
    let (base, servicio) = con_widgets_agregados();
    bloquear(servicio.eliminar_widget(&base, USUARIO, CLIMA, AHORA_MS)).unwrap();
    let antes = cuantos(&base, "SELECT count(*) FROM pending_change");
    let ya_no_existe = |e: AppError| {
        assert_eq!(
            (e.code, e.message.as_str(), e.field),
            (ErrorCode::WidgetNotFound, "Este widget ya no existe.", None)
        )
    };
    ya_no_existe(
        bloquear(servicio.activar_widget(&base, USUARIO, CLIMA, false, AHORA_MS)).unwrap_err(),
    );
    ya_no_existe(
        bloquear(servicio.configurar_widget(
            &base,
            USUARIO,
            CLIMA,
            Configuracion::Texto("Hola"),
            AHORA_MS,
        ))
        .unwrap_err(),
    );
    ya_no_existe(bloquear(servicio.eliminar_widget(&base, USUARIO, CLIMA, AHORA_MS)).unwrap_err());
    assert_eq!(cuantos(&base, "SELECT count(*) FROM pending_change"), antes);
}
