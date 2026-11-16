//! RPC-04 `catalog_pull` (HE-02-HU01-CA01, D-180, D-198): baja los catálogos solo si cambió su versión y los
//! guarda en la caché SQLite (`catalog_*`, con `fetched_at`). La versión descargada vive en
//! `sync_state.catalog_version` (datos.md, 3.2). Sin los catálogos locales, los temas que llegan con `sync_pull`
//! y la copia aplicada no cumplen sus claves foráneas (`template_id`, `font_id`).

use serde_json::Value;

use super::{Credenciales, NubeDeSincronizacion, instante, preparar};
use crate::cliente_de_supabase::FallaDeAuth;
use crate::repositorios_y_archivos_locales::BaseLocal;
use crate::tipos::{CatalogKind, CatalogPullParams, CatalogPullResultVariant2};

/// Las tablas en orden padre → hijo (`catalog_template.default_font_id` → `catalog_font`) y su clase.
const TABLAS: [(&str, CatalogKind); 6] = [
    ("catalog_font", CatalogKind::Font),
    ("catalog_template", CatalogKind::Template),
    ("catalog_palette", CatalogKind::Palette),
    ("catalog_image", CatalogKind::Image),
    ("catalog_animation", CatalogKind::Animation),
    ("catalog_color", CatalogKind::Color),
];

/// Lee la respuesta de RPC-04. `None` si la versión no cambió (`unchanged: true`). El tipo generado
/// `CatalogPullResult` es `untagged` y su primera variante acepta también la respuesta completa, por eso aquí se
/// mira `unchanged` antes de leer las filas.
pub fn leer_respuesta(texto: &str) -> Result<Option<CatalogPullResultVariant2>, FallaDeAuth> {
    let valor: Value = serde_json::from_str(texto).map_err(|_| FallaDeAuth::SinRespuesta)?;
    if valor.get("unchanged").and_then(Value::as_bool) == Some(true) {
        return Ok(None);
    }
    serde_json::from_value(valor)
        .map(Some)
        .map_err(|_| FallaDeAuth::SinRespuesta)
}

/// Un valor JSON como lo guarda SQLite: los booleanos como 0 y 1.
fn valor_sql(valor: &Value) -> Option<String> {
    match valor {
        Value::Null => None,
        Value::Bool(b) => Some(if *b { "1" } else { "0" }.to_string()),
        Value::String(texto) => Some(texto.clone()),
        otro => Some(otro.to_string()),
    }
}

/// Las filas de cada tabla, en el orden de [`TABLAS`].
fn filas(catalogo: &CatalogPullResultVariant2) -> Result<[Vec<Value>; 6], serde_json::Error> {
    fn lista<T: serde::Serialize>(filas: &[T]) -> Result<Vec<Value>, serde_json::Error> {
        filas.iter().map(serde_json::to_value).collect()
    }
    Ok([
        lista(&catalogo.fonts)?,
        lista(&catalogo.templates)?,
        lista(&catalogo.palettes)?,
        lista(&catalogo.images)?,
        lista(&catalogo.animations)?,
        lista(&catalogo.colors)?,
    ])
}

/// Descarga los catálogos si cambió la versión y los guarda en una transacción. Las filas que ya no llegan (la
/// nube solo entrega las activas) quedan con `is_active = 0`: no se borran, porque los temas las referencian.
/// Devuelve las clases de catálogo que cambiaron (para EV `catalog_updated`); vacío si no cambió nada o si la nube
/// no respondió (se reintenta en la siguiente consulta).
pub async fn descargar_catalogo<N: NubeDeSincronizacion>(
    base: &BaseLocal,
    nube: &N,
    sesion: &Credenciales<'_>,
    ahora_ms: i64,
) -> Result<Vec<CatalogKind>, sqlx::Error> {
    preparar(base, sesion.user_id).await?;
    let pool = base.pool().await?;
    let conocida: i64 = sqlx::query_scalar("SELECT catalog_version FROM sync_state WHERE id = 1")
        .fetch_one(pool)
        .await?;
    let respuesta = nube
        .catalog_pull(
            sesion.token,
            &CatalogPullParams {
                p_known_version: conocida,
            },
        )
        .await;
    let Ok(Some(catalogo)) = respuesta else {
        return Ok(Vec::new());
    };
    // DUDA: HE-02-HU01 una respuesta que no se puede convertir no cambia la caché.
    let Ok(por_tabla) = filas(&catalogo) else {
        return Ok(Vec::new());
    };
    let ahora = instante(ahora_ms);
    let mut tx = pool.begin().await?;
    let mut cambiadas = Vec::new();
    for ((tabla, clase), filas) in TABLAS.iter().zip(por_tabla.iter()) {
        // El nombre de la tabla sale de la lista fija TABLAS, nunca del texto recibido.
        let columnas: Vec<String> =
            sqlx::query_scalar(&format!("SELECT name FROM pragma_table_info('{tabla}')"))
                .fetch_all(&mut *tx)
                .await?;
        let mut ids = Vec::new();
        for fila in filas {
            let Some(objeto) = fila.as_object() else {
                continue;
            };
            let mut nombres: Vec<&str> = Vec::new();
            let mut valores: Vec<Option<String>> = Vec::new();
            for (campo, valor) in objeto {
                if campo != "fetched_at" && columnas.contains(campo) {
                    nombres.push(campo);
                    valores.push(valor_sql(valor));
                }
            }
            nombres.push("fetched_at");
            valores.push(Some(ahora.clone()));
            let sql = format!(
                "INSERT INTO {tabla} ({}) VALUES ({}) ON CONFLICT(id) DO UPDATE SET {}",
                nombres.join(", "),
                vec!["?"; nombres.len()].join(", "),
                nombres
                    .iter()
                    .filter(|n| **n != "id")
                    .map(|n| format!("{n} = excluded.{n}"))
                    .collect::<Vec<_>>()
                    .join(", "),
            );
            let mut consulta = sqlx::query(&sql);
            for valor in valores {
                consulta = consulta.bind(valor);
            }
            consulta.execute(&mut *tx).await?;
            if let Some(id) = objeto.get("id").and_then(Value::as_str) {
                ids.push(id.to_string());
            }
        }
        let lista = serde_json::to_string(&ids).unwrap_or_else(|_| "[]".to_string());
        sqlx::query(&format!(
            "UPDATE {tabla} SET is_active = 0 WHERE is_active = 1 AND id NOT IN (SELECT value FROM json_each(?))"
        ))
        .bind(lista)
        .execute(&mut *tx)
        .await?;
        cambiadas.push(clase.clone());
    }
    sqlx::query("UPDATE sync_state SET catalog_version = ? WHERE id = 1")
        .bind(catalogo.version)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(cambiadas)
}
