//! Inicio automático con Windows (INT-08; HE-16-HU02; D-051, D-081). Es propio de cada computador: vive en el
//! registro del usuario, no en la base local ni en la nube (ET07).
//!
//! - Activar: el valor de cadena `Windgets` en `HKCU\…\CurrentVersion\Run` con `"<ruta>\Windgets.exe" --autostart`
//!   (el mismo que escribe el instalador con la casilla de CD-02-HU02). Desactivar: borrar ese valor.
//! - Estado real (ET06, CA03): activo solo si existe el valor de `Run` y no está deshabilitado en
//!   `Explorer\StartupApproved\Run\Windgets` (primer byte `03`; `02` o `06`, o sin valor, es habilitado).

use std::path::Path;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use crate::messages;
use crate::servicio_de_sesion::ConMensaje;
use crate::tipos::{AppError, AutostartState, ErrorCode, ResultMessage};

/// Nombre del valor en `Run` y en `StartupApproved\Run` (INT-08).
pub const NOMBRE: &str = "Windgets";

/// Lo que el Núcleo lee y escribe del registro de Windows para el inicio automático.
pub trait RegistroDeArranque: Send + Sync {
    /// El valor `Windgets` de `Run`, si existe.
    fn valor_run(&self) -> Option<String>;
    /// El valor binario `Windgets` de `StartupApproved\Run`, si existe.
    fn aprobado(&self) -> Option<Vec<u8>>;
    /// Escribe el valor de `Run`. `false` si Windows no lo permitió.
    fn escribir_run(&self, comando: &str) -> bool;
    /// Borra el valor de `Run`. `true` si ya no existe.
    fn borrar_run(&self) -> bool;
    /// Borra el valor de `StartupApproved\Run`. `true` si ya no existe.
    fn borrar_aprobado(&self) -> bool;
}

/// `StartupApproved` deshabilitado: el primer byte es `03` (INT-08).
fn deshabilitado_en_windows(aprobado: Option<&[u8]>) -> bool {
    aprobado.and_then(|b| b.first()) == Some(&0x03)
}

/// IPC-DESK-10 `autostart_get`: el estado que tiene Windows (HE-16-HU02-ET06, CA03).
pub fn estado(registro: &dyn RegistroDeArranque) -> AutostartState {
    AutostartState {
        enabled: registro.valor_run().is_some()
            && !deshabilitado_en_windows(registro.aprobado().as_deref()),
    }
}

/// El valor que va en `Run` (INT-08).
pub fn comando(ejecutable: &Path) -> String {
    format!("\"{}\" --autostart", ejecutable.display())
}

/// IPC-DESK-11 `autostart_set` (HE-16-HU02-CA01, CA02, CA05). Escribe o borra el valor de `Run` y vuelve a leer
/// el estado de Windows: si no quedó como se pidió, responde `autostart.failed` y el interruptor conserva el
/// estado que tiene Windows (ET09). No se sincroniza (ET07): no toca la base local ni `pending_change`.
///
/// Al activar se borra también la marca de `StartupApproved`: si la persona deshabilitó la aplicación en las
/// aplicaciones de arranque de Windows, sin borrarla el valor de `Run` no la abriría (ET04).
pub fn cambiar(
    registro: &dyn RegistroDeArranque,
    enabled: bool,
    ejecutable: &Path,
) -> Result<ConMensaje<AutostartState>, AppError> {
    if enabled {
        let _ = registro.escribir_run(&comando(ejecutable)) && registro.borrar_aprobado();
    } else {
        let _ = registro.borrar_run();
    }
    let ahora = estado(registro);
    if ahora.enabled != enabled {
        return Err(AppError {
            code: ErrorCode::AutostartFailed,
            message: messages::NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO.to_string(),
            field: None,
            params: None,
        });
    }
    Ok(ConMensaje {
        valor: ahora,
        mensaje: ResultMessage {
            code: "autostart_set".into(),
            message: if enabled {
                messages::INICIO_AUTOMATICO_ACTIVADO
            } else {
                messages::INICIO_AUTOMATICO_DESACTIVADO
            }
            .into(),
            params: None,
        },
    })
}

/// Registro en memoria: las pruebas y los sistemas que no son Windows (la aplicación es solo para Windows).
#[derive(Default)]
pub struct RegistroEnMemoria {
    run: Mutex<Option<String>>,
    aprobado: Mutex<Option<Vec<u8>>>,
    /// Simula que Windows no deja cambiar las aplicaciones de arranque (HE-16-HU02-CA05).
    pub bloqueado: AtomicBool,
}

impl RegistroEnMemoria {
    fn bloqueado(&self) -> bool {
        self.bloqueado.load(Ordering::SeqCst)
    }

    /// Lo que haría la persona en las aplicaciones de arranque de Windows (HE-16-HU02-CA03).
    pub fn fijar_aprobado(&self, valor: Option<Vec<u8>>) {
        if let Ok(mut a) = self.aprobado.lock() {
            *a = valor;
        }
    }
}

