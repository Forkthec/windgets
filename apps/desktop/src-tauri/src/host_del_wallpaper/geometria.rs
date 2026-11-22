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

// ---------------------------------------------------------------- Capa sin marco (HE-02-HU01-ET13)

/// Bits de estilo de `winuser.h` que usa la capa. Se repiten aquí para probar la regla en cualquier sistema.
pub mod estilos {
    pub const WS_POPUP: u32 = 0x8000_0000;
    pub const WS_CHILD: u32 = 0x4000_0000;
    pub const WS_BORDER: u32 = 0x0080_0000;
    pub const WS_DLGFRAME: u32 = 0x0040_0000;
    pub const WS_SYSMENU: u32 = 0x0008_0000;
    pub const WS_THICKFRAME: u32 = 0x0004_0000;
    pub const WS_MINIMIZEBOX: u32 = 0x0002_0000;
    pub const WS_MAXIMIZEBOX: u32 = 0x0001_0000;
    pub const WS_EX_DLGMODALFRAME: u32 = 0x0000_0001;
    pub const WS_EX_WINDOWEDGE: u32 = 0x0000_0100;
    pub const WS_EX_CLIENTEDGE: u32 = 0x0000_0200;
    pub const WS_EX_STATICEDGE: u32 = 0x0002_0000;
}

/// HE-02-HU01-ET13: el estilo de la capa como hija de WorkerW, sin ventana emergente, título, marco ni botones,
/// para que el área cliente sea todo el rectángulo y no queden franjas del fondo de Windows (CA07).
pub fn estilo_de_la_capa(estilo: u32) -> u32 {
    use estilos::*;
    let quitar = WS_POPUP
        | WS_BORDER
        | WS_DLGFRAME
        | WS_SYSMENU
        | WS_THICKFRAME
        | WS_MINIMIZEBOX
        | WS_MAXIMIZEBOX;
    (estilo & !quitar) | WS_CHILD
}

/// HE-02-HU01-ET13: el estilo extendido de la capa sin ningún borde (marco de diálogo, borde 3D ni borde estático).
pub fn estilo_extendido_de_la_capa(estilo: u32) -> u32 {
    use estilos::*;
    estilo & !(WS_EX_DLGMODALFRAME | WS_EX_WINDOWEDGE | WS_EX_CLIENTEDGE | WS_EX_STATICEDGE)
}

/// HE-02-HU01-ET13 (CA07): lo que le falta al área cliente de la capa, ya en coordenadas de pantalla, para cubrir el
/// escritorio virtual: `None` si lo cubre exacto, o los bordes `[izquierda, arriba, derecha, abajo]` en píxeles
/// físicos. En la prueba manual del 22-nov (P26) la ventana medía todo el escritorio, pero tao restaba el borde de
/// la sombra (9, 1, 9 y 9 px) y quedaban franjas del fondo de Windows.
pub fn bordes_sin_cubrir(cliente: Rect, escritorio: Rect) -> Option<[i32; 4]> {
    let bordes = [
        cliente.izquierda - escritorio.izquierda,
        cliente.arriba - escritorio.arriba,
        escritorio.derecha - cliente.derecha,
        escritorio.abajo - cliente.abajo,
    ];
    (bordes != [0; 4]).then_some(bordes)
}

/// Los mensajes de Windows que llevan a reubicar la capa (`winuser.h`).
pub mod mensajes {
    pub const WM_SETTINGCHANGE: u32 = 0x001A;
    pub const WM_DISPLAYCHANGE: u32 = 0x007E;
    pub const WM_DPICHANGED: u32 = 0x02E0;
}

