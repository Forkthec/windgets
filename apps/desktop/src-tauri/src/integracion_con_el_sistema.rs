//! Integración con el sistema (arquitectura.md, vista 3c, Núcleo · integración con Windows).
//! Responsabilidad: «Área de notificación, instancia única, esquema windgets://, inicio automático y apertura de
//! enlaces en el navegador.»

pub mod area_de_notificacion;
pub mod carga;
pub mod inicio_automatico;
pub mod navegador;
#[cfg(windows)]
mod registro;
#[cfg(windows)]
pub mod uso_de_cpu;
pub mod ventana_de_edicion;
