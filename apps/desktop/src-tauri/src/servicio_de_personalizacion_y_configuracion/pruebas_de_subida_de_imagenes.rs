//! Pruebas del Núcleo de HE-02-HU03-CA09 con INT-09 (P26): la imagen propia sube a Storage antes que su fila,
//! se reintenta tras una falla y vuelve a bajar en otro computador o tras cerrar sesión.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use super::pruebas_de_imagenes::{archivo, carpeta, png};
use super::pruebas_del_tema_en_edicion::con_temas;
use super::*;
use crate::cliente_de_supabase::FallaDeAuth;
use crate::motor_de_sincronizacion::archivos::{
    AlmacenDeImagenes, TrasLaFalla, descargar_imagenes, ruta_de_imagen_valida, subir_pendientes,
    toca_subir, tras_la_falla,
};
use crate::motor_de_sincronizacion::{self, Credenciales, NubeDeSincronizacion};
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{
    CatalogPullParams, CatalogPullResultVariant2, ImportPurpose, Instant, SyncChangeResult,
    SyncChangeStatus, SyncPullParams, SyncPullResult, SyncPushParams, SyncPushResult,
};

const AHORA_MS: i64 = 1_793_600_000_000;
const SESION: Credenciales<'static> = Credenciales {
    user_id: USUARIO,
    token: "jwt",
};

/// Doble de Storage: guarda lo subido y responde con `falla` si se le indica.
#[derive(Default)]
struct StorageDePrueba {
    falla: Mutex<Option<FallaDeAuth>>,
    objetos: Mutex<Vec<(String, String, Vec<u8>)>>,
}

impl AlmacenDeImagenes for StorageDePrueba {
    async fn subir(
        &self,
        _token: &str,
        ruta: &str,
        tipo: &str,
        bytes: Vec<u8>,
    ) -> Result<(), FallaDeAuth> {
        if let Some(falla) = self.falla.lock().unwrap().clone() {
            return Err(falla);
        }
        self.objetos
            .lock()
            .unwrap()
            .push((ruta.to_string(), tipo.to_string(), bytes));
        Ok(())
    }

    async fn descargar(&self, _token: &str, ruta: &str) -> Result<Vec<u8>, FallaDeAuth> {
        self.objetos
            .lock()
            .unwrap()
            .iter()
            .find(|(r, _, _)| r == ruta)
            .map(|(_, _, bytes)| bytes.clone())
            .ok_or(FallaDeAuth::Rechazo {
                estado: 404,
                codigo: String::new(),
            })
    }
}

/// Doble de la nube que responde `applied` y guarda los tipos de entidad enviados.
#[derive(Default)]
struct NubeDePrueba {
    enviados: Mutex<Vec<String>>,
}

impl NubeDeSincronizacion for NubeDePrueba {
    async fn sync_push(
        &self,
        _token: &str,
        params: &SyncPushParams,
    ) -> Result<SyncPushResult, FallaDeAuth> {
        let mut enviados = self.enviados.lock().unwrap();
        for cambio in &params.p_changes {
            enviados.push(
                serde_json::to_value(&cambio.entity_kind)
                    .unwrap()
                    .as_str()
                    .unwrap()
                    .to_string(),
            );
        }
        Ok(SyncPushResult {
            server_now: Instant(motor_de_sincronizacion::instante(AHORA_MS)),
            results: params
                .p_changes
                .iter()
                .map(|c| SyncChangeResult {
                    change_id: c.change_id,
                    status: SyncChangeStatus::Applied,
                    conflict: false,
                    reason: None,
                    row: None,
                })
                .collect(),
            max_seq: 1,
        })
    }

    async fn sync_pull(
        &self,
        _token: &str,
        params: &SyncPullParams,
    ) -> Result<SyncPullResult, FallaDeAuth> {
        Ok(SyncPullResult {
            server_now: Instant(motor_de_sincronizacion::instante(AHORA_MS)),
            rows: Vec::new(),
            next_seq: params.p_since_seq,
            has_more: false,
        })
    }

    async fn server_time(&self, _token: &str) -> Result<Instant, FallaDeAuth> {
        Err(FallaDeAuth::SinRespuesta)
    }

    async fn catalog_pull(
        &self,
        _token: &str,
        _params: &CatalogPullParams,
    ) -> Result<Option<CatalogPullResultVariant2>, FallaDeAuth> {
        Ok(None)
    }
}

/// Una imagen propia elegida, con un cambio de tarjeta guardado después; devuelve la carpeta de archivos y el id.
fn con_imagen_elegida() -> (BaseLocal, PathBuf, String) {
    let (base, servicio) = con_temas();
    let dir = carpeta();
    let ruta = archivo(&dir, "fondo.png", &png(3, 2));
    let archivos = dir.join("files");
    let resultado = bloquear(servicio.importar_imagen(
        &base,
        USUARIO,
        &ruta,
        &ImportPurpose::Background,
        &archivos,
        AHORA_MS,
    ))
    .unwrap();
    bloquear(async {
        let mut c = base.pool().await.unwrap().acquire().await.unwrap();
        crate::repositorios_y_archivos_locales::encolar_cambio(
            &mut c,
            "card",
            "00000000-0000-4000-8000-0000000000aa",
            "upsert",
            &serde_json::json!({ "title": { "value": "T", "modified_at": motor_de_sincronizacion::instante(AHORA_MS) } }),
            &motor_de_sincronizacion::instante(AHORA_MS),
        )
        .await
        .unwrap();
    });
    (base, archivos, resultado.uploaded_image_id.0)
}

