//! Host del wallpaper (arquitectura.md, vista 3c, Núcleo · integración con Windows).
//! Responsabilidad: «Ancla la capa a WorkerW, reenvía la selección del mouse (Raw Input), reparte monitores,
//! pausa animaciones por carga y restaura el fondo al salir.»
//!
//! HE-02-HU01 ancla la capa a WorkerW (`anclaje`, solo en Windows) y guarda lo que el resto del Núcleo necesita
//! saber (`estado`). HE-06-HU01 reenvía a la capa la selección sobre los widgets interactivos (`raw_input`, solo
//! en Windows, con las reglas de `seleccion`) y vuelve a leer los monitores cuando cambian. El prototipo del
//! spike P01 (WorkerW y Raw Input, D-131 y D-186) sigue detrás de la feature `spike`; con ella no se crea la capa
//! de la aplicación, porque el spike crea la suya.

/// Etiqueta de la ventana de la capa (`capabilities/capa.json`).
pub const CAPA: &str = "capa";

pub mod estado;
#[cfg(any(test, windows))]
pub mod geometria;
pub mod seleccion;

#[cfg(all(windows, not(feature = "spike")))]
pub mod anclaje;
#[cfg(all(windows, not(feature = "spike")))]
pub mod raw_input;
#[cfg(all(windows, feature = "spike"))]
pub mod spike;

/// Muestra la capa con la sesión iniciada y el anclaje bien hecho, y la oculta en otro caso (HE-02-HU01-CA01,
/// CA05). Fuera de Windows no hay capa.
pub fn mostrar_capa(app: &tauri::AppHandle, visible: bool) {
    #[cfg(all(windows, not(feature = "spike")))]
    anclaje::mostrar(app, visible);
    #[cfg(not(all(windows, not(feature = "spike"))))]
    let _ = (app, visible);
}
