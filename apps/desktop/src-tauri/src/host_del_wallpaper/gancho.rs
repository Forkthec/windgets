//! Reglas del gancho de mouse de bajo nivel sobre los widgets interactivos (HE-06-HU06-CA06, ET07; D-215), sin
//! llamadas a Windows: se prueban en cualquier sistema. `raw_input.rs` (solo Windows) instala el gancho
//! `WH_MOUSE_LL` y le pregunta aquí qué hacer con cada mensaje del mouse.
//!
//! El escritorio de Windows no debe recibir el presionar ni el soltar del botón principal dentro del rectángulo de
//! un widget interactivo, para que no dibuje su rectángulo de selección mientras se arrastra una tarjeta del
//! widget Kanban. Fuera de los widgets, sobre los íconos y sobre las ventanas de otras aplicaciones, Windows lo
//! recibe igual. El movimiento nunca se intercepta. Dentro del gancho no se consulta al explorador
//! (`LVM_HITTEST`): los rectángulos de los widgets y de los íconos van en caché y se actualizan fuera de él.
//!
//! DUDA: HE-06-HU06 la técnica se valida antes con un spike en Windows 11 (D-215, RNF-35). Mientras el spike no
//! se apruebe, el gancho queda apagado (`GANCHO_HABILITADO`) y HE-06-HU06-CA06 queda pendiente (docs/DUDAS.md).

use super::geometria::Rect;
use super::seleccion::{BajoElCursor, GeometriaDeLaCapa, es_interactivo};

/// D-215: el gancho se instala solo con el spike aprobado en Windows 11. Apagado, nada cambia para Windows.
pub const GANCHO_HABILITADO: bool = false;

/// Mensajes de `winuser.h` que llegan al gancho en `wParam`.
pub const WM_LBUTTONDOWN: u32 = 0x0201;
pub const WM_LBUTTONUP: u32 = 0x0202;
pub const WM_RBUTTONDOWN: u32 = 0x0204;
pub const WM_RBUTTONUP: u32 = 0x0205;

/// Lo que importa de un mensaje del mouse: presionar o soltar el botón principal; lo demás (movimiento, rueda,
/// botón secundario) se deja pasar siempre.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Boton {
    PresionarPrincipal,
    SoltarPrincipal,
    Otro,
}

/// El botón principal es el derecho si la persona intercambió los botones en Windows (como en Raw Input).
pub fn boton(mensaje: u32, botones_intercambiados: bool) -> Boton {
    let (abajo, arriba) = if botones_intercambiados {
        (WM_RBUTTONDOWN, WM_RBUTTONUP)
    } else {
        (WM_LBUTTONDOWN, WM_LBUTTONUP)
    };
    if mensaje == abajo {
        Boton::PresionarPrincipal
    } else if mensaje == arriba {
        Boton::SoltarPrincipal
    } else {
        Boton::Otro
    }
}

/// Los rectángulos que el gancho consulta, en píxeles físicos de la pantalla.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct CacheDelGancho {
    /// Los widgets interactivos activos que pinta la capa.
    pub widgets: Vec<Rect>,
    /// Los íconos del escritorio; `None` si no se pudieron leer (sin acceso al explorador): entonces el gancho no
    /// traga nada y el escritorio se comporta como siempre (RNF-35).
    pub iconos: Option<Vec<Rect>>,
}

impl CacheDelGancho {
    pub const fn vacia() -> Self {
        Self {
            widgets: Vec::new(),
            iconos: None,
        }
    }
}

