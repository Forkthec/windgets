//! Legibilidad de los colores del tema (HE-02-HU05-ET07, ET08, ET14 a ET16; R-13, RNF-26). Sigue
//! `interfaz.md`, «Tema a tokens»: tres pares sobre `superficie`, con el contraste de WCAG 2.1.
//!
//! DUDA: HE-02-HU05 ET11 y ET14 dan otras fórmulas para la superficie y el texto que `interfaz.md`; el contrato
//! IPC-THEME-05 remite a `interfaz.md` para los pares, y la interfaz ya se construyó con esas fórmulas (P00).
//! Valor usado: `interfaz.md` (docs/DUDAS.md).

use crate::tipos::{
    Hex, Legibility, LegibilityItem, LegibilityPair, LegibilitySuggestion, ThemeColors,
};

/// Un color en RGB, de 0 a 255 por canal.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct Rgb(pub u8, pub u8, pub u8);

const OSCURO: Rgb = Rgb(0x12, 0x12, 0x16);
const BLANCO: Rgb = Rgb(0xFF, 0xFF, 0xFF);

/// `#RRGGBB` (HE-02-HU05-ET04). Cualquier otra forma no es un color.
pub(crate) fn de_hex(texto: &str) -> Option<Rgb> {
    let cuerpo = texto.strip_prefix('#')?;
    if cuerpo.len() != 6 || !cuerpo.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let canal = |i: usize| u8::from_str_radix(&cuerpo[i..i + 2], 16).ok();
    Some(Rgb(canal(0)?, canal(2)?, canal(4)?))
}

/// `#RRGGBB` en mayúsculas (HE-02-HU05-ET13).
pub(crate) fn a_hex(c: Rgb) -> String {
    format!("#{:02X}{:02X}{:02X}", c.0, c.1, c.2)
}

/// «Mezclar A con B al n %»: `A × (1 − n) + B × n`, redondeado por canal.
fn mezclar(a: Rgb, b: Rgb, n: f64) -> Rgb {
    let canal = |x: u8, y: u8| (f64::from(x) * (1.0 - n) + f64::from(y) * n).round() as u8;
    Rgb(canal(a.0, b.0), canal(a.1, b.1), canal(a.2, b.2))
}

/// Luminancia relativa de WCAG 2.1.
fn luminancia(c: Rgb) -> f64 {
    let lineal = |x: u8| {
        let v = f64::from(x) / 255.0;
        if v <= 0.039_28 {
            v / 12.92
        } else {
            ((v + 0.055) / 1.055).powf(2.4)
        }
    };
    0.2126 * lineal(c.0) + 0.7152 * lineal(c.1) + 0.0722 * lineal(c.2)
}

/// `(L1 + 0,05) / (L2 + 0,05)`, con `L1` la mayor.
fn contraste(a: Rgb, b: Rgb) -> f64 {
    let (x, y) = (luminancia(a), luminancia(b));
    (x.max(y) + 0.05) / (x.min(y) + 0.05)
}

/// «Extremo»: `#121216` si el color del texto es claro (luminancia de 0,18 o más) y `#FFFFFF` si es oscuro.
fn extremo(texto: Rgb) -> Rgb {
    if luminancia(texto) >= 0.18 {
        OSCURO
    } else {
        BLANCO
    }
}

/// Los colores de la interfaz que entran en los pares.
struct Tokens {
    superficie: Rgb,
    tinta: Rgb,
    texto: Rgb,
    accion: Rgb,
}

fn tokens(secundario: Rgb, texto: Rgb) -> Tokens {
    let superficie = mezclar(secundario, extremo(texto), 0.60);
    Tokens {
        superficie,
        tinta: texto,
        texto: mezclar(texto, superficie, 0.15),
        accion: mezclar(secundario, texto, 0.30),
    }
}

const PARES: [(LegibilityPair, f64); 3] = [
    (LegibilityPair::InkSurface, 7.0),
    (LegibilityPair::TextSurface, 4.5),
    (LegibilityPair::ControlSurface, 3.0),
];

fn razones(secundario: Rgb, texto: Rgb) -> [f64; 3] {
    let t = tokens(secundario, texto);
    [
        contraste(t.tinta, t.superficie),
        contraste(t.texto, t.superficie),
        contraste(t.accion, t.superficie),
    ]
}

fn cumple(secundario: Rgb, texto: Rgb) -> bool {
    razones(secundario, texto)
        .iter()
        .zip(PARES)
        .all(|(r, (_, minimo))| *r >= minimo)
}