impl RegistroDeArranque for RegistroEnMemoria {
    fn valor_run(&self) -> Option<String> {
        self.run.lock().ok().and_then(|r| r.clone())
    }

    fn aprobado(&self) -> Option<Vec<u8>> {
        self.aprobado.lock().ok().and_then(|a| a.clone())
    }

    fn escribir_run(&self, comando: &str) -> bool {
        !self.bloqueado()
            && self
                .run
                .lock()
                .map(|mut r| *r = Some(comando.into()))
                .is_ok()
    }

    fn borrar_run(&self) -> bool {
        !self.bloqueado() && self.run.lock().map(|mut r| *r = None).is_ok()
    }

    fn borrar_aprobado(&self) -> bool {
        !self.bloqueado() && self.aprobado.lock().map(|mut a| *a = None).is_ok()
    }
}

/// El registro de la aplicación: el de Windows; en otro sistema, en memoria.
pub fn registro_de_la_aplicacion() -> Box<dyn RegistroDeArranque> {
    #[cfg(windows)]
    let registro: Box<dyn RegistroDeArranque> = Box::new(super::registro::RegistroDeWindows);
    #[cfg(not(windows))]
    let registro: Box<dyn RegistroDeArranque> = Box::new(RegistroEnMemoria::default());
    registro
}

#[cfg(test)]
mod pruebas {
    use super::*;

    const EXE: &str = r"C:\Users\ana\AppData\Local\Programs\Windgets\Windgets.exe";

    fn con_inicio(activo: bool) -> RegistroEnMemoria {
        let registro = RegistroEnMemoria::default();
        if activo {
            assert!(registro.escribir_run(&comando(Path::new(EXE))));
        }
        assert_eq!(estado(&registro).enabled, activo);
        registro
    }

    #[test]
    fn ca_he_16_hu02_ca01() {
        // HE-16-HU02-CA01 · Desactivar: se borra el valor de `Run` (la aplicación no se abre sola, ET05) y el
        // mensaje es «Inicio automático desactivado.» (ET03).
        let registro = con_inicio(true);
        let r = cambiar(&registro, false, Path::new(EXE)).unwrap();
        assert!(!r.valor.enabled);
        assert_eq!(r.mensaje.message, "Inicio automático desactivado.");
        assert_eq!(registro.valor_run(), None);
    }

    #[test]
    fn ca_he_16_hu02_ca02() {
        // HE-16-HU02-CA02 · Activar: el valor de `Run` abre la aplicación con `--autostart` en el siguiente inicio
        // de Windows (ET04) y el mensaje es «Inicio automático activado.».
        let registro = con_inicio(false);
        let r = cambiar(&registro, true, Path::new(EXE)).unwrap();
        assert!(r.valor.enabled);
        assert_eq!(r.mensaje.message, "Inicio automático activado.");
        assert_eq!(
            registro.valor_run().as_deref(),
            Some(r#""C:\Users\ana\AppData\Local\Programs\Windgets\Windgets.exe" --autostart"#)
        );
        // Si la persona la había deshabilitado en Windows, al activarla de nuevo queda habilitada.
        let deshabilitada = con_inicio(false);
        deshabilitada.fijar_aprobado(Some(vec![0x03, 0, 0, 0]));
        assert!(
            cambiar(&deshabilitada, true, Path::new(EXE))
                .unwrap()
                .valor
                .enabled
        );
    }

    #[test]
    fn ca_he_16_hu02_ca03() {
        // HE-16-HU02-CA03 · Cambio hecho desde Windows: el interruptor muestra el estado que tiene Windows (ET06).
        let registro = con_inicio(true);
        registro.fijar_aprobado(Some(vec![0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
        assert!(!estado(&registro).enabled);
        registro.fijar_aprobado(Some(vec![0x02, 0, 0, 0]));
        assert!(estado(&registro).enabled);
        registro.fijar_aprobado(Some(vec![0x06]));
        assert!(estado(&registro).enabled);
    }

    #[test]
    fn ca_he_16_hu02_ca04() {
        // HE-16-HU02-CA04 · Propio de cada computador: el cambio solo toca el registro de este computador; el del
        // computador B conserva su estado (ET07). `cambiar` no recibe la base local ni la cola de cambios.
        let a = con_inicio(true);
        let b = con_inicio(true);
        cambiar(&a, false, Path::new(EXE)).unwrap();
        assert!(!estado(&a).enabled);
        assert!(estado(&b).enabled);
    }

    #[test]
    fn ca_he_16_hu02_ca05() {
        // HE-16-HU02-CA05 · Windows no permite cambiar las aplicaciones de arranque: `autostart.failed` con su
        // mensaje, y el estado sigue el de Windows (ET09).
        let registro = con_inicio(false);
        registro.bloqueado.store(true, Ordering::SeqCst);
        let e = cambiar(&registro, true, Path::new(EXE)).unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str()),
            (
                ErrorCode::AutostartFailed,
                "No pudimos cambiar el inicio automático. Intenta de nuevo."
            )
        );
        assert!(!estado(&registro).enabled);
    }
}
