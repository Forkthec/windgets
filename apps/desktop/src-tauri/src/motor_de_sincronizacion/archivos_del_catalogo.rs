//! INT-09, «Descargar», del bucket `catalog` (contratos.md, IPC-CAT-01 e INT-09): las miniaturas de las plantillas y
//! de las imágenes del catálogo, el fondo de cada plantilla y cada imagen del catálogo. `catalog_pull` solo trae las
//! filas; sin esta descarga, `catalog_list` daba rutas de Storage («templates/claro/thumbnail.png») que no existen en
//! el computador y la vista mostraba imágenes rotas (prueba manual del 23-nov). Cada archivo se guarda en
//! `%APPDATA%\Windgets\files\catalog\{ruta}` con su `local_file` (`kind`, `ref_id`, `sha256`), y se vuelve a bajar
//! si su ruta en Storage cambió o el archivo ya no está. La plantilla por defecto viaja en el instalador
//! (HE-02-HU01-ET02, D-198) y las tipografías del catálogo también (`ui/tema/tokens.css`): no se descargan.
//!
//! Storage queda detrás del trait [`AlmacenDelCatalogo`] para que las pruebas usen un doble.

use std::future::Future;
use std::path::Path;

use super::{Credenciales, archivos::sha256_en_hex, instante};
use crate::cliente_de_supabase::FallaDeAuth;
use crate::repositorios_y_archivos_locales::BaseLocal;
use crate::tipos::CatalogKind;

/// El bucket del catálogo (D-180, `0004_storage.sql`).
pub const BUCKET_DEL_CATALOGO: &str = "catalog";

/// La carpeta, dentro de la de archivos, donde quedan los archivos del catálogo.
pub const CARPETA_DEL_CATALOGO: &str = "catalog";

/// INT-09 con el JWT de la sesión.
pub trait AlmacenDelCatalogo: Send + Sync {
    /// `GET /storage/v1/object/authenticated/catalog/{ruta}`.
    fn descargar_del_catalogo(
        &self,
        token: &str,
        ruta: &str,
    ) -> impl Future<Output = Result<Vec<u8>, FallaDeAuth>> + Send;
}

/// Una ruta de Storage del catálogo que se puede guardar en el computador: relativa, sin «..» ni separadores de
/// Windows (RNF-22, `local_file.local_path`).
pub fn ruta_del_catalogo_valida(ruta: &str) -> bool {
    !ruta.is_empty()
        && !ruta.starts_with('/')
        && !ruta.contains("..")
        && !ruta.contains('\\')
        && !ruta.contains(':')
}

/// Los archivos que debe tener el computador: `(kind de local_file, id del catálogo, ruta en Storage)`.
const ARCHIVOS: &str = "\
    SELECT 'template_thumbnail' AS kind, id, thumbnail_path AS ruta FROM catalog_template \
      WHERE is_active = 1 AND id <> 'default' \
    UNION ALL SELECT 'template_bundle', id, default_background_path FROM catalog_template \
      WHERE is_active = 1 AND id <> 'default' \
    UNION ALL SELECT 'catalog_thumbnail', id, thumbnail_path FROM catalog_image WHERE is_active = 1 \
    UNION ALL SELECT 'catalog_image', id, storage_path FROM catalog_image WHERE is_active = 1";

/// La clase de catálogo que cambia al bajar un archivo de ese `kind` (para EV-25 `catalog_updated`).
fn clase(kind: &str) -> CatalogKind {
    if kind.starts_with("template") {
        CatalogKind::Template
    } else {
        CatalogKind::Image
    }
}

