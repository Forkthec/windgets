//! Lo que el host del wallpaper le cuenta al resto del Núcleo: si logró anclar la capa y qué monitores ve
//! (IPC-DESK-01 y 02, EV-16 y EV-17) y, para reenviar la selección del mouse, dónde está la capa y qué widgets
//! pinta (HE-06-HU01). No depende de Windows: el anclaje lo llena y las pruebas lo simulan.

use std::sync::Mutex;

use super::seleccion::GeometriaDeLaCapa;
use crate::tipos::{Monitor, WidgetRect};

#[derive(Default)]
pub struct EstadoDelHost {
    fallo_de_anclaje: Mutex<bool>,
    monitores: Mutex<Vec<Monitor>>,
    capa: Mutex<GeometriaDeLaCapa>,
}

fn con<T, R>(candado: &Mutex<T>, f: impl FnOnce(&mut T) -> R) -> R {
    match candado.lock() {
        Ok(mut guardia) => f(&mut guardia),
        Err(envenenado) => f(&mut envenenado.into_inner()),
    }
}

impl EstadoDelHost {
    /// La capa no pudo anclarse al escritorio: se avisa con el wallpaper por defecto (HE-02-HU01-ET05).
    pub fn anclaje_fallido(&self) -> bool {
        con(&self.fallo_de_anclaje, |f| *f)
    }

    pub fn marcar_anclaje(&self, fallido: bool) {
        con(&self.fallo_de_anclaje, |f| *f = fallido);
    }

    pub fn monitores(&self) -> Vec<Monitor> {
        con(&self.monitores, |m| m.clone())
    }

    pub fn guardar_monitores(&self, monitores: Vec<Monitor>) {
        con(&self.monitores, |m| *m = monitores);
    }

    /// Dónde empieza la capa (píxeles físicos) y su escala, al anclarla o al cambiar los monitores.
    pub fn ubicar_capa(&self, origen: (i32, i32), escala: f64) {
        con(&self.capa, |c| {
            c.origen = origen;
            c.escala = escala;
        });
    }

    /// Los widgets activos que pinta la capa, cada vez que la capa lee su estado (IPC-DESK-01).
    pub fn guardar_widgets(&self, widgets: Vec<WidgetRect>) {
        con(&self.capa, |c| c.widgets = widgets);
    }

    pub fn capa(&self) -> GeometriaDeLaCapa {
        con(&self.capa, |c| c.clone())
    }
}
