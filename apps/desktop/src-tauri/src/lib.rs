//! Núcleo de Windgets. Las reglas de negocio viven aquí (D-188); las vistas solo presentan.

pub mod tipos;

/// Arranca la aplicación con la ventana principal vacía (P00).
pub fn run() {
    if let Err(error) = tauri::Builder::default().run(tauri::generate_context!()) {
        eprintln!("No se pudo iniciar Windgets: {error}");
        std::process::exit(1);
    }
}