/// Baja los archivos del catálogo que faltan en `carpeta` (la de archivos de la aplicación) y devuelve las clases de
/// catálogo que ganaron archivos. Sin conexión se detiene y lo intenta en el siguiente ciclo; un archivo que Storage
/// no entrega se salta (se reintenta en el siguiente ciclo).
pub async fn descargar_archivos_del_catalogo<A: AlmacenDelCatalogo>(
    base: &BaseLocal,
    almacen: &A,
    sesion: &Credenciales<'_>,
    carpeta: &Path,
    ahora_ms: i64,
) -> Result<Vec<CatalogKind>, sqlx::Error> {
    let pool = base.pool().await?;
    let candidatos: Vec<(String, String, String)> =
        sqlx::query_as(ARCHIVOS).fetch_all(pool).await?;
    let mut cambiadas: Vec<CatalogKind> = Vec::new();
    for (kind, id, ruta) in candidatos {
        if !ruta_del_catalogo_valida(&ruta) {
            continue;
        }
        let local = format!("{CARPETA_DEL_CATALOGO}/{ruta}");
        let guardado: Option<(String, String)> = sqlx::query_as(
            "SELECT remote_path, local_path FROM local_file WHERE kind = ? AND ref_id = ?",
        )
        .bind(&kind)
        .bind(&id)
        .fetch_optional(pool)
        .await?;
        if let Some((remota, ruta_local)) = &guardado
            && remota == &ruta
            && carpeta.join(ruta_local).is_file()
        {
            continue;
        }
        let bytes = match almacen.descargar_del_catalogo(sesion.token, &ruta).await {
            Ok(bytes) if !bytes.is_empty() => bytes,
            Ok(_) => continue,
            Err(FallaDeAuth::SinConexion) => break,
            Err(_) => continue,
        };
        let destino = carpeta.join(&local);
        let guardada = destino
            .parent()
            .is_none_or(|padre| std::fs::create_dir_all(padre).is_ok())
            && std::fs::write(&destino, &bytes).is_ok();
        if !guardada {
            continue;
        }
        let ahora = instante(ahora_ms);
        let tamano = i64::try_from(bytes.len()).unwrap_or(i64::MAX);
        sqlx::query(
            "INSERT INTO local_file (id, kind, ref_id, remote_path, local_path, size_bytes, sha256, downloaded_at, \
             last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) \
             ON CONFLICT(kind, ref_id) DO UPDATE SET remote_path = excluded.remote_path, \
             local_path = excluded.local_path, size_bytes = excluded.size_bytes, sha256 = excluded.sha256, \
             downloaded_at = excluded.downloaded_at, last_used_at = excluded.last_used_at",
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(&kind)
        .bind(&id)
        .bind(&ruta)
        .bind(&local)
        .bind(tamano)
        .bind(sha256_en_hex(&bytes))
        .bind(&ahora)
        .bind(&ahora)
        .execute(pool)
        .await?;
        let nueva = clase(&kind);
        if !cambiadas.contains(&nueva) {
            cambiadas.push(nueva);
        }
    }
    Ok(cambiadas)
}

/// La ruta en el computador del archivo del catálogo de ese `kind` e `id`, si ya está descargado.
pub async fn ruta_local(
    base: &BaseLocal,
    carpeta: &Path,
    kind: &str,
    id: &str,
) -> Result<Option<String>, sqlx::Error> {
    let pool = base.pool().await?;
    let relativa: Option<String> =
        sqlx::query_scalar("SELECT local_path FROM local_file WHERE kind = ? AND ref_id = ?")
            .bind(kind)
            .bind(id)
            .fetch_optional(pool)
            .await?;
    Ok(relativa
        .map(|r| carpeta.join(r))
        .filter(|ruta| ruta.is_file())
        .map(|ruta| ruta.to_string_lossy().into_owned()))
}

#[cfg(test)]
mod pruebas {
    use std::collections::HashMap;
    use std::sync::Mutex;

    use super::*;
    use crate::servicio_del_planificador::pruebas::bloquear;

    /// Storage de prueba: entrega las rutas que conoce y anota cada pedido.
    struct StorageDePrueba {
        archivos: HashMap<String, Vec<u8>>,
        pedidos: Mutex<Vec<String>>,
        sin_conexion: bool,
    }

    impl AlmacenDelCatalogo for StorageDePrueba {
        async fn descargar_del_catalogo(
            &self,
            _token: &str,
            ruta: &str,
        ) -> Result<Vec<u8>, FallaDeAuth> {
            self.pedidos.lock().unwrap().push(ruta.to_string());
            if self.sin_conexion {
                return Err(FallaDeAuth::SinConexion);
            }
            self.archivos
                .get(ruta)
                .cloned()
                .ok_or(FallaDeAuth::Rechazo {
                    estado: 404,
                    codigo: String::new(),
                })
        }
    }

    fn storage(sin_conexion: bool) -> StorageDePrueba {
        let archivos = [
            "templates/claro/thumbnail.png",
            "templates/claro/background.jpg",
            "images/mar.jpg",
            "images/mar-t.jpg",
        ]
        .into_iter()
        .map(|r| (r.to_string(), format!("bytes de {r}").into_bytes()))
        .collect();
        StorageDePrueba {
            archivos,
            pedidos: Mutex::new(Vec::new()),
            sin_conexion,
        }
    }

    /// Una base con la plantilla «Claro», la por defecto y la imagen «Mar» del catálogo.
    fn base() -> BaseLocal {
        let base = BaseLocal::en_memoria();
        bloquear(async {
            let pool = base.pool().await.unwrap();
            for sql in [
                "INSERT OR IGNORE INTO catalog_font (id, family_name, display_name, file_path, license, fetched_at) \
                 VALUES ('rubik', 'Rubik', 'Rubik', 'fonts/rubik.woff2', 'OFL', '2026-11-23T00:00:00.000Z')",
                "INSERT OR IGNORE INTO catalog_template (id, name, thumbnail_path, bundle_path, \
                 default_background_path, default_color_primary, default_color_secondary, default_color_text, \
                 default_font_id, fetched_at) VALUES ('claro', 'Claro', 'templates/claro/thumbnail.png', \
                 'templates/claro/', 'templates/claro/background.jpg', '#F5F0FF', '#B6A560', '#17131D', 'rubik', \
                 '2026-11-23T00:00:00.000Z')",
                "INSERT OR IGNORE INTO catalog_image (id, name, storage_path, thumbnail_path, width, height, \
                 fetched_at) VALUES ('mar', 'Mar', 'images/mar.jpg', 'images/mar-t.jpg', 1920, 1080, \
                 '2026-11-23T00:00:00.000Z')",
            ] {
                sqlx::query(sql).execute(pool).await.unwrap();
            }
        });
        base
    }

    /// Una carpeta de archivos nueva y vacía, que se borra al terminar la prueba.
    struct Carpeta(std::path::PathBuf);

    impl Carpeta {
        fn nueva() -> Self {
            let ruta =
                std::env::temp_dir().join(format!("windgets-catalogo-{}", uuid::Uuid::new_v4()));
            std::fs::create_dir_all(&ruta).unwrap();
            Self(ruta)
        }
        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for Carpeta {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn sesion() -> Credenciales<'static> {
        Credenciales {
            user_id: "u1",
            token: "jwt",
        }
    }

    #[test]
    fn baja_las_miniaturas_y_los_fondos_del_catalogo() {
        let base = base();
        let carpeta = Carpeta::nueva();
        let almacen = storage(false);
        let cambiadas = bloquear(descargar_archivos_del_catalogo(
            &base,
            &almacen,
            &sesion(),
            carpeta.path(),
            0,
        ))
        .unwrap();
        assert_eq!(cambiadas, [CatalogKind::Template, CatalogKind::Image]);
        let miniatura = bloquear(ruta_local(
            &base,
            carpeta.path(),
            "template_thumbnail",
            "claro",
        ))
        .unwrap();
        assert_eq!(
            std::fs::read(miniatura.unwrap()).unwrap(),
            b"bytes de templates/claro/thumbnail.png"
        );
        for (kind, id) in [
            ("template_bundle", "claro"),
            ("catalog_thumbnail", "mar"),
            ("catalog_image", "mar"),
        ] {
            assert!(
                bloquear(ruta_local(&base, carpeta.path(), kind, id))
                    .unwrap()
                    .is_some(),
                "{kind}"
            );
        }
        // Un segundo ciclo no vuelve a pedir lo que ya está en el computador.
        let otra = storage(false);
        let cambiadas = bloquear(descargar_archivos_del_catalogo(
            &base,
            &otra,
            &sesion(),
            carpeta.path(),
            0,
        ))
        .unwrap();
        assert!(cambiadas.is_empty());
        assert!(otra.pedidos.lock().unwrap().is_empty());
    }

    #[test]
    fn sin_conexion_no_guarda_nada_y_lo_intenta_en_el_siguiente_ciclo() {
        let base = base();
        let carpeta = Carpeta::nueva();
        let almacen = storage(true);
        let cambiadas = bloquear(descargar_archivos_del_catalogo(
            &base,
            &almacen,
            &sesion(),
            carpeta.path(),
            0,
        ))
        .unwrap();
        assert!(cambiadas.is_empty());
        // Al primer «sin conexión» deja de pedir.
        assert_eq!(almacen.pedidos.lock().unwrap().len(), 1);
        assert!(
            bloquear(ruta_local(&base, carpeta.path(), "catalog_image", "mar"))
                .unwrap()
                .is_none()
        );
    }

    #[test]
    fn rechaza_rutas_fuera_de_la_carpeta() {
        for ruta in ["", "/etc/passwd", "../fuera.png", "a\\b.png", "C:/x.png"] {
            assert!(!ruta_del_catalogo_valida(ruta), "{ruta}");
        }
        assert!(ruta_del_catalogo_valida("images/mar-t.jpg"));
    }
}