fn enviar(base: &BaseLocal, nube: &NubeDePrueba) {
    bloquear(motor_de_sincronizacion::enviar(
        base,
        nube,
        &SESION,
        true,
        true,
        AHORA_MS + 10_000,
    ))
    .unwrap();
}

fn subir(base: &BaseLocal, storage: &StorageDePrueba, archivos: &Path) -> (i64, bool) {
    let ronda = bloquear(subir_pendientes(base, storage, &SESION, archivos, true)).unwrap();
    (ronda.subidas, ronda.reintentar)
}

fn cola(base: &BaseLocal) -> Vec<(String, i64, Option<String>)> {
    bloquear(async {
        sqlx::query_as("SELECT status, attempts, last_error FROM file_upload_queue")
            .fetch_all(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn ca_he_02_hu03_ca09_la_imagen_sube_antes_que_su_fila() {
    // HE-02-HU03-CA09 · La imagen propia se ve «incluso después de cerrar y volver a abrir la aplicación»: tiene que
    // llegar a Storage (INT-09). Mientras no sube, ni su fila ni los cambios posteriores llegan a la nube.
    let (base, archivos, id) = con_imagen_elegida();
    let nube = NubeDePrueba::default();
    enviar(&base, &nube);
    assert!(nube.enviados.lock().unwrap().is_empty());

    let storage = StorageDePrueba::default();
    assert_eq!(subir(&base, &storage, &archivos), (1, false));
    let objetos = storage.objetos.lock().unwrap().clone();
    assert_eq!(objetos.len(), 1);
    assert_eq!(objetos[0].0, format!("{USUARIO}/{id}.png"));
    assert_eq!(objetos[0].1, "image/png");
    assert_eq!(objetos[0].2, png(3, 2));
    assert!(cola(&base).is_empty());

    // Con el archivo arriba, la fila sale antes que el cambio que vino después.
    enviar(&base, &nube);
    assert_eq!(
        *nube.enviados.lock().unwrap(),
        vec!["uploaded_image".to_string(), "card".to_string()]
    );
}

#[test]
fn ca_he_02_hu03_ca09_se_reintenta_tras_una_falla() {
    // HE-15-HU01-ET04 con INT-09: sin conexión la imagen queda en la cola con su intento y su código, y se vuelve a
    // intentar al minuto; el cambio sigue esperando.
    let (base, archivos, _) = con_imagen_elegida();
    let storage = StorageDePrueba::default();
    *storage.falla.lock().unwrap() = Some(FallaDeAuth::SinConexion);
    assert_eq!(subir(&base, &storage, &archivos), (0, true));
    assert_eq!(
        cola(&base),
        vec![("queued".to_string(), 1, Some("net.offline".to_string()))]
    );
    let nube = NubeDePrueba::default();
    enviar(&base, &nube);
    assert!(nube.enviados.lock().unwrap().is_empty());

    assert!(!toca_subir(Some(AHORA_MS), AHORA_MS + 59_999));
    assert!(toca_subir(Some(AHORA_MS), AHORA_MS + 60_000));
    assert!(toca_subir(None, AHORA_MS));

    *storage.falla.lock().unwrap() = None;
    assert_eq!(subir(&base, &storage, &archivos), (1, false));
    enviar(&base, &nube);
    assert_eq!(nube.enviados.lock().unwrap().len(), 2);
}

#[test]
fn ca_he_02_hu03_ca09_401_y_403_son_de_sesion() {
    // INT-09, «Errores»: 401 y 403 son un problema de sesión y se reintentan con el token renovado; 413 y el tipo no
    // permitido no se reintentan.
    let rechazo = |estado| FallaDeAuth::Rechazo {
        estado,
        codigo: String::new(),
    };
    assert_eq!(
        tras_la_falla(&rechazo(401)),
        TrasLaFalla::Reintentar("session.expired")
    );
    assert_eq!(
        tras_la_falla(&rechazo(403)),
        TrasLaFalla::Reintentar("session.expired")
    );
    assert_eq!(
        tras_la_falla(&FallaDeAuth::SinRespuesta),
        TrasLaFalla::Reintentar("service.unavailable")
    );
    assert_eq!(
        tras_la_falla(&rechazo(413)),
        TrasLaFalla::Descartar("image.too_large")
    );
    assert_eq!(
        tras_la_falla(&rechazo(400)),
        TrasLaFalla::Descartar("image.format_not_allowed")
    );

    let (base, archivos, _) = con_imagen_elegida();
    let storage = StorageDePrueba::default();
    *storage.falla.lock().unwrap() = Some(rechazo(401));
    assert_eq!(subir(&base, &storage, &archivos), (0, true));
    assert_eq!(
        cola(&base),
        vec![("queued".to_string(), 1, Some("session.expired".to_string()))]
    );
}

#[test]
fn ca_he_02_hu03_ca09_archivo_local_que_ya_no_existe() {
    // DUDA P26: si el archivo local ya no existe, la subida queda `failed` con `file.missing` y el cambio deja de
    // esperar, para no detener la cola de cambios.
    let (base, archivos, id) = con_imagen_elegida();
    std::fs::remove_file(archivos.join(format!("{USUARIO}/{id}.png"))).unwrap();
    let storage = StorageDePrueba::default();
    assert_eq!(subir(&base, &storage, &archivos), (0, false));
    assert_eq!(
        cola(&base),
        vec![("failed".to_string(), 1, Some("file.missing".to_string()))]
    );
    let nube = NubeDePrueba::default();
    enviar(&base, &nube);
    assert_eq!(nube.enviados.lock().unwrap().len(), 2);
}

#[test]
fn ca_he_02_hu03_ca09_baja_en_otro_computador() {
    // INT-09, «Descargar»: en otro computador (o tras cerrar sesión) la fila llega sin el archivo; el Núcleo lo baja,
    // verifica tamaño y sha256, lo guarda y el fondo queda listo.
    let (base, archivos, id) = con_imagen_elegida();
    let storage = StorageDePrueba::default();
    subir(&base, &storage, &archivos);
    // El otro computador: la misma fila, sin archivo ni `local_file`.
    let otro = carpeta().join("files");
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query("DELETE FROM local_file")
            .execute(pool)
            .await
            .unwrap();
    });
    let bajadas = bloquear(descargar_imagenes(
        &base, &storage, &SESION, &otro, AHORA_MS,
    ))
    .unwrap();
    assert_eq!(bajadas, vec![id.clone()]);
    assert_eq!(
        std::fs::read(otro.join(format!("{USUARIO}/{id}.png"))).unwrap(),
        png(3, 2)
    );
    let carpetas = escritorio::Carpetas {
        archivos: otro.clone(),
        recursos: otro.clone(),
    };
    let servicio = ServicioDePersonalizacion::default();
    let recurso = bloquear(servicio.recurso(
        &base,
        USUARIO,
        &carpetas,
        &crate::tipos::AssetKind::UploadedImage,
        &id,
    ))
    .unwrap();
    assert_eq!(recurso.state, crate::tipos::AssetResolveResultState::Ready);
    // Ya está: no se vuelve a bajar.
    let otra_vez = bloquear(descargar_imagenes(
        &base, &storage, &SESION, &otro, AHORA_MS,
    ))
    .unwrap();
    assert!(otra_vez.is_empty());
}

#[test]
fn ca_he_02_hu03_ca09_descarga_que_no_coincide() {
    // Un archivo que no coincide con su sha256, o que aún no está en Storage (404), no se guarda.
    let (base, archivos, id) = con_imagen_elegida();
    let storage = StorageDePrueba::default();
    subir(&base, &storage, &archivos);
    bloquear(async {
        sqlx::query("DELETE FROM local_file")
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    storage.objetos.lock().unwrap()[0].2 = png(4, 2);
    let otro = carpeta().join("files");
    let bajadas = bloquear(descargar_imagenes(
        &base, &storage, &SESION, &otro, AHORA_MS,
    ))
    .unwrap();
    assert!(bajadas.is_empty());
    assert!(!otro.join(format!("{USUARIO}/{id}.png")).exists());
    storage.objetos.lock().unwrap().clear();
    let bajadas = bloquear(descargar_imagenes(
        &base, &storage, &SESION, &otro, AHORA_MS,
    ))
    .unwrap();
    assert!(bajadas.is_empty());
}

#[test]
fn ca_he_02_hu03_ca09_ruta_dentro_de_la_carpeta_de_la_cuenta() {
    // RNF-22: la ruta descargada nunca sale de la carpeta de la cuenta.
    let id = "5d1c9a52-8e43-4b8d-a1f0-3c9d7e2b6a14";
    assert!(ruta_de_imagen_valida(
        USUARIO,
        &format!("{USUARIO}/{id}.png")
    ));
    assert!(ruta_de_imagen_valida(
        USUARIO,
        &format!("{USUARIO}/{id}.jpeg")
    ));
    assert!(!ruta_de_imagen_valida(
        USUARIO,
        &format!("{USUARIO}/../{id}.png")
    ));
    assert!(!ruta_de_imagen_valida(USUARIO, &format!("otro/{id}.png")));
    assert!(!ruta_de_imagen_valida(
        USUARIO,
        &format!("{USUARIO}/{id}.gif")
    ));
    assert!(!ruta_de_imagen_valida(
        USUARIO,
        &format!("{USUARIO}/x/{id}.png")
    ));
}
