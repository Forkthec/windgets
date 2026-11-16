//! Integración con el sistema (arquitectura.md, vista 3c, Núcleo · integración con Windows).
//! Responsabilidad: «Área de notificación, instancia única, esquema windgets://, inicio automático y apertura de
//! enlaces en el navegador.»

pub mod area_de_notificacion;
pub mod inicio_automatico;
#[cfg(windows)]
mod registro;
