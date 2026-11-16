//! IPC-THEME-07 `theme_draft_save` (HE-02-HU11): guardar en el tema en edición los cambios de la vista previa
//! sin llevarlos al escritorio.

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::{ConMensaje, instante};
use crate::servicio_del_planificador::{campos, resultado};
use crate::tipos::ThemeDraftSaveResult;

fn origen_a_texto(origen: &BackgroundSource) -> &'static str {
    match origen {
        BackgroundSource::TemplateDefault => "template_default",
        BackgroundSource::Catalog => "catalog",
        BackgroundSource::Own => "own",
    }
}

fn tamano_a_texto(tamano: &FontSize) -> &'static str {
    match tamano {
        FontSize::Small => "small",
        FontSize::Medium => "medium",
        FontSize::Large => "large",
    }
}

/// Las columnas del tema que guarda un `ThemeContent`, con el nombre de su columna (D-189, `datos.md`).
fn columnas(contenido: &ThemeContent) -> Vec<(&'static str, Value)> {
    vec![
        ("template_id", Value::from(contenido.template_id.as_str())),
        (
            "background_source",
            Value::from(origen_a_texto(&contenido.background.source)),
        ),
        (
            "background_catalog_image_id",
            Value::from(contenido.background.catalog_image_id.clone()),
        ),
        (
            "background_uploaded_image_id",
            Value::from(
                contenido
                    .background
                    .uploaded_image_id
                    .as_ref()
                    .map(|id| id.0.clone()),
            ),
        ),
        (
            "color_primary",
            Value::from(contenido.colors.primary.0.to_uppercase()),
        ),
        (
            "color_secondary",
            Value::from(contenido.colors.secondary.0.to_uppercase()),
        ),
        (
            "color_text",
            Value::from(contenido.colors.text.0.to_uppercase()),
        ),
        ("palette_id", Value::from(contenido.palette_id.clone())),
        ("font_id", Value::from(contenido.font.id.as_str())),
        (
            "font_size",
            Value::from(tamano_a_texto(&contenido.font.size)),
        ),
    ]
}

impl ServicioDePersonalizacion {
    /// Guarda el borrador en su tema; el escritorio, la copia aplicada y la aplicación no cambian (ET02, ET03,
    /// ET05). Sin cambios responde `draft.no_changes` (CA03). El tema inicial virtual se crea al guardar.
    pub async fn guardar_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ahora_ms: i64,
    ) -> Result<ConMensaje<ThemeDraftSaveResult>, AppError> {
        self.abrir_borrador(base, user_id, None).await?;
        let borrador = self.con_borrador(|b| b.clone()).ok_or_else(inesperado)?;
        if !borrador.dirty() {
            return Err(error(
                ErrorCode::DraftNoChanges,
                messages::SIN_CAMBIOS_PARA_GUARDAR,
                None,
            ));
        }
        for (campo, color) in [
            ("colors.primary", &borrador.contenido.colors.primary),
            ("colors.secondary", &borrador.contenido.colors.secondary),
            ("colors.text", &borrador.contenido.colors.text),
        ] {
            if color.0.trim().is_empty() {
                return Err(error(
                    ErrorCode::ColorRequired,
                    messages::CAMPO_OBLIGATORIO,
                    Some(campo),
                ));
            }
        }

        let pool = base.pool().await.map_err(de_sqlx)?;
        let ahora = instante(ahora_ms).0;
        let es_nuevo = borrador.theme_id == TEMA_INICIAL_VIRTUAL;
        let id = if es_nuevo {
            uuid::Uuid::new_v4().to_string()
        } else {
            borrador.theme_id.clone()
        };
        let nuevas = columnas(&borrador.contenido);
        let viejas = columnas(&borrador.guardado);
        let cambiadas: Vec<(&'static str, Value)> = if es_nuevo {
            nuevas
        } else {
            nuevas
                .into_iter()
                .zip(viejas)
                .filter(|(n, v)| n.1 != v.1)
                .map(|(n, _)| n)
                .collect()
        };
        let mut valores = cambiadas.clone();
        valores.push(("last_modified_at", Value::from(ahora.as_str())));
        let mut con_nombre = valores.clone();
        if es_nuevo {
            con_nombre.push(("name", Value::from(borrador.name.as_str())));
        }
        let (fields, mods) = campos(
            &con_nombre
                .iter()
                .map(|(c, v)| (*c, v.clone()))
                .collect::<Vec<_>>(),
            &ahora,
        );

        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        if es_nuevo {
            let mut columnas_sql = vec!["id", "user_id", "created_at", "field_mods", "name"];
            columnas_sql.extend(valores.iter().map(|(c, _)| *c));
            let marcas = vec!["?"; columnas_sql.len()].join(", ");
            let sql = format!(
                "INSERT INTO theme ({}) VALUES ({marcas})",
                columnas_sql.join(", ")
            );
            let mut consulta = sqlx::query(&sql)
                .bind(&id)
                .bind(user_id)
                .bind(&ahora)
                .bind(mods.to_string())
                .bind(&borrador.name);
            for (_, valor) in &valores {
                consulta = consulta.bind(valor.as_str().map(str::to_string));
            }
            consulta.execute(&mut *tx).await.map_err(de_sqlx)?;
        } else {
            let asignaciones = valores
                .iter()
                .map(|(c, _)| format!("{c} = ?"))
                .collect::<Vec<_>>()
                .join(", ");
            let sql = format!(
                "UPDATE theme SET {asignaciones}, field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?"
            );
            let mut consulta = sqlx::query(&sql);
            for (_, valor) in &valores {
                consulta = consulta.bind(valor.as_str().map(str::to_string));
            }
            consulta
                .bind(mods.to_string())
                .bind(&id)
                .bind(user_id)
                .execute(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        }
        encolar_cambio(&mut tx, "theme", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;

        let es_aplicado = Self::aplicado(base, user_id)
            .await?
            .is_some_and(|(aplicado, _)| aplicado == id);
        self.con_borrador(|b| {
            if let Some(actual) = b {
                actual.theme_id.clone_from(&id);
                actual.guardado = actual.contenido.clone();
            }
        });
        let mensaje = if es_aplicado {
            messages::CAMBIOS_GUARDADOS_EN_EL_TEMA_APLICADO.to_string()
        } else {
            messages::cambios_guardados_en_el_tema(&borrador.name)
        };
        Ok(ConMensaje {
            valor: ThemeDraftSaveResult {
                theme_id: Uuid(id),
                is_applied: es_aplicado,
            },
            mensaje: resultado("theme_draft_save", &mensaje),
        })
    }
}
