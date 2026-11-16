//! Registro de Windows para el inicio automático (INT-08). Único lugar con `unsafe` de este componente; cada
//! bloque explica por qué es seguro.
#![allow(unsafe_code)]

use windows::Win32::Foundation::{ERROR_FILE_NOT_FOUND, ERROR_SUCCESS, WIN32_ERROR};
use windows::Win32::System::Registry::{
    HKEY_CURRENT_USER, REG_SZ, RRF_RT_REG_BINARY, RRF_RT_REG_SZ, RegDeleteKeyValueW, RegGetValueW,
    RegSetKeyValueW,
};
use windows::core::{HSTRING, PCWSTR};

use super::inicio_automatico::{NOMBRE, RegistroDeArranque};

const RUN: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const APROBADO: &str = r"Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run";

/// El registro del usuario actual (`HKCU`).
pub struct RegistroDeWindows;

/// Lee un valor de `HKCU\<clave>` con el tipo pedido; `None` si no existe o no se puede leer.
fn leer(
    clave: &str,
    flags: windows::Win32::System::Registry::REG_ROUTINE_FLAGS,
) -> Option<Vec<u8>> {
    let clave = HSTRING::from(clave);
    let nombre = HSTRING::from(NOMBRE);
    let mut largo = 0_u32;
    // SAFETY: las cadenas viven durante la llamada; sin búfer, Windows solo escribe el tamaño en `largo`.
    let r = unsafe {
        RegGetValueW(
            HKEY_CURRENT_USER,
            PCWSTR(clave.as_ptr()),
            PCWSTR(nombre.as_ptr()),
            flags,
            None,
            None,
            Some(&mut largo),
        )
    };
    if r != ERROR_SUCCESS {
        return None;
    }
    let mut datos = vec![0_u8; largo as usize];
    // SAFETY: `datos` tiene `largo` bytes y Windows escribe como máximo `largo` bytes en él.
    let r = unsafe {
        RegGetValueW(
            HKEY_CURRENT_USER,
            PCWSTR(clave.as_ptr()),
            PCWSTR(nombre.as_ptr()),
            flags,
            None,
            Some(datos.as_mut_ptr().cast()),
            Some(&mut largo),
        )
    };
    (r == ERROR_SUCCESS).then(|| {
        datos.truncate(largo as usize);
        datos
    })
}

/// Borra el valor `Windgets` de `HKCU\<clave>`; `true` si ya no existe.
fn borrar(clave: &str) -> bool {
    let clave = HSTRING::from(clave);
    let nombre = HSTRING::from(NOMBRE);
    // SAFETY: las cadenas viven durante la llamada.
    let r: WIN32_ERROR = unsafe {
        RegDeleteKeyValueW(
            HKEY_CURRENT_USER,
            PCWSTR(clave.as_ptr()),
            PCWSTR(nombre.as_ptr()),
        )
    };
    r == ERROR_SUCCESS || r == ERROR_FILE_NOT_FOUND
}

impl RegistroDeArranque for RegistroDeWindows {
    fn valor_run(&self) -> Option<String> {
        let datos = leer(RUN, RRF_RT_REG_SZ)?;
        let ancho: Vec<u16> = datos
            .chunks_exact(2)
            .map(|par| u16::from_le_bytes([par[0], par[1]]))
            .take_while(|&c| c != 0)
            .collect();
        Some(String::from_utf16_lossy(&ancho))
    }

    fn aprobado(&self) -> Option<Vec<u8>> {
        leer(APROBADO, RRF_RT_REG_BINARY)
    }

    fn escribir_run(&self, comando: &str) -> bool {
        let clave = HSTRING::from(RUN);
        let nombre = HSTRING::from(NOMBRE);
        let valor: Vec<u16> = comando.encode_utf16().chain(std::iter::once(0)).collect();
        let Ok(largo) = u32::try_from(valor.len() * 2) else {
            return false;
        };
        // SAFETY: `valor` es una cadena UTF-16 terminada en 0 de `largo` bytes que vive durante la llamada.
        let r = unsafe {
            RegSetKeyValueW(
                HKEY_CURRENT_USER,
                PCWSTR(clave.as_ptr()),
                PCWSTR(nombre.as_ptr()),
                REG_SZ.0,
                Some(valor.as_ptr().cast()),
                largo,
            )
        };
        r == ERROR_SUCCESS
    }

    fn borrar_run(&self) -> bool {
        borrar(RUN)
    }

    fn borrar_aprobado(&self) -> bool {
        borrar(APROBADO)
    }
}