/// RGB → HSL, con la luminosidad de 0 a 100.
fn a_hsl(c: Rgb) -> (f64, f64, f64) {
    let (r, g, b) = (
        f64::from(c.0) / 255.0,
        f64::from(c.1) / 255.0,
        f64::from(c.2) / 255.0,
    );
    let (max, min) = (r.max(g).max(b), r.min(g).min(b));
    let l = (max + min) / 2.0;
    if (max - min).abs() < f64::EPSILON {
        return (0.0, 0.0, l * 100.0);
    }
    let d = max - min;
    let s = if l > 0.5 {
        d / (2.0 - max - min)
    } else {
        d / (max + min)
    };
    let h = if (max - r).abs() < f64::EPSILON {
        ((g - b) / d).rem_euclid(6.0)
    } else if (max - g).abs() < f64::EPSILON {
        (b - r) / d + 2.0
    } else {
        (r - g) / d + 4.0
    };
    (h * 60.0, s, l * 100.0)
}

fn de_hsl(h: f64, s: f64, l: f64) -> Rgb {
    let l = l / 100.0;
    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h / 60.0).rem_euclid(2.0) - 1.0).abs());
    let m = l - c / 2.0;
    let (r, g, b) = match (h / 60.0).floor() as i32 {
        0 => (c, x, 0.0),
        1 => (x, c, 0.0),
        2 => (0.0, c, x),
        3 => (0.0, x, c),
        4 => (x, 0.0, c),
        _ => (c, 0.0, x),
    };
    let canal = |v: f64| ((v + m) * 255.0).round().clamp(0.0, 255.0) as u8;
    Rgb(canal(r), canal(g), canal(b))
}

/// La legibilidad de los colores del tema. Sin avisos si los colores no son válidos (la vista muestra el error
/// del campo).
pub(crate) fn legibilidad(colores: &ThemeColors) -> Legibility {
    let (Some(secundario), Some(texto)) = (de_hex(&colores.secondary.0), de_hex(&colores.text.0))
    else {
        return Legibility {
            ok: true,
            items: Vec::new(),
            suggestion: None,
        };
    };
    let r = razones(secundario, texto);
    let items: Vec<LegibilityItem> = PARES
        .iter()
        .zip(r)
        .map(|((pair, min), ratio)| LegibilityItem {
            pair: pair.clone(),
            ratio,
            min: *min,
        })
        .collect();
    // ET15: el par que no cumple; si fallan varios, el de menor razón.
    let peor = items
        .iter()
        .filter(|i| i.ratio < i.min)
        .min_by(|a, b| a.ratio.total_cmp(&b.ratio))
        .cloned();
    let Some(peor) = peor else {
        return Legibility {
            ok: true,
            items,
            suggestion: None,
        };
    };
    let suggestion = Some(sugerencia(&peor.pair, secundario, texto));
    Legibility {
        ok: false,
        items,
        suggestion,
    }
}

/// HE-02-HU05-ET15 (`interfaz.md`, «Color sugerido»): el color del tema del primer plano del par (el del texto
/// para la tinta y el texto; el secundario para los controles), con su tono y su saturación, y la luminosidad
/// más cercana a la elegida, en pasos de 1 %, con la que se cumplen los tres pares; si empata, la más lejana de
/// la superficie. Si ninguna cumple, `#FFFFFF` o `#121216`, el que dé más contraste con la superficie.
fn sugerencia(par: &LegibilityPair, secundario: Rgb, texto: Rgb) -> LegibilitySuggestion {
    let es_control = *par == LegibilityPair::ControlSurface;
    let elegido = if es_control { secundario } else { texto };
    let con = |c: Rgb| {
        if es_control {
            (c, texto)
        } else {
            (secundario, c)
        }
    };
    let superficie = tokens(secundario, texto).superficie;
    let indice = PARES.iter().position(|(p, _)| p == par).unwrap_or(0);
    let (h, s, l) = a_hsl(elegido);
    let mut mejor: Option<(f64, f64, Rgb)> = None;
    for paso in 0..=100 {
        let candidato = de_hsl(h, s, f64::from(paso));
        let (sec, tex) = con(candidato);
        if !cumple(sec, tex) {
            continue;
        }
        let distancia = (f64::from(paso) - l).abs();
        let lejania = contraste(candidato, superficie);
        let mejora = match mejor {
            None => true,
            Some((d, lj, _)) => {
                distancia < d - 1e-9 || ((distancia - d).abs() < 1e-9 && lejania > lj)
            }
        };
        if mejora {
            mejor = Some((distancia, lejania, candidato));
        }
    }
    let color = match mejor {
        Some((_, _, c)) => c,
        None if contraste(BLANCO, superficie) >= contraste(OSCURO, superficie) => BLANCO,
        None => OSCURO,
    };
    let (sec, tex) = con(color);
    LegibilitySuggestion {
        pair: par.clone(),
        color: Hex(a_hex(color)),
        ratio: razones(sec, tex)[indice],
    }
}

#[cfg(test)]
pub(crate) fn contraste_de_prueba(a: &str, b: &str) -> f64 {
    contraste(de_hex(a).unwrap(), de_hex(b).unwrap())
}

#[cfg(test)]
pub(crate) fn superficie_de_prueba(secundario: &str, texto: &str) -> String {
    a_hex(tokens(de_hex(secundario).unwrap(), de_hex(texto).unwrap()).superficie)
}
