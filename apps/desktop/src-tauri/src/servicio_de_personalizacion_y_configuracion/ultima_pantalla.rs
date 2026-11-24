//! Última pantalla visitada (D-156; HE-17-HU02-ET05): es propia del computador y vive en `device_setting` con la
//! clave `last_screen` (sqlite_esquema.sql). Se lee solo de la base local, sin la nube (CA03).

use crate::repositorios_y_archivos_locales::BaseLocal;
use crate::servicio_de_sesion::instante;
use crate::tipos::ScreenId;

const CLAVE: &str = "last_screen";

/// IPC-DESK-05 `app_set_last_screen`: guarda la pantalla que la persona acaba de abrir.
pub async fn guardar(
    base: &BaseLocal,
    pantalla: ScreenId,
    ahora_ms: i64,
) -> Result<(), sqlx::Error> {
    let valor = serde_json::to_string(&pantalla).unwrap_or_else(|_| "null".into());
    sqlx::query(
        "INSERT INTO device_setting (key, value, updated_at) VALUES (?, ?, ?) \
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(CLAVE)
    .bind(valor)
    .bind(instante(ahora_ms).0)
    .execute(base.pool().await?)
    .await?;
    Ok(())
}

/// IPC-DESK-04 `app_get_last_screen`: la última pantalla guardada, o ninguna.
pub async fn leer(base: &BaseLocal) -> Result<Option<ScreenId>, sqlx::Error> {
    let valor: Option<String> =
        sqlx::query_scalar("SELECT value FROM device_setting WHERE key = ?")
            .bind(CLAVE)
            .fetch_optional(base.pool().await?)
            .await?;
    Ok(valor.and_then(|v| serde_json::from_str(&v).ok()))
}

/// rediseno_final_backend.md §4.2 (D-25): el menú lateral contraído se recuerda en este computador, sin sincronizar.
const MENU_CONTRAIDO: &str = "menu_collapsed";

/// IPC-DESK-18 `app_set_menu_collapsed`.
pub async fn guardar_menu_contraido(
    base: &BaseLocal,
    contraido: bool,
    ahora_ms: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO device_setting (key, value, updated_at) VALUES (?, ?, ?) \n         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(MENU_CONTRAIDO)
    .bind(if contraido { "true" } else { "false" })
    .bind(instante(ahora_ms).0)
    .execute(base.pool().await?)
    .await?;
    Ok(())
}

/// IPC-DESK-17 `app_get_menu_collapsed`: sin valor guardado, ampliado.
pub async fn leer_menu_contraido(base: &BaseLocal) -> Result<bool, sqlx::Error> {
    let valor: Option<String> =
        sqlx::query_scalar("SELECT value FROM device_setting WHERE key = ?")
            .bind(MENU_CONTRAIDO)
            .fetch_optional(base.pool().await?)
            .await?;
    Ok(valor.as_deref() == Some("true"))
}

#[cfg(test)]
mod pruebas {
    #[test]
    fn el_menu_contraido_se_recuerda_en_este_computador() {
        // D-25: sin valor, ampliado; se guarda y se vuelve a leer.
        let base = BaseLocal::en_memoria();
        assert!(!bloquear(leer_menu_contraido(&base)).unwrap());
        bloquear(guardar_menu_contraido(&base, true, AHORA)).unwrap();
        assert!(bloquear(leer_menu_contraido(&base)).unwrap());
        bloquear(guardar_menu_contraido(&base, false, AHORA + 1)).unwrap();
        assert!(!bloquear(leer_menu_contraido(&base)).unwrap());
    }

    use super::*;
    use crate::servicio_del_planificador::pruebas::bloquear;

    const AHORA: i64 = 1_794_663_000_000;

    #[test]
    fn ca_he_17_hu02_ca01() {
        // HE-17-HU02-CA01 · Al abrir la ventana desde el ícono se vuelve a la última pantalla visitada (ET05).
        let base = BaseLocal::en_memoria();
        assert_eq!(bloquear(leer(&base)).unwrap(), None);
        bloquear(guardar(&base, ScreenId::Kanban, AHORA)).unwrap();
        bloquear(guardar(&base, ScreenId::Reports, AHORA + 1)).unwrap();
        assert_eq!(bloquear(leer(&base)).unwrap(), Some(ScreenId::Reports));
    }

    #[test]
    fn ca_he_17_hu02_ca02() {
        // HE-17-HU02-CA02 · Con «Abrir» del menú del ícono se usa la misma pantalla guardada (ET06).
        let base = BaseLocal::en_memoria();
        bloquear(guardar(&base, ScreenId::Settings, AHORA)).unwrap();
        assert_eq!(bloquear(leer(&base)).unwrap(), Some(ScreenId::Settings));
    }

    #[test]
    fn ca_he_17_hu02_ca03() {
        // HE-17-HU02-CA03 · Sin conexión: la pantalla sale de la base local, sin llamar a la nube (ET03). La base
        // no tiene cliente de red; la pantalla guardada no se encola para sincronizar (es del computador).
        let base = BaseLocal::en_memoria();
        bloquear(guardar(&base, ScreenId::Agenda, AHORA)).unwrap();
        assert_eq!(bloquear(leer(&base)).unwrap(), Some(ScreenId::Agenda));
        let pendientes: i64 = bloquear(async {
            sqlx::query_scalar("SELECT count(*) FROM pending_change")
                .fetch_one(base.pool().await.unwrap())
                .await
                .unwrap()
        });
        assert_eq!(pendientes, 0);
    }
}
