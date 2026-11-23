//! HE-02-HU14 (P29) · Ajuste de la imagen de fondo en cada monitor, como en Windows: Rellenar, Ajustar, Expandir,
//! Mosaico, Centrar y Extender. Es propio del computador (los monitores son de este equipo): vive en
//! `device_setting` con la clave `wallpaper_fit` y no se sincroniza. Por defecto, Rellenar con la misma imagen en
//! todos los monitores (CA01). Se ajustan hasta 6 monitores por separado: el principal y los siguientes en el
//! orden de Windows; el 7.º y los demás usan el ajuste del principal (CA06). Extender pone una sola imagen sobre
//! todos los monitores, así que vale para todos (CA05).

use std::collections::BTreeMap;

use super::distribucion::monitor_principal;
use crate::messages;
use crate::repositorios_y_archivos_locales::BaseLocal;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::{de_sqlx, error};
use crate::tipos::{
    AppError, ErrorCode, Monitor, WallpaperFit, WallpaperFitSettings, WallpaperMonitorFit,
};

const CLAVE: &str = "wallpaper_fit";
/// CA06: los monitores que se ajustan por separado.
pub const MONITORES_AJUSTABLES: usize = 6;

/// El ajuste guardado de cada monitor, por su id.
pub type Guardados = BTreeMap<String, WallpaperFit>;

/// Los monitores que se ajustan por separado: el principal y los siguientes en el orden de Windows, hasta 6.
fn ajustables(monitores: &[Monitor]) -> Vec<&Monitor> {
    let principal = monitor_principal(monitores);
    monitores
        .iter()
        .filter(|m| m.id == principal.id)
        .chain(monitores.iter().filter(|m| m.id != principal.id))
        .take(MONITORES_AJUSTABLES)
        .collect()
}

/// El ajuste de cada monitor, en el orden de `monitores` (lo que pinta la capa).
pub fn ajustes(guardados: &Guardados, monitores: &[Monitor]) -> Vec<WallpaperMonitorFit> {
    let principal = monitor_principal(monitores);
    let del_principal = guardados
        .get(&principal.id)
        .copied()
        .unwrap_or(WallpaperFit::Fill);
    let ajustables: Vec<&str> = ajustables(monitores)
        .iter()
        .map(|m| m.id.as_str())
        .collect();
    monitores
        .iter()
        .enumerate()
        .map(|(indice, m)| {
            let propio = if ajustables.contains(&m.id.as_str()) {
                guardados.get(&m.id).copied().unwrap_or(WallpaperFit::Fill)
            } else {
                del_principal
            };
            // CA05: Extender es una sola imagen sobre todos; un monitor nuevo mientras se extiende también extiende.
            let fit = match (del_principal, propio) {
                (WallpaperFit::Span, _) => WallpaperFit::Span,
                (otro, WallpaperFit::Span) => otro,
                (_, propio) => propio,
            };
            WallpaperMonitorFit {
                monitor_id: m.id.clone(),
                number: i64::try_from(indice + 1).unwrap_or(i64::MAX),
                is_primary: m.id == principal.id,
                fit,
            }
        })
        .collect()
}

/// IPC-DESK-15: los monitores que se ajustan, en el orden de Windows, y cuántos más hay.
pub fn configuracion(guardados: &Guardados, monitores: &[Monitor]) -> WallpaperFitSettings {
    let ajustables: Vec<&str> = ajustables(monitores)
        .iter()
        .map(|m| m.id.as_str())
        .collect();
    let lista: Vec<WallpaperMonitorFit> = ajustes(guardados, monitores)
        .into_iter()
        .filter(|a| ajustables.contains(&a.monitor_id.as_str()))
        .collect();
    WallpaperFitSettings {
        other_monitors: i64::try_from(monitores.len() - lista.len()).unwrap_or(0),
        monitors: lista,
    }
}

