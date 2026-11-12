//! Geometría del spike P01, sin llamadas a Windows (se prueba en cualquier sistema).
//! Coordenadas en píxeles físicos de la pantalla, como las entregan `GetCursorPos` y `GetMonitorInfoW`.

use serde::Serialize;

/// Rectángulo en píxeles físicos: `izquierda` y `arriba` incluidos, `derecha` y `abajo` excluidos.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct Rect {
    pub izquierda: i32,
    pub arriba: i32,
    pub derecha: i32,
    pub abajo: i32,
}

impl Rect {
    pub fn ancho(&self) -> i32 {
        self.derecha - self.izquierda
    }

    pub fn alto(&self) -> i32 {
        self.abajo - self.arriba
    }

    pub fn contiene(&self, x: i32, y: i32) -> bool {
        x >= self.izquierda && x < self.derecha && y >= self.arriba && y < self.abajo
    }

    /// El mismo rectángulo con el origen en `(origen_x, origen_y)`.
    pub fn relativo_a(&self, origen_x: i32, origen_y: i32) -> Rect {
        Rect {
            izquierda: self.izquierda - origen_x,
            arriba: self.arriba - origen_y,
            derecha: self.derecha - origen_x,
            abajo: self.abajo - origen_y,
        }
    }
}

/// Un monitor: su rectángulo y su escala (DPI efectivo / 96), de `EnumDisplayMonitors` y `GetDpiForMonitor`.
#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
pub struct Monitor {
    pub rect: Rect,
    pub escala: f64,
}

/// Rectángulo de widget interactivo de prueba, uno por monitor.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct WidgetDePrueba {
    pub id: usize,
    pub rect: Rect,
}

/// Margen y tamaño del widget de prueba, en píxeles lógicos (se multiplican por la escala del monitor).
/// Son valores del prototipo, no del producto.
const MARGEN: f64 = 80.0;
const ANCHO: f64 = 360.0;
const ALTO: f64 = 240.0;

/// Escritorio virtual: el rectángulo que contiene a todos los monitores (D-187, una sola capa).
pub fn escritorio_virtual(monitores: &[Monitor]) -> Option<Rect> {
    let primero = monitores.first()?.rect;
    Some(monitores.iter().fold(primero, |acumulado, monitor| Rect {
        izquierda: acumulado.izquierda.min(monitor.rect.izquierda),
        arriba: acumulado.arriba.min(monitor.rect.arriba),
        derecha: acumulado.derecha.max(monitor.rect.derecha),
        abajo: acumulado.abajo.max(monitor.rect.abajo),
    }))
}

/// La misma configuración en cada monitor (D-135, D-187): un widget de prueba arriba a la izquierda.
pub fn widgets_de_prueba(monitores: &[Monitor]) -> Vec<WidgetDePrueba> {
    monitores
        .iter()
        .enumerate()
        .map(|(id, monitor)| {
            let escala = if monitor.escala > 0.0 {
                monitor.escala
            } else {
                1.0
            };
            let margen = (MARGEN * escala).round() as i32;
            let izquierda = monitor.rect.izquierda + margen;
            let arriba = monitor.rect.arriba + margen;
            WidgetDePrueba {
                id,
                rect: Rect {
                    izquierda,
                    arriba,
                    derecha: (izquierda + (ANCHO * escala).round() as i32)
                        .min(monitor.rect.derecha),
                    abajo: (arriba + (ALTO * escala).round() as i32).min(monitor.rect.abajo),
                },
            }
        })
        .collect()
}

/// El widget de prueba que contiene el punto, si hay uno.
pub fn widget_en(widgets: &[WidgetDePrueba], x: i32, y: i32) -> Option<WidgetDePrueba> {
    widgets
        .iter()
        .copied()
        .find(|widget| widget.rect.contiene(x, y))
}

#[cfg(test)]
mod pruebas {
    use super::*;

    fn monitor(izquierda: i32, arriba: i32, ancho: i32, alto: i32, escala: f64) -> Monitor {
        Monitor {
            rect: Rect {
                izquierda,
                arriba,
                derecha: izquierda + ancho,
                abajo: arriba + alto,
            },
            escala,
        }
    }

    #[test]
    fn spike_escritorio_virtual_cubre_todos_los_monitores() {
        // Monitor secundario a la izquierda y más alto que el principal: el origen queda en negativo.
        let monitores = [
            monitor(0, 0, 1920, 1080, 1.0),
            monitor(-2560, -360, 2560, 1440, 1.25),
        ];
        let virtual_ = escritorio_virtual(&monitores).unwrap();
        assert_eq!(
            virtual_,
            Rect {
                izquierda: -2560,
                arriba: -360,
                derecha: 1920,
                abajo: 1080
            }
        );
        assert_eq!((virtual_.ancho(), virtual_.alto()), (4480, 1440));
    }

    #[test]
    fn spike_sin_monitores_no_hay_escritorio_virtual() {
        assert_eq!(escritorio_virtual(&[]), None);
    }

    #[test]
    fn spike_un_widget_por_monitor_con_la_escala_de_cada_uno() {
        let monitores = [
            monitor(0, 0, 1920, 1080, 1.0),
            monitor(1920, 0, 3840, 2160, 2.0),
        ];
        let widgets = widgets_de_prueba(&monitores);
        assert_eq!(widgets.len(), 2);
        assert_eq!(
            widgets[0].rect,
            Rect {
                izquierda: 80,
                arriba: 80,
                derecha: 440,
                abajo: 320
            }
        );
        assert_eq!(
            widgets[1].rect,
            Rect {
                izquierda: 2080,
                arriba: 160,
                derecha: 2800,
                abajo: 640
            }
        );
    }

    #[test]
    fn spike_el_widget_no_sale_de_un_monitor_pequeno() {
        let widgets = widgets_de_prueba(&[monitor(0, 0, 400, 300, 1.0)]);
        assert_eq!(
            widgets[0].rect,
            Rect {
                izquierda: 80,
                arriba: 80,
                derecha: 400,
                abajo: 300
            }
        );
    }

    #[test]
    fn spike_el_punto_cae_en_el_widget_solo_dentro_del_rectangulo() {
        let widgets = widgets_de_prueba(&[monitor(0, 0, 1920, 1080, 1.0)]);
        assert_eq!(widget_en(&widgets, 80, 80).map(|w| w.id), Some(0));
        assert_eq!(widget_en(&widgets, 439, 319).map(|w| w.id), Some(0));
        assert_eq!(widget_en(&widgets, 440, 100), None);
        assert_eq!(widget_en(&widgets, 79, 100), None);
    }

    #[test]
    fn spike_rectangulo_relativo_al_origen_de_la_capa() {
        let rect = Rect {
            izquierda: -2480,
            arriba: -280,
            derecha: -2030,
            abajo: 20,
        };
        assert_eq!(
            rect.relativo_a(-2560, -360),
            Rect {
                izquierda: 80,
                arriba: 80,
                derecha: 530,
                abajo: 380
            }
        );
    }
}
