//! La vista de las tarjetas del tablero Kanban (HE-09-HU07; IPC-DESK-12 `preference_get`, IPC-DESK-13
//! `preference_set`). Se guarda en `user_preference` y se sincroniza, así se conserva al volver a abrir la
//! aplicación (ET05).

use super::*;
use crate::tipos::{Preference, PreferenceBoardCardView};

fn texto(vista: &PreferenceBoardCardView) -> &'static str {
    match vista {
        PreferenceBoardCardView::Compact => "compact",
        PreferenceBoardCardView::Expanded => "expanded",
    }
}

impl<C: Calendario> ServicioDelPlanificador<C> {
    /// La vista elegida; la compacta si nunca se eligió (ET02).
    pub async fn preferencias(&self, user_id: &str) -> Result<Preference, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let vista: Option<String> =
            sqlx::query_scalar("SELECT board_card_view FROM user_preference WHERE user_id = ?")
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?;
        Ok(Preference {
            board_card_view: if vista.as_deref() == Some("expanded") {
                PreferenceBoardCardView::Expanded
            } else {
                PreferenceBoardCardView::Compact
            },
        })
    }

    /// Guarda la vista elegida y la encola para sincronizar (ET05).
    pub async fn guardar_vista(
        &self,
        user_id: &str,
        vista: &PreferenceBoardCardView,
    ) -> Result<(), AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let ahora = instante(self.calendario.ahora_ms()).0;
        let (fields, mods) = campos(&[("board_card_view", Value::from(texto(vista)))], &ahora);
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let existe: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM user_preference WHERE user_id = ?")
                .bind(user_id)
                .fetch_one(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if existe == 0 {
            sqlx::query(
                "INSERT INTO user_preference (id, user_id, created_at, field_mods, board_card_view) \
                 VALUES (?, ?, ?, ?, ?)",
            )
            .bind(user_id)
            .bind(user_id)
            .bind(&ahora)
            .bind(mods.to_string())
            .bind(texto(vista))
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        } else {
            sqlx::query(
                "UPDATE user_preference SET board_card_view = ?, field_mods = json_patch(field_mods, ?) \
                 WHERE user_id = ?",
            )
            .bind(texto(vista))
            .bind(mods.to_string())
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        }
        encolar_cambio(
            &mut tx,
            "user_preference",
            user_id,
            "upsert",
            &fields,
            &ahora,
        )
        .await
        .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        Ok(())
    }
}
