//! IPC-THEME-13 `theme_rename` (HE-03-HU04): renombrar un tema guardado.

use serde_json::Value;

use super::guardar_como::NOMBRE_MAX;
use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::{ConMensaje, instante};
use crate::servicio_del_planificador::campos;
use crate::tipos::ThemeSummary;

impl ServicioDePersonalizacion {
    /// Cambia solo el nombre del tema y conserva su contenido y su etiqueta «Aplicado» (ET02). El nombre sigue las
    /// reglas de HE-03-HU02 (ET03): obligatorio, de 1 a 40 caracteres y único sin distinguir mayúsculas, sin contar
    /// el propio tema (ET04, CA06). Msg: «Tema renombrado.» (CA01).
    /// DUDA: HE-03-HU04 no dice si renombrar cambia la fecha de última modificación. Valor usado: no la cambia,
    /// porque el contenido no cambia (ET02).
    pub async fn renombrar_tema(
        &self,
        base: &BaseLocal,
        user_id: &str,
        theme_id: &str,
        nombre: &str,
        ahora_ms: i64,
    ) -> Result<ConMensaje<ThemeSummary>, AppError> {
        let nombre = nombre.trim();
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
        let id = theme_id.to_lowercase();
        let pool = base.pool().await.map_err(de_sqlx)?;
        let otros: Vec<(String, String)> =
            sqlx::query_as("SELECT id, name FROM theme WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(pool)
                .await
                .map_err(de_sqlx)?;
        // RD-86: se eliminó en otro computador.
        if !otros.iter().any(|(i, _)| i.to_lowercase() == id) {
            return Err(tema_no_existe());
        }
        let buscado = nombre.to_lowercase();
        if otros
            .iter()
            .any(|(i, n)| i.to_lowercase() != id && n.trim().to_lowercase() == buscado)
        {
            return Err(error(
                ErrorCode::NameDuplicate,
                messages::TEMA_DUPLICADO,
                Some("name"),
            ));
        }
        let ahora = instante(ahora_ms).0;
        let valores = [("name", Value::from(nombre))];
        let (fields, mods) = campos(&valores, &ahora);
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        sqlx::query(
            "UPDATE theme SET name = ?, field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
        )
        .bind(nombre)
        .bind(mods.to_string())
        .bind(&id)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "theme", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        // El tema en edición muestra el nombre nuevo.
        self.con_borrador(|b| {
            if let Some(borrador) = b
                && borrador.theme_id.to_lowercase() == id
            {
                borrador.name = nombre.to_string();
            }
        });
        let tema = self
            .temas(base, user_id)
            .await?
            .into_iter()
            .find(|t| t.id.0.to_lowercase() == id)
            .ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: tema,
            mensaje: resultado("theme_rename", messages::TEMA_RENOMBRADO),
        })
    }
}
