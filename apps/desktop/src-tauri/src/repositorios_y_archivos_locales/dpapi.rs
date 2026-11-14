//! DPAPI de Windows para `session.bin` (INT-11; RNF-19). Único lugar con `unsafe` de este componente; cada
//! bloque explica por qué es seguro.
#![allow(unsafe_code)]

use windows::Win32::Foundation::{HLOCAL, LocalFree};
use windows::Win32::Security::Cryptography::{
    CRYPT_INTEGER_BLOB, CRYPTPROTECT_UI_FORBIDDEN, CryptProtectData, CryptUnprotectData,
};

/// Copia el resultado de DPAPI y libera su memoria con `LocalFree`.
fn copiar_y_liberar(salida: CRYPT_INTEGER_BLOB) -> Vec<u8> {
    // SAFETY: DPAPI devolvió `cbData` bytes válidos en `pbData`, reservados con LocalAlloc; se copian antes de
    // liberarlos y no se vuelven a usar.
    unsafe {
        let copia = std::slice::from_raw_parts(salida.pbData, salida.cbData as usize).to_vec();
        let _ = LocalFree(Some(HLOCAL(salida.pbData.cast())));
        copia
    }
}

fn entrada(datos: &[u8]) -> Option<CRYPT_INTEGER_BLOB> {
    Some(CRYPT_INTEGER_BLOB {
        cbData: u32::try_from(datos.len()).ok()?,
        pbData: datos.as_ptr().cast_mut(),
    })
}

/// Cifra con el alcance del usuario actual (`CryptProtectData`).
pub fn proteger(claro: &[u8]) -> Option<Vec<u8>> {
    let entrada = entrada(claro)?;
    let mut salida = CRYPT_INTEGER_BLOB::default();
    // SAFETY: `entrada` apunta a `claro`, que vive durante la llamada; DPAPI no escribe en la entrada y llena
    // `salida`, que se libera en `copiar_y_liberar`.
    let r = unsafe {
        CryptProtectData(
            &entrada,
            None,
            None,
            None,
            None,
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut salida,
        )
    };
    r.ok().map(|()| copiar_y_liberar(salida))
}

/// Descifra lo que cifró `proteger` para el mismo usuario (`CryptUnprotectData`).
pub fn desproteger(cifrado: &[u8]) -> Option<Vec<u8>> {
    let entrada = entrada(cifrado)?;
    let mut salida = CRYPT_INTEGER_BLOB::default();
    // SAFETY: igual que en `proteger`: la entrada vive durante la llamada y la salida se libera al copiarla.
    let r = unsafe {
        CryptUnprotectData(
            &entrada,
            None,
            None,
            None,
            None,
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut salida,
        )
    };
    r.ok().map(|()| copiar_y_liberar(salida))
}