/// IPC-DESK-16: el ajuste nuevo de un monitor. Extender, o dejar de extender, cambia todos los monitores (CA05).
pub fn cambiar(
    guardados: &Guardados,
    monitores: &[Monitor],
    monitor_id: &str,
    fit: WallpaperFit,
) -> Result<Guardados, AppError> {
    if !monitores.iter().any(|m| m.id == monitor_id) {
        // CA07: el monitor se desconectó mientras la persona elegía.
        return Err(error(
            ErrorCode::MonitorNotFound,
            messages::MONITOR_NO_CONECTADO,
            Some("monitor_id"),
        ));
    }
    let ajustables = ajustables(monitores);
    if !ajustables.iter().any(|m| m.id == monitor_id) {
        return Err(error(
            ErrorCode::MonitorNotConfigurable,
            messages::MONITOR_NO_AJUSTABLE,
            Some("monitor_id"),
        ));
    }
    let extendiendo = ajustes(guardados, monitores)
        .iter()
        .any(|a| a.is_primary && a.fit == WallpaperFit::Span);
    let mut nuevos = guardados.clone();
    if fit == WallpaperFit::Span || extendiendo {
        for m in ajustables {
            nuevos.insert(m.id.clone(), fit);
        }
    } else {
        nuevos.insert(monitor_id.to_string(), fit);
    }
    Ok(nuevos)
}

/// Los ajustes guardados; sin guardar, o ilegibles, ninguno (todos Rellenar, CA01).
pub async fn leer(base: &BaseLocal) -> Result<Guardados, AppError> {
    let valor: Option<String> =
        sqlx::query_scalar("SELECT value FROM device_setting WHERE key = ?")
            .bind(CLAVE)
            .fetch_optional(base.pool().await.map_err(de_sqlx)?)
            .await
            .map_err(de_sqlx)?;
    Ok(valor
        .and_then(|v| serde_json::from_str(&v).ok())
        .unwrap_or_default())
}

