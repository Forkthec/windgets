//! Reglas de la selección de un widget interactivo en el escritorio (HE-06-HU01; D-186; INT-07, paso 3), sin
//! llamadas a Windows: se prueban en cualquier sistema. `raw_input.rs` (solo Windows) las usa con lo que lee del
//! mouse y del explorador.
//!
//! Coordenadas: el cursor llega en píxeles físicos de la pantalla (`GetCursorPos`); la capa cubre el escritorio
//! virtual desde `origen` y dibuja en píxeles CSS, que son los físicos divididos por su `escala`. Los rectángulos
//! de los widgets están en píxeles físicos desde el origen de la capa (`WidgetRect`; `Capa.tsx` los divide por la
//! escala al dibujarlos, HE-05-HU02-ET07), así que el punto se compara con ellos antes de pasarlo a la capa.

use crate::tipos::{
    EventMapPointerForwarded, EventMapPointerForwardedButton, Monitor, WidgetRect, WidgetType,
};

use serde::Serialize;

/// Banderas de `RAWMOUSE.usButtonFlags`: RI_MOUSE_LEFT_BUTTON_DOWN y RI_MOUSE_RIGHT_BUTTON_DOWN.
pub const BOTON_IZQUIERDO_ABAJO: u16 = 0x0001;
pub const BOTON_DERECHO_ABAJO: u16 = 0x0004;
/// RI_MOUSE_LEFT_BUTTON_UP y RI_MOUSE_RIGHT_BUTTON_UP.
pub const BOTON_IZQUIERDO_ARRIBA: u16 = 0x0002;
pub const BOTON_DERECHO_ARRIBA: u16 = 0x0008;

/// Lo que la capa necesita para decidir: dónde empieza, su escala y los widgets activos que pinta.
#[derive(Debug, Clone, PartialEq)]
pub struct GeometriaDeLaCapa {
    pub origen: (i32, i32),
    pub escala: f64,
    pub widgets: Vec<WidgetRect>,
}

impl Default for GeometriaDeLaCapa {
    fn default() -> Self {
        Self {
            origen: (0, 0),
            escala: 1.0,
            widgets: Vec::new(),
        }
    }
}

/// Qué hay bajo el cursor según Windows (`WindowFromPoint`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BajoElCursor {
    /// El escritorio: `SysListView32` dentro de `SHELLDLL_DefView`.
    Escritorio,
    /// Una ventana de otra aplicación (o cualquier otra cosa que no sea el escritorio).
    OtraVentana,
}

/// Son widgets interactivos Tareas del día, Kanban, Calendario, Reproductor de música y Noticias (ET01); los
/// demás no lo son (ET02).
pub fn es_interactivo(tipo: &WidgetType) -> bool {
    matches!(
        tipo,
        WidgetType::DailyTasks
            | WidgetType::Kanban
            | WidgetType::Calendar
            | WidgetType::MusicPlayer
            | WidgetType::News
    )
}

/// ¿La entrada es el botón principal presionado? Es el derecho si la persona intercambió los botones en
/// Windows. El botón secundario nunca se reenvía: el menú contextual es siempre el del escritorio (ET07; CA05,
/// CA06).
pub fn es_el_boton_principal(banderas: u16, botones_intercambiados: bool) -> bool {
    let principal = if botones_intercambiados {
        BOTON_DERECHO_ABAJO
    } else {
        BOTON_IZQUIERDO_ABAJO
    };
    banderas & principal != 0
}

/// ¿La entrada suelta el botón principal? Con los botones intercambiados, es soltar el derecho.
pub fn se_solto_el_boton_principal(banderas: u16, botones_intercambiados: bool) -> bool {
    let principal = if botones_intercambiados {
        BOTON_DERECHO_ARRIBA
    } else {
        BOTON_IZQUIERDO_ARRIBA
    };
    banderas & principal != 0
}

/// Evento interno con el arrastre que sigue a una selección reenviada (HE-06-HU06-ET01).
/// DUDA: HE-06-HU06 EV-18 solo lleva la selección (el botón presionado) y el drag-and-drop del widget Kanban
/// necesita también el movimiento y el lugar donde se suelta. Ningún evento del contrato lo lleva. Valor usado:
/// este evento, solo hacia la capa, desde una selección reenviada hasta que se suelta el botón (docs/DUDAS.md).
pub const ARRASTRE_REENVIADO: &str = "pointer_drag_forwarded";

