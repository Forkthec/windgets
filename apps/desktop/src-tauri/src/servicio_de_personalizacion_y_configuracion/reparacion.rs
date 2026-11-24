//! Reparación de los widgets por defecto (`rediseno_final_backend.md` §3.2, D-27, P44).
//!
//! La nube crea los cuatro widgets por defecto al confirmar la cuenta (`on_account_confirmed`, 0003_funciones.sql),
//! pero hay cuentas que no los tienen (la lista de Personalización salía vacía). Después de una descarga completa, el
//! Núcleo comprueba que existan Reloj, Calendario, Tareas del día y Kanban y su fila en cada tema; si falta algo, lo
//! crea con la distribución por defecto como cambios pendientes normales. Es idempotente: respeta
//! `uq_widget_singleton` porque solo crea el widget cuando no hay ninguno de ese tipo.

use serde_json::Value;

use super::agregar::{REFERENCIA, posicion_libre};
use crate::repositorios_y_archivos_locales::{BaseLocal, encolar_cambio};
use crate::servicio_del_planificador::campos;

/// Los cuatro widgets por defecto con la posición y el tamaño de la semilla (0003_funciones.sql, H-D-18).
pub const POR_DEFECTO: [(&str, i64, i64, i64, i64); 4] = [
    ("clock", 40, 40, 320, 160),
    ("calendar", 40, 220, 320, 340),
    ("daily_tasks", 380, 40, 360, 520),
    ("kanban", 760, 40, 640, 520),
];

fn se_cruzan(a: (i64, i64, i64, i64), b: (i64, i64, i64, i64)) -> bool {
    a.0 < b.0 + b.2 && b.0 < a.0 + a.2 && a.1 < b.1 + b.3 && b.1 < a.1 + a.3
}

/// Crea lo que falte y devuelve las filas creadas (`widget` o `theme_widget`, id). Sin temas no hace nada: el tema
/// inicial llega con la descarga.
pub async fn reparar_widgets_por_defecto(
    base: &BaseLocal,
    user_id: &str,
    ahora: &str,
) -> Result<Vec<(String, String)>, sqlx::Error> {
    let pool = base.pool().await?;
    let temas: Vec<String> =
        sqlx::query_scalar("SELECT id FROM theme WHERE user_id = ? ORDER BY created_at, id")
            .bind(user_id)
            .fetch_all(pool)
            .await?;
    if temas.is_empty() {
        return Ok(Vec::new());
    }
    let mut creadas = Vec::new();
    let mut tx = pool.begin().await?;
    for (tipo, x, y, ancho, alto) in POR_DEFECTO {
        let existente: Option<String> = sqlx::query_scalar(
            "SELECT id FROM widget WHERE user_id = ? AND type = ? ORDER BY created_at, id LIMIT 1",
        )
        .bind(user_id)
        .bind(tipo)
        .fetch_optional(&mut *tx)
        .await?;
        let widget_id = match existente {
            Some(id) => id,
            None => {
                let id = uuid::Uuid::new_v4().to_string();
                let valores = [
                    ("type", Value::from(tipo)),
                    ("is_default", Value::from(true)),
                ];
                let (fields, mods) = campos(&valores, ahora);
                sqlx::query(
                    "INSERT INTO widget (id, user_id, created_at, field_mods, type, is_default) \
                     VALUES (?, ?, ?, ?, ?, 1)",
                )
                .bind(&id)
                .bind(user_id)
                .bind(ahora)
                .bind(mods.to_string())
                .bind(tipo)
                .execute(&mut *tx)
                .await?;
                encolar_cambio(&mut tx, "widget", &id, "upsert", &fields, ahora).await?;
                creadas.push(("widget".to_string(), id.clone()));
                id
            }
        };
        for tema in &temas {
            let tiene: Option<i64> = sqlx::query_scalar(
                "SELECT 1 FROM theme_widget WHERE theme_id = ? AND widget_id = ?",
            )
            .bind(tema)
            .bind(&widget_id)
            .fetch_optional(&mut *tx)
            .await?;
            if tiene.is_some() {
                continue;
            }
            let ocupados: Vec<(i64, i64, i64, i64)> = sqlx::query_as(
                "SELECT x, y, width, height FROM theme_widget WHERE theme_id = ? AND is_active = 1",
            )
            .bind(tema)
            .fetch_all(&mut *tx)
            .await?;
            // La posición de la semilla si está libre; si no, la primera libre (HE-05: sin superposición).
            let (x, y) = if ocupados.iter().any(|o| se_cruzan(*o, (x, y, ancho, alto))) {
                posicion_libre(&ocupados, ancho, alto)
            } else {
                (x, y)
            };
            let (ref_ancho, ref_alto) = REFERENCIA;
            let id = uuid::Uuid::new_v4().to_string();
            let valores = [
                ("theme_id", Value::from(tema.as_str())),
                ("widget_id", Value::from(widget_id.as_str())),
                ("is_active", Value::from(true)),
                ("x", Value::from(x)),
                ("y", Value::from(y)),
                ("width", Value::from(ancho)),
                ("height", Value::from(alto)),
                ("ref_width", Value::from(ref_ancho)),
                ("ref_height", Value::from(ref_alto)),
            ];
            let (fields, mods) = campos(&valores, ahora);
            sqlx::query(
                "INSERT INTO theme_widget (id, user_id, created_at, field_mods, theme_id, widget_id, is_active, \
                 x, y, width, height, ref_width, ref_height) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id)
            .bind(user_id)
            .bind(ahora)
            .bind(mods.to_string())
            .bind(tema)
            .bind(&widget_id)
            .bind(x)
            .bind(y)
            .bind(ancho)
            .bind(alto)
            .bind(ref_ancho)
            .bind(ref_alto)
            .execute(&mut *tx)
            .await?;
            encolar_cambio(&mut tx, "theme_widget", &id, "upsert", &fields, ahora).await?;
            creadas.push(("theme_widget".to_string(), id));
        }
    }
    tx.commit().await?;
    Ok(creadas)
}
