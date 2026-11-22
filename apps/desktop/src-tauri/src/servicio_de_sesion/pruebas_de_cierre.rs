//! Pruebas del Núcleo de HE-16-HU03 (cerrar sesión desde la pantalla Configuración). CA02 y CA05 son de la
//! vista (Vitest): abrir y cancelar la confirmación no llama al Núcleo.

use super::pruebas::*;
use super::*;
use crate::servicio_del_planificador::pruebas::{bloquear, con_semilla, contar, crear, params};

/// Una carpeta de archivos del usuario con una imagen propia descargada.
fn carpeta_con_archivos() -> std::path::PathBuf {
    let carpeta = std::env::temp_dir().join(format!("windgets-hu03-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(carpeta.join("uploaded")).unwrap();
    std::fs::write(carpeta.join("uploaded").join("foto.png"), [1, 2, 3]).unwrap();
    carpeta
}

/// El servicio de sesión con la sesión de «Prueba» guardada en `session.bin`.
fn con_sesion() -> ServicioDeSesion<AuthDePrueba, RelojDePrueba> {
    let (servicio, _) = servicio();
    assert!(servicio.almacen.guardar(&SesionGuardada {
        access_token: "acceso".into(),
        refresh_token: "renovacion".into(),
        expires_at: i64::MAX,
        user_id: "00000000-0000-4000-8000-000000000001".into(),
        alias: "Prueba".into(),
    }));
    servicio
}

/// Comprueba lo que deja el cierre: sin token, la base vacía y lista para otra cuenta, sin archivos del usuario,
/// sin llamar a la nube y con el mensaje «Sesión cerrada.».
fn cierra_y_borra(pendientes_antes: i64) {
    let sesion = con_sesion();
    let planificador = con_semilla();
    crear(&planificador, params("Comprar pan", "2026-11-20")).unwrap();
    let base = planificador.base();
    assert_eq!(
        bloquear(sesion.informacion_de_cierre(base))
            .unwrap()
            .pending_count,
        pendientes_antes
    );
    let archivos = carpeta_con_archivos();

    let r = bloquear(sesion.cerrar_sesion(base, &archivos)).unwrap();

    assert_eq!(r.mensaje.message, "Sesión cerrada.");
    // RNF-19: 0 tokens tras cerrar sesión.
    assert_eq!(sesion.sesion_guardada(), None);
    assert_eq!(
        sesion.estado_de_sesion().state,
        AuthSessionStateState::SignedOut
    );
    // D-190: la base local de la cuenta se borra, con sus cambios pendientes sin enviar.
    for tabla in [
        "card",
        "profile",
        "kanban_column",
        "catalog_color",
        "pending_change",
    ] {
        assert_eq!(
            contar(&planificador, &format!("SELECT count(*) FROM {tabla}")),
            0,
            "{tabla}"
        );
    }
    assert_eq!(
        bloquear(sesion.informacion_de_cierre(base))
            .unwrap()
            .pending_count,
        0
    );
    // Los archivos del usuario (local_file) también.
    assert!(!archivos.exists());
    // No se sincronizan los cambios pendientes: el cierre no llama a la nube.
    assert!(sesion.auth().llamadas().is_empty());
}

#[test]
fn ca_he_16_hu03_ca01() {
    // HE-16-HU03-CA01 · Cierre de sesión confirmado, sin cambios pendientes de sincronizar (ET03, ET06; RNF-19,
    // D-190). La tarjeta de la semilla se da por enviada: sin cambios pendientes.
    let sesion = con_sesion();
    let planificador = con_semilla();
    let base = planificador.base();
    assert_eq!(
        bloquear(sesion.informacion_de_cierre(base))
            .unwrap()
            .pending_count,
        0
    );
    let archivos = carpeta_con_archivos();
    let r = bloquear(sesion.cerrar_sesion(base, &archivos)).unwrap();
    assert_eq!(
        (r.mensaje.code.as_str(), r.mensaje.message.as_str()),
        ("auth_sign_out", "Sesión cerrada.")
    );
    assert_eq!(sesion.sesion_guardada(), None);
    assert_eq!(contar(&planificador, "SELECT count(*) FROM profile"), 0);
    assert!(!archivos.exists());
}

#[test]
fn ca_he_16_hu03_ca03() {
    // HE-16-HU03-CA03 · Con cambios pendientes de sincronizar, `auth_get_sign_out_info` los cuenta y la vista abre
    // el aviso M-12 (ET04, ET05).
    let sesion = con_sesion();
    let planificador = con_semilla();
    crear(&planificador, params("Comprar pan", "2026-11-20")).unwrap();
    let info = bloquear(sesion.informacion_de_cierre(planificador.base())).unwrap();
    assert!(info.pending_count > 0);
    // Consultar no cierra la sesión.
    assert!(sesion.sesion_guardada().is_some());
}

#[test]
fn ca_he_16_hu03_ca04() {
    // HE-16-HU03-CA04 · Confirmar el cierre con cambios sin sincronizar: se pierden sin enviarse.
    cierra_y_borra(1);
}

#[test]
fn la_base_vaciada_sirve_para_la_siguiente_sesion() {
    // Tras cerrar sesión la base queda como nueva: el esquema completo, con sus disparadores, y vacía.
    let sesion = con_sesion();
    let planificador = con_semilla();
    let base = planificador.base();
    bloquear(sesion.cerrar_sesion(base, &carpeta_con_archivos())).unwrap();
    let disparadores = contar(
        &planificador,
        "SELECT count(*) FROM sqlite_master WHERE type = 'trigger'",
    );
    assert!(disparadores > 0);
    let semilla = con_semilla();
    assert_eq!(
        contar(
            &semilla,
            "SELECT count(*) FROM sqlite_master WHERE type = 'table'"
        ),
        contar(
            &planificador,
            "SELECT count(*) FROM sqlite_master WHERE type = 'table'"
        )
    );
    assert_eq!(
        contar(
            &planificador,
            "SELECT count(*) FROM sqlite_master WHERE type = 'trigger'"
        ),
        contar(
            &semilla,
            "SELECT count(*) FROM sqlite_master WHERE type = 'trigger'"
        )
    );
}

/// Un almacén cuyo archivo de sesión Windows no deja borrar (HE-16-HU03-CA07).
#[derive(Default)]
struct AlmacenQueNoBorra(crate::repositorios_y_archivos_locales::SesionEnMemoria);

impl AlmacenDeSesion for AlmacenQueNoBorra {
    fn guardar(&self, sesion: &SesionGuardada) -> bool {
        self.0.guardar(sesion)
    }
    fn leer(&self) -> Option<SesionGuardada> {
        self.0.leer()
    }
    fn borrar(&self) -> bool {
        false
    }
}

#[test]
fn ca_he_16_hu03_ca07() {
    // HE-16-HU03-CA07 · Windows no deja borrar los datos de la sesión: `auth.sign_out_failed` con el aviso literal,
    // la sesión sigue iniciada y no se borra nada (ET09).
    let sesion = ServicioDeSesion::nuevo(
        AuthDePrueba::con_verificado(REGISTRADO),
        RelojDePrueba::default(),
        Box::new(AlmacenQueNoBorra::default()),
    );
    assert!(sesion.almacen.guardar(&SesionGuardada {
        access_token: "acceso".into(),
        refresh_token: "renovacion".into(),
        expires_at: i64::MAX,
        user_id: "00000000-0000-4000-8000-000000000001".into(),
        alias: "Prueba".into(),
    }));
    let planificador = con_semilla();
    let archivos = carpeta_con_archivos();
    let error = bloquear(sesion.cerrar_sesion(planificador.base(), &archivos)).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str()),
        (
            ErrorCode::AuthSignOutFailed,
            "No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo."
        )
    );
    assert!(sesion.sesion_guardada().is_some());
    assert!(contar(&planificador, "SELECT count(*) FROM profile") > 0);
    assert!(archivos.exists());
}