/// RNF-34, HE-05-HU02-ET07 (P26): ¿la capa se vuelve a ubicar y avisa EV-17 tras este mensaje? Siempre con
/// `WM_DISPLAYCHANGE` y `WM_DPICHANGED`; con `WM_SETTINGCHANGE` (al cambiar la escala, Windows no siempre envía
/// `WM_DPICHANGED` a una ventana oculta) solo si los monitores cambiaron, para no repintar con cada ajuste.
pub fn reubicar_tras(mensaje: u32, monitores_cambiaron: impl FnOnce() -> bool) -> bool {
    use mensajes::*;
    match mensaje {
        WM_DISPLAYCHANGE | WM_DPICHANGED => true,
        WM_SETTINGCHANGE => monitores_cambiaron(),
        _ => false,
    }
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn ca_he_02_hu01_ca07() {
        // HE-02-HU01-CA07 · Wallpaper en toda la pantalla: la capa queda sin marco ni bordes, así que su área
        // cliente es todo el escritorio virtual con cualquier escala (ET13). La captura a 100, 125 y 150 % es manual.
        use estilos::*;
        // Una ventana de Tauri sin decoraciones todavía trae marco redimensionable, menú y botones.
        let de_tauri =
            WS_POPUP | WS_THICKFRAME | WS_SYSMENU | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | 0x1000_0000;
        let capa = estilo_de_la_capa(de_tauri);
        assert_eq!(capa & WS_CHILD, WS_CHILD);
        for bit in [
            WS_POPUP,
            WS_BORDER,
            WS_DLGFRAME,
            WS_SYSMENU,
            WS_THICKFRAME,
            WS_MINIMIZEBOX,
            WS_MAXIMIZEBOX,
        ] {
            assert_eq!(capa & bit, 0, "{bit:#x}");
        }
        // WS_VISIBLE (0x1000_0000) y los demás bits no se tocan.
        assert_eq!(capa & 0x1000_0000, 0x1000_0000);
        let extendido = estilo_extendido_de_la_capa(
            WS_EX_DLGMODALFRAME
                | WS_EX_WINDOWEDGE
                | WS_EX_CLIENTEDGE
                | WS_EX_STATICEDGE
                | 0x0000_0080,
        );
        assert_eq!(extendido, 0x0000_0080);
    }

    #[test]
    fn ca_he_02_hu01_ca07_el_area_cliente_cubre_el_escritorio() {
        // HE-02-HU01-CA07 · Lo medido en la prueba manual del 22-nov (125 %): ventana de 1920×1080 en (0, 0) con el
        // área cliente de 1902×1070 en (9, 1) por la sombra de tao. Eso deja franjas; sin sombra, el cliente es todo.
        let escritorio = monitor(0, 0, 1920, 1080, 1.25).rect;
        let con_sombra = Rect {
            izquierda: 9,
            arriba: 1,
            derecha: 1911,
            abajo: 1071,
        };
        assert_eq!(
            bordes_sin_cubrir(con_sombra, escritorio),
            Some([9, 1, 9, 9])
        );
        assert_eq!(bordes_sin_cubrir(escritorio, escritorio), None);
        // Dos monitores, el secundario a la izquierda: el origen es negativo y se compara igual.
        let virtual_ = Rect {
            izquierda: -1280,
            arriba: -200,
            derecha: 1920,
            abajo: 1080,
        };
        assert_eq!(bordes_sin_cubrir(virtual_, virtual_), None);
        let corrida = Rect {
            izquierda: -1271,
            ..virtual_
        };
        assert_eq!(bordes_sin_cubrir(corrida, virtual_), Some([9, 0, 0, 0]));
    }

    #[test]
    fn rnf_34_la_capa_se_reubica_al_cambiar_la_escala() {
        // RNF-34 · HE-05-HU02-ET07: con el cambio de pantalla o de escala la capa se reubica y avisa EV-17.
        use mensajes::*;
        assert!(reubicar_tras(WM_DISPLAYCHANGE, || false));
        assert!(reubicar_tras(WM_DPICHANGED, || false));
        assert!(reubicar_tras(WM_SETTINGCHANGE, || true));
        assert!(!reubicar_tras(WM_SETTINGCHANGE, || false));
        // Otro mensaje no lee los monitores.
        assert!(!reubicar_tras(0x0200, || panic!(
            "no debía leer los monitores"
        )));
    }

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
