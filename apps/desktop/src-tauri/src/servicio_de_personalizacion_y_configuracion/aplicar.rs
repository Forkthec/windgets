//! IPC-THEME-09 `theme_draft_apply` (HE-02-HU12): aplicar al escritorio los cambios de la vista previa.
//! Escribe la copia aplicada (`applied_theme`), la encola en `pending_change` y deja que el puente avise al
//! escritorio y a la aplicación (EV-11 y EV-16; RNF-01).

use serde_json::Value;

use super::guardado::{columnas, datos_descargados, validar_colores};
use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::{ConMensaje, instante};
use crate::servicio_del_planificador::{campos, resultado};
use crate::tipos::{ApplyMode, ThemeIdResult};

impl ServicioDePersonalizacion {
    /// Aplica el borrador según el modo (CA01 a CA04):
    /// - `apply`: con cambios sin guardar responde `draft.unsaved_changes_on_apply` para que la vista abra M-15
    ///   (CA02, ET02); si el tema ya es el aplicado y no tiene cambios, `theme.already_applied` (CA06, ET06).
    /// - `save_and_apply`: guarda los cambios en el tema y lo aplica (CA03).
    /// - `apply_without_saving`: aplica la vista previa sin tocar el tema guardado y lo marca con «Cambios sin
    ///   guardar» (CA04, ET04).
    pub async fn aplicar_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
        modo: &ApplyMode,
        ahora_ms: i64,
    ) -> Result<ConMensaje<ThemeIdResult>, AppError> {
        self.abrir_borrador(base, user_id, None).await?;
        let mut borrador = self.con_borrador(|b| b.clone()).ok_or_else(inesperado)?;
        Self::comprobar_que_existe(base, user_id, &borrador.theme_id).await?;
        validar_colores(&borrador.contenido)?;

        let mensaje = match modo {
            ApplyMode::Apply => {
                if borrador.dirty() {
                    return Err(error(
                        ErrorCode::DraftUnsavedChangesOnApply,
                        &messages::con_nombre_del_tema(
                            messages::CAMBIOS_SIN_GUARDAR_AL_APLICAR,
                            &borrador.name,
                        ),
                        None,
                    ));
                }
                let ya_aplicado =
                    Self::aplicado(base, user_id)
                        .await?
                        .is_some_and(|(id, copia)| {
                            id == borrador.theme_id
                                && !borrador.aplicado_sin_guardar
                                && es_la_misma_copia(&copia, &borrador.contenido)
                        });
                if ya_aplicado {
                    return Err(error(
                        ErrorCode::ThemeAlreadyApplied,
                        messages::TEMA_YA_APLICADO,
                        None,
                    ));
                }
                messages::con_nombre_del_tema(messages::TEMA_APLICADO, &borrador.name)
            }
            ApplyMode::SaveAndApply => {
                messages::con_nombre_del_tema(messages::TEMA_GUARDADO_Y_APLICADO, &borrador.name)
            }
            ApplyMode::ApplyWithoutSaving => messages::CAMBIOS_APLICADOS_SIN_GUARDAR.to_string(),
        };

        // La copia aplicada apunta a un tema real (`applied_theme.theme_id`). DUDA: HE-02-HU12 el tema inicial
        // virtual se crea primero con lo último guardado, sin los cambios de la vista previa.
        if borrador.theme_id == TEMA_INICIAL_VIRTUAL {
            let solo_lo_guardado = Borrador {
                contenido: borrador.guardado.clone(),
                ..borrador.clone()
            };
            let id = self
                .escribir_en_el_tema(base, user_id, ahora_ms, &solo_lo_guardado)
                .await?;
            let (guardado, contenido) = (borrador.guardado.clone(), borrador.contenido.clone());
            self.con_borrador(|b| {
                if let Some(actual) = b {
                    actual.theme_id.clone_from(&id);
                    actual.guardado = guardado;
                    actual.contenido = contenido;
                }
            });
            borrador.theme_id = id;
        }
        if matches!(modo, ApplyMode::SaveAndApply) && borrador.dirty() {
            self.escribir_en_el_tema(base, user_id, ahora_ms, &borrador)
                .await?;
            borrador.guardado = borrador.contenido.clone();
        }

        self.escribir_la_copia_aplicada(base, user_id, ahora_ms, &borrador)
            .await?;
        let sin_guardar = matches!(modo, ApplyMode::ApplyWithoutSaving);
        self.con_borrador(|b| {
            if let Some(actual) = b {
                actual.aplicado_sin_guardar = sin_guardar;
            }
        });
        Ok(ConMensaje {
            valor: ThemeIdResult {
                theme_id: Uuid(borrador.theme_id),
            },
            mensaje: resultado("theme_draft_apply", &mensaje),
        })
    }

    /// IPC-THEME-12 `theme_apply` (HE-03-HU03): aplica un tema guardado, su última versión guardada, al
    /// escritorio y a la aplicación (ET02, ET06).
    /// - El tema aplicado sin cambios sin aplicar responde `theme.already_applied` (CA03, ET05).
    /// - Con cambios sin guardar en la vista previa responde `draft.unsaved_changes` con el nombre del tema en
    ///   edición, para que la vista abra M-15 (CA05, ET08); con `discard_draft`, esos cambios se descartan.
    pub async fn aplicar_tema(
        &self,
        base: &BaseLocal,
        user_id: &str,
        theme_id: &str,
        descartar_borrador: bool,
        ahora_ms: i64,
    ) -> Result<ConMensaje<ThemeIdResult>, AppError> {
        // RD-86: la lista puede ofrecer todavía un tema que se eliminó en otro computador.
        let (nombre, contenido) = Self::guardado(base, user_id, theme_id)
            .await?
            .ok_or_else(tema_no_existe)?;
        let ya_aplicado = Self::aplicado(base, user_id)
            .await?
            .is_some_and(|(id, copia)| id == theme_id && es_la_misma_copia(&copia, &contenido));
        if ya_aplicado {
            return Err(error(
                ErrorCode::ThemeAlreadyApplied,
                messages::TEMA_YA_APLICADO,
                None,
            ));
        }
        let borrador = self.con_borrador(|b| b.clone());
        if let Some(b) = &borrador
            && b.dirty()
            && !descartar_borrador
        {
            return Err(error(
                ErrorCode::DraftUnsavedChanges,
                &messages::con_nombre_del_tema(messages::CAMBIOS_SIN_GUARDAR_AL_APLICAR, &b.name),
                None,
            ));
        }
        let tema = Borrador {
            theme_id: theme_id.to_string(),
            name: nombre.clone(),
            guardado: contenido.clone(),
            contenido,
            aplicado_sin_guardar: false,
        };
        self.escribir_la_copia_aplicada(base, user_id, ahora_ms, &tema)
            .await?;
        // Lo aplicado ya es lo guardado de un tema; los cambios descartados no se conservan (M-15, «Aplicar sin
        // guardar»).
        self.con_borrador(|b| {
            if descartar_borrador {
                *b = None;
            } else if let Some(actual) = b {
                actual.aplicado_sin_guardar = false;
            }
        });
        Ok(ConMensaje {
            valor: ThemeIdResult {
                theme_id: Uuid(theme_id.to_string()),
            },
            mensaje: resultado(
                "theme_apply",
                &messages::con_nombre_del_tema(messages::TEMA_APLICADO, &nombre),
            ),
        })
    }

    /// Escribe la vista previa del borrador como copia aplicada de la cuenta (una fila por cuenta, `id =
    /// user_id`) y la encola para sincronizarla (D-189). `applied_theme` no guarda la paleta.
    async fn escribir_la_copia_aplicada(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ahora_ms: i64,
        borrador: &Borrador,
    ) -> Result<(), AppError> {
        datos_descargados(base, user_id, &borrador.contenido).await?;
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ahora = instante(ahora_ms).0;
        let mut valores: Vec<(&'static str, Value)> = columnas(&borrador.contenido)
            .into_iter()
            .filter(|(c, _)| *c != "palette_id")
            .collect();
        valores.push(("theme_id", Value::from(borrador.theme_id.as_str())));
        valores.push(("applied_at", Value::from(ahora.as_str())));
        let (fields, mods) = campos(&valores, &ahora);

        let nombres: Vec<&str> = valores.iter().map(|(c, _)| *c).collect();
        let sql = format!(
            "INSERT INTO applied_theme (id, user_id, created_at, field_mods, {}) VALUES (?, ?, ?, ?, {}) \
             ON CONFLICT(id) DO UPDATE SET {}, field_mods = json_patch(applied_theme.field_mods, excluded.field_mods)",
            nombres.join(", "),
            vec!["?"; nombres.len()].join(", "),
            nombres
                .iter()
                .map(|c| format!("{c} = excluded.{c}"))
                .collect::<Vec<_>>()
                .join(", "),
        );
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let mut consulta = sqlx::query(&sql)
            .bind(user_id)
            .bind(user_id)
            .bind(&ahora)
            .bind(mods.to_string());
        for (_, valor) in &valores {
            consulta = consulta.bind(valor.as_str().map(str::to_string));
        }
        consulta.execute(&mut *tx).await.map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "applied_theme", user_id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)
    }
}
