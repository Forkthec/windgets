//! Tipos de los contratos (contratos.md). Fuente única: ts-rs los exporta a src/types/index.ts.
//! La prueba de equivalencia con docs/tipos.ts está en scripts/verificar_tipos.mjs.
//! Un archivo por sección de docs/tipos.ts; este módulo los reexporta todos.
#![allow(clippy::large_enum_variant, clippy::enum_variant_names)]

mod compartidos;
mod edge_functions;
mod errores;
mod eventos;
mod formatos;
mod integraciones;
mod ipc_catalogos;
mod ipc_cuenta;
mod ipc_distribucion;
mod ipc_escritorio;
mod ipc_etiquetas_columnas;
mod ipc_reportes;
mod ipc_tarjetas;
mod ipc_temas;
mod ipc_widgets;
mod ipc_windi;
mod mapa_comandos;
mod rpc;

pub use compartidos::*;
pub use edge_functions::*;
pub use errores::*;
pub use eventos::*;
pub use formatos::*;
pub use integraciones::*;
pub use ipc_catalogos::*;
pub use ipc_cuenta::*;
pub use ipc_distribucion::*;
pub use ipc_escritorio::*;
pub use ipc_etiquetas_columnas::*;
pub use ipc_reportes::*;
pub use ipc_tarjetas::*;
pub use ipc_temas::*;
pub use ipc_widgets::*;
pub use ipc_windi::*;
pub use mapa_comandos::*;
pub use rpc::*;
