//! Uso de CPU del computador en Windows con `GetSystemTimes` (HE-04-HU09-CA04, CA05). Único lugar con `unsafe`
//! de esta lectura; cada bloque explica por qué es seguro.
#![allow(unsafe_code)]

use windows::Win32::Foundation::FILETIME;
use windows::Win32::System::Threading::GetSystemTimes;

fn valor(f: FILETIME) -> u64 {
    (u64::from(f.dwHighDateTime) << 32) | u64::from(f.dwLowDateTime)
}

/// Los tiempos acumulados del sistema: (inactivo, total).
pub fn tiempos() -> Option<(u64, u64)> {
    let mut inactivo = FILETIME::default();
    let mut nucleo = FILETIME::default();
    let mut usuario = FILETIME::default();
    // SAFETY: los tres punteros apuntan a variables locales vivas durante la llamada; Windows solo escribe en ellas.
    unsafe { GetSystemTimes(Some(&mut inactivo), Some(&mut nucleo), Some(&mut usuario)) }.ok()?;
    // El tiempo de núcleo ya incluye el inactivo.
    Some((valor(inactivo), valor(nucleo) + valor(usuario)))
}

/// El uso de CPU (0 a 100) entre dos lecturas de [`tiempos`].
pub fn uso(antes: (u64, u64), despues: (u64, u64)) -> f64 {
    let inactivo = despues.0.saturating_sub(antes.0) as f64;
    let total = despues.1.saturating_sub(antes.1) as f64;
    if total <= 0.0 {
        return 0.0;
    }
    (100.0 * (1.0 - inactivo / total)).clamp(0.0, 100.0)
}