pub async fn guardar(
    base: &BaseLocal,
    guardados: &Guardados,
    ahora_ms: i64,
) -> Result<(), AppError> {
    let valor = serde_json::to_string(guardados).unwrap_or_else(|_| "{}".into());
    sqlx::query(
        "INSERT INTO device_setting (key, value, updated_at) VALUES (?, ?, ?) \
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(CLAVE)
    .bind(valor)
    .bind(instante(ahora_ms).0)
    .execute(base.pool().await.map_err(de_sqlx)?)
    .await
    .map_err(de_sqlx)?;
    Ok(())
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use crate::servicio_del_planificador::pruebas::bloquear;
    use WallpaperFit::{Center, Fill, Fit, Span, Stretch, Tile};

    const AHORA: i64 = 1_794_663_000_000;

    /// `n` monitores de 1920 × 1080 en fila; el principal es el que contiene el origen.
    fn monitores(n: i64, principal: i64) -> Vec<Monitor> {
        (0..n)
            .map(|i| Monitor {
                id: i.to_string(),
                x: (i - principal) * 1920,
                y: 0,
                width: 1920,
                height: 1080,
                scale_factor: 1.0,
            })
            .collect()
    }

    fn fits(guardados: &Guardados, monitores: &[Monitor]) -> Vec<WallpaperFit> {
        ajustes(guardados, monitores)
            .into_iter()
            .map(|a| a.fit)
            .collect()
    }

    #[test]
    fn ca_he_02_hu14_ca01() {
        // HE-02-HU14-CA01 · Sin elegir nada, todos los monitores Rellenar (como Windows) y la misma imagen en todos.
        let pantallas = monitores(3, 0);
        assert_eq!(fits(&Guardados::new(), &pantallas), vec![Fill, Fill, Fill]);
        let configuracion = configuracion(&Guardados::new(), &pantallas);
        assert_eq!(configuracion.monitors.len(), 3);
        assert!(configuracion.monitors[0].is_primary);
        assert_eq!(configuracion.monitors[2].number, 3);
        assert_eq!(configuracion.other_monitors, 0);
    }

    #[test]
    fn ca_he_02_hu14_ca02() {
        // HE-02-HU14-CA02 · Cada monitor con su propio ajuste: los cinco que no extienden.
        let pantallas = monitores(5, 0);
        let mut guardados = Guardados::new();
        for (id, fit) in [
            ("0", Fill),
            ("1", Fit),
            ("2", Stretch),
            ("3", Tile),
            ("4", Center),
        ] {
            guardados = cambiar(&guardados, &pantallas, id, fit).unwrap();
        }
        assert_eq!(
            fits(&guardados, &pantallas),
            vec![Fill, Fit, Stretch, Tile, Center]
        );
    }

    #[test]
    fn ca_he_02_hu14_ca03() {
        // HE-02-HU14-CA03 · El ajuste se guarda en este computador y se conserva al volver a abrir la aplicación.
        let base = BaseLocal::en_memoria();
        let pantallas = monitores(2, 0);
        let guardados = cambiar(&Guardados::new(), &pantallas, "1", Center).unwrap();
        bloquear(guardar(&base, &guardados, AHORA)).unwrap();
        assert_eq!(
            fits(&bloquear(leer(&base)).unwrap(), &pantallas),
            vec![Fill, Center]
        );
    }

    #[test]
    fn ca_he_02_hu14_ca04() {
        // HE-02-HU14-CA04 · Un valor ilegible en la base no rompe el fondo: todos Rellenar.
        let base = BaseLocal::en_memoria();
        bloquear(async {
            sqlx::query("INSERT INTO device_setting (key, value, updated_at) VALUES (?, '[1]', ?)")
                .bind(CLAVE)
                .bind(instante(AHORA).0)
                .execute(base.pool().await.unwrap())
                .await
                .unwrap();
        });
        assert_eq!(bloquear(leer(&base)).unwrap(), Guardados::new());
    }

    #[test]
    fn ca_he_02_hu14_ca05() {
        // HE-02-HU14-CA05 · Extender pone una sola imagen sobre todos; dejar de extender pone el ajuste elegido en
        // todos. Un monitor que se conecta mientras se extiende también extiende.
        let pantallas = monitores(3, 0);
        let guardados = cambiar(&Guardados::new(), &pantallas, "2", Fit).unwrap();
        let extendido = cambiar(&guardados, &pantallas, "1", Span).unwrap();
        assert_eq!(fits(&extendido, &pantallas), vec![Span, Span, Span]);
        assert_eq!(fits(&extendido, &monitores(4, 0)), vec![Span; 4]);
        let sin_extender = cambiar(&extendido, &pantallas, "2", Tile).unwrap();
        assert_eq!(fits(&sin_extender, &pantallas), vec![Tile, Tile, Tile]);
    }

    #[test]
    fn ca_he_02_hu14_ca06() {
        // HE-02-HU14-CA06 · Hasta 6 monitores se ajustan; el 7.º y los siguientes usan el ajuste del principal.
        // Valores límite: 6 y 7 monitores; el principal cuenta aunque no sea el primero de Windows.
        let seis = monitores(6, 0);
        assert_eq!(configuracion(&Guardados::new(), &seis).other_monitors, 0);
        let ocho = monitores(8, 7);
        let guardados = cambiar(&Guardados::new(), &ocho, "7", Center).unwrap();
        let guardados = cambiar(&guardados, &ocho, "0", Fit).unwrap();
        let configuracion = configuracion(&guardados, &ocho);
        assert_eq!(configuracion.monitors.len(), 6);
        assert_eq!(configuracion.other_monitors, 2);
        assert!(
            configuracion
                .monitors
                .iter()
                .any(|m| m.monitor_id == "7" && m.is_primary)
        );
        // Los monitores 6 y 7 de Windows (ids 5 y 6) no se ajustan: toman Centrar, el del principal.
        assert_eq!(
            fits(&guardados, &ocho),
            vec![Fit, Fill, Fill, Fill, Fill, Center, Center, Center]
        );
        let error = cambiar(&guardados, &ocho, "6", Fit).unwrap_err();
        assert_eq!(error.code, ErrorCode::MonitorNotConfigurable);
        assert_eq!(error.message, messages::MONITOR_NO_AJUSTABLE);
    }

    #[test]
    fn ca_he_02_hu14_ca07() {
        // HE-02-HU14-CA07 · Un monitor que ya no está conectado: mensaje claro en el campo, sin el error genérico.
        let error = cambiar(&Guardados::new(), &monitores(1, 0), "3", Fit).unwrap_err();
        assert_eq!(error.code, ErrorCode::MonitorNotFound);
        assert_eq!(error.message, messages::MONITOR_NO_CONECTADO);
        assert_eq!(error.field.as_deref(), Some("monitor_id"));
    }
}