/// `move` mientras el botón sigue presionado; `up` al soltarlo.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FaseDelArrastre {
    Move,
    Up,
}

/// Carga de `pointer_drag_forwarded`, en coordenadas de la capa como EV-18.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct ArrastreReenviado {
    pub x: i64,
    pub y: i64,
    pub phase: FaseDelArrastre,
}

/// Seguimiento del arrastre: empieza con una selección reenviada a la capa y termina al soltar el botón
/// principal. Mientras dura, el punto se reenvía aunque salga del widget: soltar fuera de las columnas deja la
/// tarjeta donde estaba (HE-06-HU06-ET05).
#[derive(Debug, Default)]
pub struct Arrastre {
    ultimo: Option<(i64, i64)>,
}

impl Arrastre {
    pub const fn nuevo() -> Self {
        Self { ultimo: None }
    }

    /// Una selección reenviada (EV-18) empieza un arrastre en su punto.
    pub fn empezar(&mut self, seleccion: &EventMapPointerForwarded) {
        self.ultimo = Some((seleccion.x, seleccion.y));
    }

    /// ¿Hay un arrastre en curso? Sin él, el movimiento del mouse no se mira.
    pub fn en_curso(&self) -> bool {
        self.ultimo.is_some()
    }

    /// Una selección que no se reenvía (cae en un ícono, fuera de los widgets o en otra ventana) termina
    /// cualquier arrastre anterior sin avisar a la capa.
    pub fn cancelar(&mut self) {
        self.ultimo = None;
    }

    /// Cada entrada del mouse mientras dura el arrastre. Devuelve lo que se reenvía: `up` al soltar el botón
    /// principal, y `move` solo si el punto cambió en la capa (para no repetir el mismo punto). Sin arrastre en
    /// curso no se reenvía nada.
    pub fn seguir(
        &mut self,
        geometria: &GeometriaDeLaCapa,
        (x, y): (i32, i32),
        soltado: bool,
    ) -> Option<ArrastreReenviado> {
        let anterior = self.ultimo?;
        let (cx, cy) = en_la_capa(geometria, x, y);
        let punto = (cx.round() as i64, cy.round() as i64);
        let phase = if soltado {
            self.ultimo = None;
            FaseDelArrastre::Up
        } else if punto == anterior {
            return None;
        } else {
            self.ultimo = Some(punto);
            FaseDelArrastre::Move
        };
        Some(ArrastreReenviado {
            x: punto.0,
            y: punto.1,
            phase,
        })
    }
}

/// El punto físico desde el origen de la capa, en píxeles físicos, como los rectángulos de los widgets.
fn desde_el_origen(geometria: &GeometriaDeLaCapa, x: i32, y: i32) -> (f64, f64) {
    (
        f64::from(x - geometria.origen.0),
        f64::from(y - geometria.origen.1),
    )
}

/// El punto físico en píxeles CSS de la capa.
fn en_la_capa(geometria: &GeometriaDeLaCapa, x: i32, y: i32) -> (f64, f64) {
    let escala = if geometria.escala > 0.0 {
        geometria.escala
    } else {
        1.0
    };
    (
        f64::from(x - geometria.origen.0) / escala,
        f64::from(y - geometria.origen.1) / escala,
    )
}

fn contiene(w: &WidgetRect, x: f64, y: f64) -> bool {
    let (izquierda, arriba) = (w.x as f64, w.y as f64);
    x >= izquierda && x < izquierda + w.width as f64 && y >= arriba && y < arriba + w.height as f64
}

/// El monitor (en píxeles físicos) que contiene el punto. Sin ninguno, el primero (`"0"`).
fn monitor_en(monitores: &[Monitor], x: i32, y: i32) -> String {
    let (x, y) = (i64::from(x), i64::from(y));
    monitores
        .iter()
        .find(|m| x >= m.x && x < m.x + m.width && y >= m.y && y < m.y + m.height)
        .map_or_else(|| "0".to_string(), |m| m.id.clone())
}