/// Los rectángulos de los widgets interactivos activos en píxeles físicos de la pantalla: los de `WidgetRect` están
/// en píxeles físicos desde el origen de la capa (HE-05-HU02-ET07).
pub fn rectangulos_interactivos(geometria: &GeometriaDeLaCapa) -> Vec<Rect> {
    let (ox, oy) = geometria.origen;
    geometria
        .widgets
        .iter()
        .filter(|w| w.is_active && es_interactivo(&w.r#type))
        .map(|w| Rect {
            izquierda: ox + w.x as i32,
            arriba: oy + w.y as i32,
            derecha: ox + (w.x + w.width) as i32,
            abajo: oy + (w.y + w.height) as i32,
        })
        .collect()
}

/// ET07: el gancho está instalado mientras haya widgets interactivos visibles (la capa oculta no pinta ninguno) y
/// la capa esté anclada; con la bandera apagada, nunca.
pub fn debe_estar_instalado(habilitado: bool, widgets: &[Rect], anclaje_fallido: bool) -> bool {
    habilitado && !anclaje_fallido && !widgets.is_empty()
}

/// La decisión del gancho para cada mensaje del botón principal.
#[derive(Debug, Default)]
pub struct Gancho {
    presion_tragada: bool,
}

impl Gancho {
    pub const fn nuevo() -> Self {
        Self {
            presion_tragada: false,
        }
    }

    /// `true` si el mensaje no debe llegar a Windows. Se traga el presionar sobre el escritorio, dentro de un widget
    /// interactivo y sin un ícono debajo, y el soltar que lo sigue, aunque el puntero haya salido del widget (si no,
    /// Windows recibiría un soltar sin su presionar). Todo lo demás pasa.
    pub fn decidir(
        &mut self,
        cache: &CacheDelGancho,
        boton: Boton,
        (x, y): (i32, i32),
        bajo_el_cursor: BajoElCursor,
    ) -> bool {
        match boton {
            Boton::Otro => false,
            Boton::SoltarPrincipal => std::mem::take(&mut self.presion_tragada),
            Boton::PresionarPrincipal => {
                let sobre_un_widget = cache.widgets.iter().any(|r| r.contiene(x, y));
                let sin_icono = cache
                    .iconos
                    .as_ref()
                    .is_some_and(|iconos| !iconos.iter().any(|r| r.contiene(x, y)));
                self.presion_tragada =
                    bajo_el_cursor == BajoElCursor::Escritorio && sobre_un_widget && sin_icono;
                self.presion_tragada
            }
        }
    }
}

#[cfg(test)]
mod pruebas {
    //! HE-06-HU06-CA06 y ET07 · Las reglas del gancho. La instalación real en Windows 11 es el spike
    //! `ca_he_06_hu06_ca06_spike` (`raw_input.rs`, ignorado en la CI).
    use super::*;
    use crate::tipos::{Uuid, WidgetRect, WidgetType};

    fn rect(tipo: WidgetType, x: i64, y: i64, ancho: i64, alto: i64) -> WidgetRect {
        WidgetRect {
            widget_id: Uuid(format!("{tipo:?}")),
            r#type: tipo,
            x,
            y,
            width: ancho,
            height: alto,
            is_active: true,
        }
    }

    /// Reloj y Kanban por defecto (H-D-18), con la capa desde (-1920, 0).
    fn geometria() -> GeometriaDeLaCapa {
        GeometriaDeLaCapa {
            origen: (-1920, 0),
            escala: 1.25,
            widgets: vec![
                rect(WidgetType::Clock, 40, 40, 320, 160),
                rect(WidgetType::Kanban, 760, 40, 640, 520),
            ],
        }
    }

    fn cache() -> CacheDelGancho {
        CacheDelGancho {
            widgets: rectangulos_interactivos(&geometria()),
            iconos: Some(vec![Rect {
                izquierda: -1100,
                arriba: 50,
                derecha: -1020,
                abajo: 130,
            }]),
        }
    }

    #[test]
    fn ca_he_06_hu06_ca06() {
        // HE-06-HU06-CA06 · Arrastrar sin la selección del escritorio: el presionar y el soltar del botón principal
        // sobre el widget Kanban no llegan a Windows, que no dibuja su rectángulo de selección; el soltar se traga
        // aunque el puntero haya salido del widget. El movimiento pasa siempre.
        let mut gancho = Gancho::default();
        let cache = cache();
        // El Kanban en pantalla: desde -1920 + 760 = -1160 hasta -1920 + 1400 = -520 (píxeles físicos).
        assert_eq!(
            cache.widgets,
            vec![Rect {
                izquierda: -1160,
                arriba: 40,
                derecha: -520,
                abajo: 560
            }]
        );
        let escritorio = BajoElCursor::Escritorio;
        assert!(gancho.decidir(&cache, Boton::PresionarPrincipal, (-900, 200), escritorio));
        assert!(!gancho.decidir(&cache, Boton::Otro, (-300, 200), escritorio));
        assert!(gancho.decidir(&cache, Boton::SoltarPrincipal, (-300, 200), escritorio));
        // Terminado el arrastre, el siguiente soltar ya no se traga.
        assert!(!gancho.decidir(&cache, Boton::SoltarPrincipal, (-900, 200), escritorio));
        // Los botones intercambiados: el principal es el derecho.
        assert_eq!(boton(WM_LBUTTONDOWN, false), Boton::PresionarPrincipal);
        assert_eq!(boton(WM_RBUTTONUP, true), Boton::SoltarPrincipal);
        assert_eq!(boton(WM_LBUTTONDOWN, true), Boton::Otro);
        assert_eq!(boton(0x0200, false), Boton::Otro); // WM_MOUSEMOVE
    }

    #[test]
    fn ca_he_06_hu06_et07() {
        // HE-06-HU06-ET07 · Fuera de un widget interactivo, sobre los íconos, sobre otra ventana o sin poder leer los
        // íconos, Windows recibe el presionar y el soltar igual.
        let mut gancho = Gancho::default();
        let cache = cache();
        let escritorio = BajoElCursor::Escritorio;
        let presionar = |g: &mut Gancho, c: &CacheDelGancho, punto, bajo| {
            let tragado = g.decidir(c, Boton::PresionarPrincipal, punto, bajo);
            let soltado = g.decidir(c, Boton::SoltarPrincipal, punto, bajo);
            (tragado, soltado)
        };
        // El Reloj no es interactivo; (100, 100) no tiene widgets.
        assert_eq!(
            presionar(&mut gancho, &cache, (-1800, 100), escritorio),
            (false, false)
        );
        assert_eq!(
            presionar(&mut gancho, &cache, (100, 100), escritorio),
            (false, false)
        );
        // Un ícono sobre el widget Kanban.
        assert_eq!(
            presionar(&mut gancho, &cache, (-1050, 100), escritorio),
            (false, false)
        );
        // Otra ventana encima del widget.
        let otra = BajoElCursor::OtraVentana;
        assert_eq!(
            presionar(&mut gancho, &cache, (-900, 200), otra),
            (false, false)
        );
        // Sin acceso al explorador.
        let sin_iconos = CacheDelGancho {
            iconos: None,
            ..cache.clone()
        };
        assert_eq!(
            presionar(&mut gancho, &sin_iconos, (-900, 200), escritorio),
            (false, false)
        );
        // Instalado solo con la bandera, la capa anclada y algún widget interactivo visible.
        assert!(debe_estar_instalado(true, &cache.widgets, false));
        assert!(!debe_estar_instalado(true, &cache.widgets, true));
        assert!(!debe_estar_instalado(true, &[], false));
        assert!(!debe_estar_instalado(false, &cache.widgets, false));
    }
}
