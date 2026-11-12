//! Host del wallpaper (arquitectura.md, vista 3c, Núcleo · integración con Windows).
//! Responsabilidad: «Ancla la capa a WorkerW, reenvía la selección del mouse (Raw Input), reparte monitores,
//! pausa animaciones por carga y restaura el fondo al salir.»
//!
//! Por ahora solo contiene el prototipo del spike P01 (WorkerW y Raw Input, D-131 y D-186), detrás de la
//! feature `spike`. No cierra ninguna HU: es la condición para seguir (HE-02-HU01-ET11).

#[cfg(any(test, feature = "spike"))]
pub mod geometria;

#[cfg(all(windows, feature = "spike"))]
pub mod spike;
