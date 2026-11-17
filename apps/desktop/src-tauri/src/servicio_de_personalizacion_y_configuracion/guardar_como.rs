//! IPC-THEME-08 `theme_draft_save_as` (HE-03-HU02): guardar como tema nuevo los cambios de la vista previa.

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::{ConMensaje, instante};
use crate::servicio_del_planificador::{campos, resultado};
use crate::tipos::ThemeIdResult;

/// Máximo de temas por usuario (HE-03-HU02-ET05; D-035).
pub const TEMAS_MAX: i64 = 10;
/// Largo máximo del nombre de un tema (HE-03-HU02-ET02).
pub const NOMBRE_MAX: usize = 40;

impl ServicioDePersonalizacion {
    /// HE-03-HU02-ET02 a ET05: el nombre, sin los espacios del inicio y del final, es obligatorio, de hasta 40
    /// caracteres y único entre los temas del usuario sin distinguir mayúsculas; como máximo 10 temas.
    async fn validar_nombre_nuevo(
        base: &BaseLocal,
        user_id: &str,
        nombre: &str,
    ) -> Result<(), AppError> {
        if nombre.is_empty() {
            return Err(error(
                ErrorCode::NameRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("name"),
            ));
        }
        if nombre.chars().count() > NOMBRE_MAX {
            return Err(error(
                ErrorCode::NameTooLong,
                messages::NOMBRE_DE_TEMA_MUY_LARGO,
                Some("name"),
            ));
        }
        let pool = base.pool().await.map_err(de_sqlx)?;
        let nombres: Vec<String> = sqlx::query_scalar("SELECT name FROM theme WHERE user_id = ?")
            .bind(user_id)
            .fetch_all(pool)
            .await
            .map_err(de_sqlx)?;
        if nombres.len() as i64 >= TEMAS_MAX {
            return Err(error(
                ErrorCode::ThemeLimitReached,
                messages::MAXIMO_DE_TEMAS,
                None,
            ));
        }
        let buscado = nombre.to_lowercase();
        if nombres.iter().any(|n| n.trim().to_lowercase() == buscado) {
            return Err(error(
                ErrorCode::NameDuplicate,
                messages::TEMA_DUPLICADO,
                Some("name"),
            ));
        }
        Ok(())
    }

    /// Copia los widgets (`theme_widget`) de un tema a otro, con `id` nuevos, y los encola para sincronizar.
    async fn copiar_widgets(
        base: &BaseLocal,
        user_id: &str,
        desde: &str,
        hacia: &str,
        ahora_ms: i64,
    ) -> Result<(), AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ahora = instante(ahora_ms).0;
        let filas = sqlx::query(
            "SELECT widget_id, is_active, x, y, width, height, ref_width, ref_height FROM theme_widget              WHERE user_id = ? AND theme_id = ?",
        )
        .bind(user_id)
        .bind(desde)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        for f in &filas {
            let id = uuid::Uuid::new_v4().to_string();
            let widget: String = f.try_get("widget_id").map_err(de_sqlx)?;
            let numero = |c: &str| f.try_get::<i64, _>(c).map_err(de_sqlx);
            let enteros = [
                ("is_active", numero("is_active")?),
                ("x", numero("x")?),
                ("y", numero("y")?),
                ("width", numero("width")?),
                ("height", numero("height")?),
                ("ref_width", numero("ref_width")?),
                ("ref_height", numero("ref_height")?),
            ];
            let mut valores: Vec<(&str, Value)> = vec![
                ("theme_id", Value::from(hacia)),
                ("widget_id", Value::from(widget.as_str())),
            ];
            valores.extend(enteros.iter().map(|(c, v)| {
                let valor = if *c == "is_active" {
                    Value::from(*v == 1)
                } else {
                    Value::from(*v)
                };
                (*c, valor)
            }));
            let (fields, mods) = campos(&valores, &ahora);
            sqlx::query(
                "INSERT INTO theme_widget (id, user_id, created_at, field_mods, theme_id, widget_id, is_active,                  x, y, width, height, ref_width, ref_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id)
            .bind(user_id)
            .bind(&ahora)
            .bind(mods.to_string())
            .bind(hacia)
            .bind(&widget)
            .bind(enteros[0].1)
            .bind(enteros[1].1)
            .bind(enteros[2].1)
            .bind(enteros[3].1)
            .bind(enteros[4].1)
            .bind(enteros[5].1)
            .bind(enteros[6].1)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            encolar_cambio(&mut tx, "theme_widget", &id, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        tx.commit().await.map_err(de_sqlx)?;
        Ok(())
    }

    /// Crea un tema nuevo con la vista previa y lo deja como tema en edición, sin cambios sin guardar; el escritorio
    /// y el tema del que se partió no cambian (ET06 a ET08). Msg: «Tema “<nombre del tema>” guardado.» (CA01).
    pub async fn guardar_como_tema(
        &self,
        base: &BaseLocal,
        user_id: &str,
        nombre: &str,
        ahora_ms: i64,
    ) -> Result<ConMensaje<ThemeIdResult>, AppError> {
        let nombre = nombre.trim();
        Self::validar_nombre_nuevo(base, user_id, nombre).await?;
        self.abrir_borrador(base, user_id, None).await?;
        let actual = self.con_borrador(|b| b.clone()).ok_or_else(inesperado)?;
        guardado::validar_colores(&actual.contenido)?;
        let nuevo = Borrador {
            theme_id: TEMA_INICIAL_VIRTUAL.to_string(),
            name: nombre.to_string(),
            guardado: actual.contenido.clone(),
            contenido: actual.contenido.clone(),
            aplicado_sin_guardar: false,
        };
        let id = self
            .escribir_en_el_tema(base, user_id, ahora_ms, &nuevo)
            .await?;
        // ET06: el tema guarda también los widgets activos y su distribución, los del tema del que se partió.
        if actual.theme_id != TEMA_INICIAL_VIRTUAL {
            Self::copiar_widgets(base, user_id, &actual.theme_id, &id, ahora_ms).await?;
        }
        self.con_borrador(|b| {
            if let Some(borrador) = b {
                borrador.name = nombre.to_string();
            }
        });
        Ok(ConMensaje {
            valor: ThemeIdResult { theme_id: Uuid(id) },
            mensaje: resultado(
                "theme_draft_save_as",
                &messages::con_nombre_del_tema(messages::TEMA_GUARDADO, nombre),
            ),
        })
    }
}
