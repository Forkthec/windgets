//! El formato de hora corta de Windows para el widget Reloj (HE-04-HU03-ET02, ET04; IPC-DESK-14
//! `system_time_format_get`, EV-28 `time_format_changed`). D-214: el Reloj no tiene opción propia; sigue el
//! formato del computador y cambia cuando la persona lo cambia en Windows.
//!
//! El patrón se lee con `GetLocaleInfoEx(LOCALE_SSHORTTIME)` (solo en Windows) y se traduce aquí, sin llamadas a
//! Windows: `H` es de 24 horas y `h` de 12; dos letras piden el cero inicial. Si no se puede leer, 24 horas.
//!
//! DUDA: HE-04-HU03 ET02 no dice si las 24 horas por defecto llevan el cero inicial. Valor usado: sí, «08:05»,
//! como antes de P24 y como las horas de los bloques horarios (D-169) (docs/DUDAS.md).

use crate::tipos::{TimeFormat, TimeFormatHourCycle};

/// ET02: si no se puede leer el formato de Windows, 24 horas.
pub fn por_defecto() -> TimeFormat {
    TimeFormat {
        hour_cycle: TimeFormatHourCycle::H23,
        two_digit_hour: true,
    }
}

/// Traduce un patrón de hora corta de Windows («H:mm», «HH:mm», «h:mm tt», «hh:mm tt»…). El texto entre comillas
/// simples es literal y no cuenta. Sin letra de hora, el formato por defecto.
pub fn desde_el_patron(patron: &str) -> TimeFormat {
    let mut literal = false;
    let mut corrida: Option<(char, usize)> = None;
    let mut encontrada: Option<(char, usize)> = None;
    for letra in patron.chars() {
        if letra == '\'' {
            literal = !literal;
            corrida = None;
            continue;
        }
        if literal || (letra != 'H' && letra != 'h') {
            corrida = None;
            continue;
        }
        let largo = match corrida {
            Some((anterior, n)) if anterior == letra => n + 1,
            _ => 1,
        };
        corrida = Some((letra, largo));
        if encontrada.is_none_or(|(l, n)| l == letra && n < largo) {
            encontrada = Some((letra, largo));
        }
    }
    match encontrada {
        Some((letra, largo)) => TimeFormat {
            hour_cycle: if letra == 'H' {
                TimeFormatHourCycle::H23
            } else {
                TimeFormatHourCycle::H12
            },
            two_digit_hour: largo >= 2,
        },
        None => por_defecto(),
    }
}

/// El formato de hora corta del usuario en Windows; fuera de Windows, o si no se puede leer, 24 horas.
pub fn leer() -> TimeFormat {
    #[cfg(windows)]
    if let Some(patron) = patron_de_windows() {
        return desde_el_patron(&patron);
    }
    por_defecto()
}

/// `LOCALE_SSHORTTIME` del usuario (`LOCALE_NAME_USER_DEFAULT` es el nombre nulo).
#[cfg(windows)]
#[allow(unsafe_code)]
fn patron_de_windows() -> Option<String> {
    use windows::Win32::Globalization::{GetLocaleInfoEx, LOCALE_SSHORTTIME};
    use windows::core::PCWSTR;

    let mut bufer = [0u16; 80];
    // SAFETY: el búfer es local y GetLocaleInfoEx respeta su tamaño; el nombre nulo es el del usuario.
    let largo = unsafe { GetLocaleInfoEx(PCWSTR::null(), LOCALE_SSHORTTIME, Some(&mut bufer)) };
    // El largo incluye el cero final; 0 es un error.
    let largo = usize::try_from(largo).ok()?.checked_sub(1)?;
    Some(String::from_utf16_lossy(&bufer[..largo]))
}

#[cfg(test)]
mod pruebas {
    use super::*;

    fn formato(hour_cycle: TimeFormatHourCycle, two_digit_hour: bool) -> TimeFormat {
        TimeFormat {
            hour_cycle,
            two_digit_hour,
        }
    }

    #[test]
    fn ca_he_04_hu03_ca02() {
        // HE-04-HU03-CA02 · Formato de 24 horas: «H» es de 24 horas; «HH» pide el cero inicial (ET02).
        assert_eq!(
            desde_el_patron("H:mm"),
            formato(TimeFormatHourCycle::H23, false)
        );
        assert_eq!(
            desde_el_patron("HH:mm"),
            formato(TimeFormatHourCycle::H23, true)
        );
        assert_eq!(
            desde_el_patron("HH:mm:ss"),
            formato(TimeFormatHourCycle::H23, true)
        );
    }

    #[test]
    fn ca_he_04_hu03_ca03() {
        // HE-04-HU03-CA03 · Formato de 12 horas: «h» es de 12 horas; el texto entre comillas no cuenta.
        assert_eq!(
            desde_el_patron("h:mm tt"),
            formato(TimeFormatHourCycle::H12, false)
        );
        assert_eq!(
            desde_el_patron("hh:mm tt"),
            formato(TimeFormatHourCycle::H12, true)
        );
        assert_eq!(
            desde_el_patron("'Hora' h:mm tt"),
            formato(TimeFormatHourCycle::H12, false)
        );
    }

    #[test]
    fn ca_he_04_hu03_et02() {
        // HE-04-HU03-ET02 · Si no se puede leer el formato de Windows (o no trae hora), 24 horas.
        assert_eq!(por_defecto(), formato(TimeFormatHourCycle::H23, true));
        assert_eq!(desde_el_patron(""), por_defecto());
        assert_eq!(desde_el_patron("mm:ss"), por_defecto());
        // Fuera de Windows no hay formato que leer.
        #[cfg(not(windows))]
        assert_eq!(leer(), por_defecto());
    }
}
