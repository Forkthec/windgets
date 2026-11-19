//! IPC-THEME-14 `theme_delete` (HE-03-HU05): eliminar un tema guardado.

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::{ConMensaje, instante};

impl ServicioDePersonalizacion {
    /// Elimina el tema y sus widgets (`theme_widget`) de forma definitiva, sin cambiar el escritorio (ET02), y encola
    /// las eliminaciones para sincronizar. El tema aplicado no se elimina (ET03, ET05; D-037). Msg: «Tema eliminado.»
    pub async fn eliminar_tema(
        &self,
        base: &BaseLocal,
        user_id: &str,
        theme_id: &str,
        ahora_ms: i64,
    ) -> Result<ConMensaje<()>, AppError> {
        let id = theme_id.to_lowercase();
        if Self::aplicado(base, user_id)
            .await?
            .is_some_and(|(a, _)| a.to_lowercase() == id)
        {
            return Err(error(
                ErrorCode::ThemeAppliedNotDeletable,
                messages::TEMA_APLICADO_NO_SE_ELIMINA,
                None,
            ));
        }
        let pool = base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let widgets: Vec<String> =
            sqlx::query_scalar("SELECT id FROM theme_widget WHERE theme_id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        let borrados = sqlx::query("DELETE FROM theme WHERE id = ? AND user_id = ?")
            .bind(&id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?
            .rows_affected();
        // Sin texto: la vista solo ofrece «Eliminar» en temas que existen.
        if borrados == 0 {
            return Err(inesperado());
        }
        let ahora = instante(ahora_ms).0;
        // Los widgets del tema se borran en cascada (sqlite_esquema.sql).
        for widget in &widgets {
            encolar_cambio(
                &mut tx,
                "theme_widget",
                widget,
                "delete",
                &Value::Null,
                &ahora,
            )
            .await
            .map_err(de_sqlx)?;
        }
        encolar_cambio(&mut tx, "theme", &id, "delete", &Value::Null, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        // Si era el tema en edición, la vista previa vuelve a abrirse con el tema aplicado.
        self.con_borrador(|b| {
            if b.as_ref()
                .is_some_and(|actual| actual.theme_id.to_lowercase() == id)
            {
                *b = None;
            }
        });
        Ok(ConMensaje {
            valor: (),
            mensaje: resultado("theme_delete", messages::TEMA_ELIMINADO),
        })
    }
}