#[test]
fn ca_he_16_hu03_et09() {
    // HE-16-HU03-ET09 · Si los archivos no se pueden borrar, la sesión se cierra igual y la limpieza se repite al
    // abrir la aplicación; con una sesión guardada (otra cuenta) no se repite.
    let sesion = con_sesion();
    let planificador = con_semilla();
    let base = planificador.base();
    // Una ruta que es un archivo, no una carpeta: `remove_dir_all` falla.
    let no_se_borra = std::env::temp_dir().join(format!("windgets-et11-{}", uuid::Uuid::new_v4()));
    std::fs::write(&no_se_borra, [1]).unwrap();
    let r = bloquear(sesion.cerrar_sesion(base, &no_se_borra)).unwrap();
    assert_eq!(r.mensaje.message, "Sesión cerrada.");
    assert_eq!(sesion.sesion_guardada(), None);
    let marca = "SELECT count(*) FROM device_setting WHERE key = 'sign_out_cleanup_pending'";
    assert_eq!(contar(&planificador, marca), 1);

    // Al abrir de nuevo, con los archivos ya borrables, se repite y la marca desaparece.
    let archivos = carpeta_con_archivos();
    assert!(bloquear(sesion.repetir_limpieza_pendiente(base, &archivos)));
    assert!(!archivos.exists());
    assert_eq!(contar(&planificador, marca), 0);
    assert!(!bloquear(
        sesion.repetir_limpieza_pendiente(base, &archivos)
    ));

    // Con una sesión guardada no se toca la base de esa cuenta.
    bloquear(crate::servicio_de_sesion::marcar_limpieza_pendiente(base));
    let otra = con_sesion();
    crear(&planificador, params("Comprar pan", "2026-11-20")).ok();
    let archivos = carpeta_con_archivos();
    assert!(!bloquear(otra.repetir_limpieza_pendiente(base, &archivos)));
    assert!(archivos.exists());
    let _ = std::fs::remove_file(&no_se_borra);
}