/// Decide si la selección con el botón principal en `(x, y)` (píxeles físicos) va a la capa como EV-18
/// `pointer_forwarded`. Solo si Windows tiene el escritorio bajo el cursor (las ventanas de otras aplicaciones
/// tienen prioridad, ET05, CA07), el punto cae en un widget interactivo (CA02, CA04) y no hay un ícono debajo
/// (los íconos tienen prioridad, ET04, ET06, ET08, CA03). `hay_icono` solo se consulta en ese último caso;
/// `None` (sin acceso al explorador) deja la selección al escritorio (RNF-35).
pub fn decidir(
    geometria: &GeometriaDeLaCapa,
    monitores: &[Monitor],
    (x, y): (i32, i32),
    bajo_el_cursor: BajoElCursor,
    hay_icono: impl FnOnce() -> Option<bool>,
) -> Option<EventMapPointerForwarded> {
    if bajo_el_cursor != BajoElCursor::Escritorio {
        return None;
    }
    let (fx, fy) = desde_el_origen(geometria, x, y);
    geometria
        .widgets
        .iter()
        .rev() // el último pintado queda encima
        .find(|w| w.is_active && contiene(w, fx, fy))
        .filter(|w| es_interactivo(&w.r#type))?;
    if hay_icono() != Some(false) {
        return None;
    }
    let (cx, cy) = en_la_capa(geometria, x, y);
    Some(EventMapPointerForwarded {
        x: cx.round() as i64,
        y: cy.round() as i64,
        monitor_id: monitor_en(monitores, x, y),
        button: EventMapPointerForwardedButton::Primary,
    })
}

#[cfg(test)]
mod pruebas {
    //! HE-06-HU01 · Seleccionar un widget interactivo directamente en el escritorio. Las reglas se prueban aquí;
    //! la lectura real del mouse, del explorador y de los íconos (`raw_input.rs`) se prueba a mano en Windows 11.
    use super::*;
    use crate::tipos::Uuid;

    fn rect(id: &str, tipo: WidgetType, x: i64, y: i64, ancho: i64, alto: i64) -> WidgetRect {
        WidgetRect {
            widget_id: Uuid(id.to_string()),
            r#type: tipo,
            x,
            y,
            width: ancho,
            height: alto,
            is_active: true,
        }
    }

    /// Los cuatro widgets por defecto en su posición por defecto (H-D-18), con la capa desde (0, 0) al 100 %.
    fn por_defecto() -> GeometriaDeLaCapa {
        GeometriaDeLaCapa {
            origen: (0, 0),
            escala: 1.0,
            widgets: vec![
                rect("reloj", WidgetType::Clock, 40, 40, 320, 160),
                rect("calendario", WidgetType::Calendar, 40, 220, 320, 340),
                rect("tareas", WidgetType::DailyTasks, 380, 40, 360, 520),
                rect("kanban", WidgetType::Kanban, 760, 40, 640, 520),
            ],
        }
    }

    fn monitores() -> Vec<Monitor> {
        vec![
            Monitor {
                id: "0".into(),
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                scale_factor: 1.0,
            },
            Monitor {
                id: "1".into(),
                x: -1920,
                y: 0,
                width: 1920,
                height: 1080,
                scale_factor: 1.5,
            },
        ]
    }

    fn sin_icono() -> Option<bool> {
        Some(false)
    }

    #[test]
    fn ca_he_06_hu01_ca01() {
        // HE-06-HU01-CA01 · Seleccionar un widget interactivo: la selección sobre Tareas del día, sin ícono debajo,
        // va a la capa como EV-18 en sus coordenadas, con el botón principal (ET01, ET03).
        let evento = decidir(
            &por_defecto(),
            &monitores(),
            (400, 100),
            BajoElCursor::Escritorio,
            sin_icono,
        )
        .unwrap();
        assert_eq!((evento.x, evento.y), (400, 100));
        assert_eq!(evento.monitor_id, "0");
        assert_eq!(evento.button, EventMapPointerForwardedButton::Primary);
        // Con la capa desde otro origen y al 150 %, el punto llega en píxeles CSS de la capa.
        let desplazada = GeometriaDeLaCapa {
            origen: (-1920, 0),
            escala: 1.5,
            ..por_defecto()
        };
        let evento = decidir(
            &desplazada,
            &monitores(),
            (-1920 + 600, 150),
            BajoElCursor::Escritorio,
            sin_icono,
        )
        .unwrap();
        assert_eq!((evento.x, evento.y), (400, 100));
        assert_eq!(evento.monitor_id, "1");
        // HE-05-HU02-ET07: los rectángulos están en píxeles físicos y la capa los dibuja divididos por la escala.
        // Al 125 %, el Kanban (760 a 1400 físicos) termina en 1120 CSS: el punto físico 1450 queda fuera, aunque
        // en CSS (1160) caería dentro del rectángulo sin escalar; el 1300 sí está dentro y llega en CSS.
        let a_escala = GeometriaDeLaCapa {
            escala: 1.25,
            ..por_defecto()
        };
        let fuera = decidir(
            &a_escala,
            &monitores(),
            (1450, 100),
            BajoElCursor::Escritorio,
            sin_icono,
        );
        assert_eq!(fuera, None);
        let dentro = decidir(
            &a_escala,
            &monitores(),
            (1300, 100),
            BajoElCursor::Escritorio,
            sin_icono,
        )
        .unwrap();
        assert_eq!((dentro.x, dentro.y), (1040, 80));
        // Todos los interactivos (ET01).
        for tipo in [
            WidgetType::DailyTasks,
            WidgetType::Kanban,
            WidgetType::Calendar,
            WidgetType::MusicPlayer,
            WidgetType::News,
        ] {
            assert!(es_interactivo(&tipo), "{tipo:?}");
        }
    }

    #[test]
    fn ca_he_06_hu01_ca02() {
        // HE-06-HU01-CA02 · Seleccionar un widget que no es interactivo: el Reloj no recibe nada y el escritorio
        // se comporta como en un área vacía (ET02).
        let mut consultado = false;
        let evento = decidir(
            &por_defecto(),
            &monitores(),
            (100, 100),
            BajoElCursor::Escritorio,
            || {
                consultado = true;
                Some(false)
            },
        );
        assert_eq!(evento, None);
        assert!(!consultado, "no hace falta preguntar por íconos");
        for tipo in [
            WidgetType::Clock,
            WidgetType::Weather,
            WidgetType::StaticImage,
            WidgetType::ImageCarousel,
            WidgetType::Animation,
            WidgetType::Text,
        ] {
            assert!(!es_interactivo(&tipo), "{tipo:?}");
        }
    }

    #[test]
    fn ca_he_06_hu01_ca03() {
        // HE-06-HU01-CA03 · Ícono sobre un widget: la selección queda para Windows, que abre el ícono, y el widget
        // no recibe nada (ET04, ET06, ET08). Sin acceso al explorador, también queda para el escritorio (RNF-35).
        for hay_icono in [Some(true), None] {
            let evento = decidir(
                &por_defecto(),
                &monitores(),
                (400, 100),
                BajoElCursor::Escritorio,
                || hay_icono,
            );
            assert_eq!(evento, None, "{hay_icono:?}");
        }
    }

    #[test]
    fn ca_he_06_hu01_ca04() {
        // HE-06-HU01-CA04 · Seleccionar un área sin widgets: nada va a la capa; Windows deselecciona los íconos.
        let evento = decidir(
            &por_defecto(),
            &monitores(),
            (1700, 900),
            BajoElCursor::Escritorio,
            sin_icono,
        );
        assert_eq!(evento, None);
        // Un widget inactivo tampoco recibe la selección.
        let mut inactivo = por_defecto();
        inactivo.widgets[2].is_active = false;
        let evento = decidir(
            &inactivo,
            &monitores(),
            (400, 100),
            BajoElCursor::Escritorio,
            sin_icono,
        );
        assert_eq!(evento, None);
    }

    #[test]
    fn ca_he_06_hu01_ca05() {
        // HE-06-HU01-CA05 · Menú contextual en un área sin widgets: el botón secundario no es la selección que se
        // reenvía, así que Windows muestra su menú contextual (ET07).
        assert!(!es_el_boton_principal(BOTON_DERECHO_ABAJO, false));
        assert!(es_el_boton_principal(BOTON_IZQUIERDO_ABAJO, false));
    }

    #[test]
    fn ca_he_06_hu01_ca06() {
        // HE-06-HU01-CA06 · Menú contextual sobre un widget: con los botones intercambiados en Windows, el
        // secundario es el izquierdo y tampoco se reenvía; el menú es el del escritorio.
        assert!(!es_el_boton_principal(BOTON_IZQUIERDO_ABAJO, true));
        assert!(es_el_boton_principal(BOTON_DERECHO_ABAJO, true));
    }

    #[test]
    fn ca_he_06_hu01_ca07() {
        // HE-06-HU01-CA07 · Escritorio cubierto por otra ventana: la otra ventana recibe la selección y el widget
        // no (ET05).
        let evento = decidir(
            &por_defecto(),
            &monitores(),
            (400, 100),
            BajoElCursor::OtraVentana,
            sin_icono,
        );
        assert_eq!(evento, None);
    }

    /// Una selección reenviada sobre el widget Kanban por defecto.
    fn seleccion_en_kanban() -> EventMapPointerForwarded {
        decidir(
            &por_defecto(),
            &monitores(),
            (800, 100),
            BajoElCursor::Escritorio,
            sin_icono,
        )
        .unwrap()
    }

    #[test]
    fn ca_he_06_hu06_ca01() {
        // HE-06-HU06-CA01 · Mover una tarjeta a otra columna (ET01): tras la selección reenviada, la capa recibe el
        // movimiento en sus coordenadas, sin repetir un punto, y el lugar donde se suelta el botón principal.
        let geometria = GeometriaDeLaCapa {
            origen: (-1920, 0),
            escala: 1.0,
            ..por_defecto()
        };
        let mut arrastre = Arrastre::nuevo();
        arrastre.empezar(&seleccion_en_kanban());
        let mover = |a: &mut Arrastre, x, soltado| a.seguir(&geometria, (x, 100), soltado);
        assert_eq!(
            mover(&mut arrastre, -1000, false),
            Some(ArrastreReenviado {
                x: 920,
                y: 100,
                phase: FaseDelArrastre::Move
            })
        );
        assert_eq!(mover(&mut arrastre, -1000, false), None);
        assert_eq!(
            mover(&mut arrastre, -900, true),
            Some(ArrastreReenviado {
                x: 1020,
                y: 100,
                phase: FaseDelArrastre::Up
            })
        );
        // Soltado el botón, el arrastre terminó: el movimiento siguiente ya no va a la capa.
        assert_eq!(mover(&mut arrastre, -800, false), None);
        // El botón principal se suelta con su bandera, también con los botones intercambiados.
        assert!(se_solto_el_boton_principal(BOTON_IZQUIERDO_ARRIBA, false));
        assert!(!se_solto_el_boton_principal(BOTON_DERECHO_ARRIBA, false));
        assert!(se_solto_el_boton_principal(BOTON_DERECHO_ARRIBA, true));
        assert!(!se_solto_el_boton_principal(BOTON_IZQUIERDO_ABAJO, false));
    }

    #[test]
    fn ca_he_06_hu06_ca04() {
        // HE-06-HU06-CA04 · Soltar una tarjeta fuera de una columna (ET05): el punto sigue llegando a la capa
        // aunque salga del widget, para que la capa sepa que se soltó fuera y deje la tarjeta donde estaba. Sin una
        // selección reenviada (o tras una que no se reenvió) no hay arrastre.
        let geometria = por_defecto();
        let mut arrastre = Arrastre::nuevo();
        assert_eq!(arrastre.seguir(&geometria, (1600, 900), true), None);
        arrastre.empezar(&seleccion_en_kanban());
        assert_eq!(
            arrastre.seguir(&geometria, (1600, 900), true),
            Some(ArrastreReenviado {
                x: 1600,
                y: 900,
                phase: FaseDelArrastre::Up
            })
        );
        assert!(!arrastre.en_curso());
        arrastre.empezar(&seleccion_en_kanban());
        assert!(arrastre.en_curso());
        arrastre.cancelar();
        assert!(!arrastre.en_curso());
        assert_eq!(arrastre.seguir(&geometria, (900, 100), false), None);
    }
}
