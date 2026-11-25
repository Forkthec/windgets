//! Editar (HE-08-HU03; IPC-LABEL-03) y eliminar (HE-08-HU04; IPC-LABEL-04, IPC-LABEL-05) etiquetas.

use super::*;
use crate::tipos::{LabelDeleteInfo, LabelUpdateParams};

impl<C: Calendario> ServicioDelPlanificador<C> {
    /// IPC-LABEL-03 `label_update` (HE-08-HU03): las mismas reglas de nombre y color que al crearla (ET03, ET04,
    /// ET11), sin contar la propia etiqueta como duplicada. El cambio se ve en la lista y en las tarjetas que la
    /// tienen, porque estas leen la etiqueta por su id (ET05). Msg: «Etiqueta actualizada.» (ET06).
    pub async fn actualizar_etiqueta(
        &self,
        user_id: &str,
        params: LabelUpdateParams,
    ) -> Result<ConMensaje<Label>, AppError> {
        let id = params.id.0.to_lowercase();
        let nombre = params.name.trim().to_string();
        let color = params.color_id.trim().to_string();
        // Los errores de forma; la vista repite estas reglas y muestra cada mensaje en su campo.
        let mut errores = Vec::new();
        if nombre.is_empty() {
            errores.push(error(
                ErrorCode::NameRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("name"),
            ));
        } else if nombre.chars().count() > NOMBRE_DE_ETIQUETA_MAX {
            errores.push(error(
                ErrorCode::NameTooLong,
                messages::NOMBRE_DE_ETIQUETA_MUY_LARGO,
                Some("name"),
            ));
        }
        if color.is_empty() {
            errores.push(error(
                ErrorCode::ColorRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("color_id"),
            ));
        }
        if let Some(primero) = errores.into_iter().next() {
            return Err(primero);
        }
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let existentes: Vec<(String, String)> =
            sqlx::query_as("SELECT id, name FROM label WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if !existentes.iter().any(|(i, _)| *i == id) {
            return Err(error(ErrorCode::LabelNotFound, "", None));
        }
        let clave = nombre.to_lowercase();
        if existentes
            .iter()
            .any(|(i, n)| *i != id && n.trim().to_lowercase() == clave)
        {
            return Err(error(
                ErrorCode::NameDuplicate,
                messages::ETIQUETA_DUPLICADA,
                Some("name"),
            ));
        }
        comprobar_color_de_etiqueta(&mut tx, &color).await?;
        let ahora = instante(self.calendario.ahora_ms()).0;
        let (fields, mods) = campos(
            &[
                ("name", Value::from(nombre.as_str())),
                ("color_id", Value::from(color.as_str())),
            ],
            &ahora,
        );
        sqlx::query(
            "UPDATE label SET name = ?, color_id = ?, field_mods = json_patch(field_mods, ?) \
             WHERE id = ? AND user_id = ?",
        )
        .bind(&nombre)
        .bind(&color)
        .bind(mods.to_string())
        .bind(&id)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "label", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        let etiqueta = self
            .etiquetas(user_id)
            .await?
            .into_iter()
            .find(|e| e.id.0 == id)
            .ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: etiqueta,
            mensaje: resultado("label_update", messages::ETIQUETA_ACTUALIZADA),
        })
    }

    /// IPC-LABEL-04 `label_get_delete_info` (HE-08-HU04): el nombre y en cuántas tarjetas está, para elegir el
    /// texto de la confirmación (CA01, CA03, CA04).
    pub async fn info_para_eliminar_etiqueta(
        &self,
        user_id: &str,
        id: &str,
    ) -> Result<LabelDeleteInfo, AppError> {
        let id = id.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let nombre: String =
            sqlx::query_scalar("SELECT name FROM label WHERE id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(|| error(ErrorCode::LabelNotFound, "", None))?;
        let cantidad: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM card_label WHERE label_id = ? AND user_id = ?",
        )
        .bind(&id)
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(de_sqlx)?;
        Ok(LabelDeleteInfo {
            name: nombre,
            card_count: cantidad,
        })
    }

    /// IPC-LABEL-05 `label_delete` (HE-08-HU04): elimina la etiqueta y la quita de las tarjetas, sin eliminarlas
    /// (ET06), y encola las eliminaciones. Devuelve las tarjetas que la tenían, para avisar con EV-07.
    /// Msg: «Etiqueta eliminada.» (ET08).
    pub async fn eliminar_etiqueta(
        &self,
        user_id: &str,
        id: &str,
    ) -> Result<ConMensaje<Vec<Uuid>>, AppError> {
        let id = id.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let uniones: Vec<(String, String)> =
            sqlx::query_as("SELECT id, card_id FROM card_label WHERE label_id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        let borradas = sqlx::query("DELETE FROM label WHERE id = ? AND user_id = ?")
            .bind(&id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?
            .rows_affected();
        if borradas == 0 {
            return Err(error(ErrorCode::LabelNotFound, "", None));
        }
        let ahora = instante(self.calendario.ahora_ms()).0;
        // Las uniones con las tarjetas se borran en cascada (sqlite_esquema.sql).
        for (union, _) in &uniones {
            encolar_cambio(&mut tx, "card_label", union, "delete", &Value::Null, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        encolar_cambio(&mut tx, "label", &id, "delete", &Value::Null, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        Ok(ConMensaje {
            valor: uniones
                .into_iter()
                .map(|(_, tarjeta)| Uuid(tarjeta))
                .collect(),
            mensaje: resultado("label_delete", messages::ETIQUETA_ELIMINADA),
        })
    }
}
