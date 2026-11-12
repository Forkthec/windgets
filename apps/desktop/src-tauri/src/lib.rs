//! Núcleo de Windgets. Las reglas de negocio viven aquí (D-188, reparto entre Rust y React); las vistas
//! solo presentan. Un módulo por componente del Núcleo (convenciones.md, «Repositorio»).

pub mod cliente_de_supabase;
pub mod controlador_multimedia;
pub mod host_del_wallpaper;
pub mod integracion_con_el_sistema;
pub mod messages;
pub mod motor_de_sincronizacion;
pub mod puente_ipc;
pub mod repositorios_y_archivos_locales;
pub mod servicio_de_clima_y_noticias;
pub mod servicio_de_personalizacion_y_configuracion;
pub mod servicio_de_sesion;
pub mod servicio_de_windi;
pub mod servicio_del_planificador;
pub mod tipos;

/// Arranca la aplicación con la ventana principal vacía (P00, fundaciones). Con la feature `spike`
/// (solo en Windows) arranca además el prototipo del spike P01 (WorkerW y Raw Input, D-131 y D-186).
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(all(windows, feature = "spike"))]
    let builder = builder.setup(|app| {
        host_del_wallpaper::spike::iniciar(app.handle())?;
        Ok(())
    });
    if let Err(error) = builder.run(tauri::generate_context!()) {
        eprintln!("No se pudo iniciar Windgets: {error}");
        std::process::exit(1);
    }
}
