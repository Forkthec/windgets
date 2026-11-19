//! HE-15-HU04-CA05 (ET09, ET10): la distribución de widgets que llega de un computador con otra resolución se ajusta
//! a la pantalla que la recibe: se escala desde su escritorio de referencia (`ref_width` × `ref_height`), queda
//! dentro del área visible y, si dos widgets quedan superpuestos, el último en ubicarse pasa a la posición libre
//! más cercana.

use crate::tipos::WidgetRect;

/// Paso con que se buscan posiciones libres alrededor de la original.
const PASO: i64 = 20;

fn choca(a: &WidgetRect, b: &WidgetRect) -> bool {
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/// Escala un rectángulo de su escritorio de referencia a la pantalla y lo deja dentro del área visible.
fn escalar(r: &WidgetRect, referencia: (i64, i64), pantalla: (i64, i64)) -> WidgetRect {
    let (rw, rh) = (referencia.0.max(1), referencia.1.max(1));
    let (pw, ph) = pantalla;
    let ancho = (r.width * pw / rw).clamp(1, pw);
    let alto = (r.height * ph / rh).clamp(1, ph);
    WidgetRect {
        x: (r.x * pw / rw).clamp(0, pw - ancho),
        y: (r.y * ph / rh).clamp(0, ph - alto),
        width: ancho,
        height: alto,
        ..r.clone()
    }
}

/// La posición libre más cercana (por distancia) dentro de la pantalla; si no hay, la original.
fn libre_mas_cercana(r: &WidgetRect, ubicados: &[WidgetRect], pantalla: (i64, i64)) -> WidgetRect {
    let (pw, ph) = pantalla;
    let mut mejor: Option<(i64, WidgetRect)> = None;
    let mut y = 0;
    while y + r.height <= ph {
        let mut x = 0;
        while x + r.width <= pw {
            let candidato = WidgetRect { x, y, ..r.clone() };
            if !ubicados.iter().any(|u| choca(u, &candidato)) {
                let d = (x - r.x).pow(2) + (y - r.y).pow(2);
                if mejor.as_ref().is_none_or(|(m, _)| d < *m) {
                    mejor = Some((d, candidato));
                }
            }
            x += PASO;
        }
        y += PASO;
    }
    mejor.map_or_else(|| r.clone(), |(_, c)| c)
}

/// Ajusta los widgets, en su orden, a la pantalla. Cada uno trae su escritorio de referencia.
pub fn ajustar(widgets: &[(WidgetRect, (i64, i64))], pantalla: (i64, i64)) -> Vec<WidgetRect> {
    let mut ubicados: Vec<WidgetRect> = Vec::with_capacity(widgets.len());
    for (r, referencia) in widgets {
        let escalado = escalar(r, *referencia, pantalla);
        let final_ = if ubicados.iter().any(|u| choca(u, &escalado)) {
            libre_mas_cercana(&escalado, &ubicados, pantalla)
        } else {
            escalado
        };
        ubicados.push(final_);
    }
    ubicados
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use crate::tipos::{Uuid, WidgetType};

    fn rect(id: &str, x: i64, y: i64, w: i64, h: i64) -> WidgetRect {
        WidgetRect {
            widget_id: Uuid(id.into()),
            r#type: WidgetType::Clock,
            x,
            y,
            width: w,
            height: h,
            is_active: true,
        }
    }

    #[test]
    fn ca_he_15_hu04_ca05() {
        // HE-15-HU04-CA05 · De 1920 × 1080 a 1280 × 720: se escala y queda dentro del área visible (ET09).
        let ajustados = ajustar(
            &[(rect("a", 1600, 900, 320, 180), (1920, 1080))],
            (1280, 720),
        );
        assert_eq!(
            (
                ajustados[0].x,
                ajustados[0].y,
                ajustados[0].width,
                ajustados[0].height
            ),
            (1066, 600, 213, 120)
        );
        // Uno que se saldría queda dentro.
        let fuera = ajustar(
            &[(rect("b", 1900, 1070, 320, 160), (1920, 1080))],
            (1920, 1080),
        );
        assert!(fuera[0].x + fuera[0].width <= 1920 && fuera[0].y + fuera[0].height <= 1080);
        // ET10: si dos se superponen, el último en ubicarse va a la posición libre más cercana.
        let dos = ajustar(
            &[
                (rect("a", 0, 0, 400, 200), (1920, 1080)),
                (rect("b", 100, 0, 400, 200), (1920, 1080)),
            ],
            (1920, 1080),
        );
        assert_eq!((dos[0].x, dos[0].y), (0, 0));
        assert!(!choca(&dos[0], &dos[1]));
        assert_eq!((dos[1].x, dos[1].y), (100, 200));
    }
}
