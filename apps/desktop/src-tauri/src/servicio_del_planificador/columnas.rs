//! Eliminar las columnas creadas (HE-09-HU06; IPC-COL-05, IPC-COL-06).

use super::*;
use crate::tipos::ColumnDeleteInfo;

impl<C: Calendario> ServicioDelPlanificador<C> {
    /// La columna Por hacer (función `todo`) con su nombre actual (ET06).
    async fn por_hacer(&self, user_id: &str) -> Result<(String, String), AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        sqlx::query_as("SELECT id, name FROM kanban_column WHERE user_id = ? AND role = 'todo'")
            .bind(user_id)
            .fetch_optional(pool)
            .await
            .map_err(de_sqlx)?
            .ok_or_else(inesperado)
    }

    /// IPC-COL-05 `column_get_delete_info` (HE-09-HU06): el nombre, cuántas tarjetas tiene y el nombre actual de Por
    /// hacer, para elegir el texto de M-09 o M-13 (CA01, CA03, CA07).
    pub async fn info_para_eliminar_columna(
        &self,
        user_id: &str,
        id: &str,
    ) -> Result<ColumnDeleteInfo, AppError> {
        let id = id.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let nombre: String =
            sqlx::query_scalar("SELECT name FROM kanban_column WHERE id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(|| error(ErrorCode::ColumnNotFound, "", None))?;
        let cantidad: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM card WHERE column_id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(de_sqlx)?;
        let (_, destino) = self.por_hacer(user_id).await?;
        Ok(ColumnDeleteInfo {
            name: nombre,
            card_count: cantidad,
            destination_name: destino,
        })
    }

    /// IPC-COL-06 `column_delete` (HE-09-HU06): las columnas por defecto no se eliminan (ET02). Las tarjetas pasan al
    /// final de Por hacer en su orden (ET05) y la columna se quita del tablero y del widget Kanban (ET07). Devuelve
    /// las tarjetas movidas, para avisar con EV-07. Msg: «Columna eliminada.».
    pub async fn eliminar_columna(
        &self,
        user_id: &str,
        id: &str,
    ) -> Result<ConMensaje<Vec<Uuid>>, AppError> {
        let id = id.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let rol: String =
            sqlx::query_scalar("SELECT role FROM kanban_column WHERE id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(|| error(ErrorCode::ColumnNotFound, "", None))?;
        if rol != "custom" {
            return Err(error(
                ErrorCode::ColumnDefaultNotDeletable,
                messages::COLUMNA_POR_DEFECTO_NO_ELIMINABLE,
                None,
            ));
        }
        let (destino, _) = self.por_hacer(user_id).await?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let ultima: Option<f64> = sqlx::query_scalar(
            "SELECT MAX(position) FROM card WHERE column_id = ? AND user_id = ?",
        )
        .bind(&destino)
        .bind(user_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let tarjetas: Vec<String> = sqlx::query_scalar(
            "SELECT id FROM card WHERE column_id = ? AND user_id = ? ORDER BY position, created_at",
        )
        .bind(&id)
        .bind(user_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let ahora = instante(self.calendario.ahora_ms()).0;
        let mut posicion = ultima.unwrap_or(0.0);
        for tarjeta in &tarjetas {
            posicion += PASO_DE_POSICION;
            let (fields, mods) = campos(
                &[
                    ("column_id", Value::from(destino.as_str())),
                    ("position", json!(posicion)),
                ],
                &ahora,
            );
            sqlx::query(
                "UPDATE card SET column_id = ?, position = ?, field_mods = json_patch(field_mods, ?) \
                 WHERE id = ? AND user_id = ?",
            )
            .bind(&destino)
            .bind(posicion)
            .bind(mods.to_string())
            .bind(tarjeta)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            encolar_cambio(&mut tx, "card", tarjeta, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        // Una tarjeta que salió de esta columna hacia Hecho la recuerda como columna anterior: ya no existe.
        sqlx::query(
            "UPDATE card SET previous_column_id = NULL WHERE previous_column_id = ? AND user_id = ?",
        )
        .bind(&id)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        sqlx::query("DELETE FROM kanban_column WHERE id = ? AND user_id = ?")
            .bind(&id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        encolar_cambio(
            &mut tx,
            "kanban_column",
            &id,
            "delete",
            &Value::Null,
            &ahora,
        )
        .await
        .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        Ok(ConMensaje {
            valor: tarjetas.into_iter().map(Uuid).collect(),
            mensaje: resultado("column_delete", messages::COLUMNA_ELIMINADA),
        })
    }
}
