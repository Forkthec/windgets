//! Lo que el host del wallpaper le cuenta al resto del Núcleo: si logró anclar la capa y qué monitores ve
//! (IPC-DESK-01 y 02, EV-16 y EV-17). No depende de Windows: el anclaje lo llena y las pruebas lo simulan.

use std::sync::Mutex;

use crate::tipos::Monitor;

#[derive(Default)]
pub struct EstadoDelHost {
    fallo_de_anclaje: Mutex<bool>,
    monitores: Mutex<Vec<Monitor>>,
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
}
