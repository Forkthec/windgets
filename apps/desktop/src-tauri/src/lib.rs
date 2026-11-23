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

/// Arranca la aplicación con la ventana principal y los comandos IPC del Núcleo. Con la feature `spike`
/// (solo en Windows) arranca además el prototipo del spike P01 (WorkerW y Raw Input, D-131 y D-186).
pub fn run() {
    let builder = tauri::Builder::default()
        // INT-10: una segunda ejecución (por ejemplo, Windows al abrir `windgets://auth/callback?…`) entrega sus
        // argumentos a esta instancia y termina. Va primero, como pide el plugin.
        .plugin(tauri_plugin_single_instance::init(
            |app, argumentos, _carpeta| {
                puente_ipc::atender_argumentos(app, argumentos);
            },
        ))
        .plugin(tauri_plugin_dialog::init())
        .manage(puente_ipc::Nucleo::nuevo())
        .invoke_handler(tauri::generate_handler![
            puente_ipc::connectivity_get,
            puente_ipc::system_time_format_get,
            puente_ipc::auth_register_start,
            puente_ipc::auth_register_verify,
            puente_ipc::auth_register_resend,
            puente_ipc::auth_register_cancel,
            puente_ipc::auth_sign_in,
            puente_ipc::auth_google_start,
            puente_ipc::auth_google_cancel,
            puente_ipc::auth_recovery_request,
            puente_ipc::auth_recovery_verify,
            puente_ipc::auth_recovery_resend,
            puente_ipc::auth_recovery_set_password,
            puente_ipc::auth_get_session,
            puente_ipc::auth_get_sign_out_info,
            puente_ipc::auth_sign_out,
            puente_ipc::autostart_get,
            puente_ipc::autostart_set,
            puente_ipc::app_open_screen,
            puente_ipc::app_hide_main_window,
            puente_ipc::windi_get_conversation,
            puente_ipc::windi_send_message,
            puente_ipc::windi_confirm_proposal,
            puente_ipc::windi_reject_proposal,
            puente_ipc::app_get_last_screen,
            puente_ipc::app_set_last_screen,
            puente_ipc::app_request_exit,
            puente_ipc::app_exit,
            puente_ipc::card_create,
            puente_ipc::label_list,
            puente_ipc::label_create,
            puente_ipc::label_update,
            puente_ipc::label_get_delete_info,
            puente_ipc::label_delete,
            puente_ipc::catalog_list,
            puente_ipc::column_create,
            puente_ipc::column_update,
            puente_ipc::column_get_delete_info,
            puente_ipc::column_delete,
            puente_ipc::column_reorder,
            puente_ipc::report_resolve_range,
            puente_ipc::report_get_meta,
            puente_ipc::report_get_completed,
            puente_ipc::report_get_compliance,
            puente_ipc::report_get_status_breakdown,
            puente_ipc::card_list_board,
            puente_ipc::kanban_widget_get,
            puente_ipc::calendar_get_month,
            puente_ipc::calendar_get_week,
            puente_ipc::calendar_get_day,
            puente_ipc::column_list,
            puente_ipc::card_get,
            puente_ipc::card_update,
            puente_ipc::card_delete,
            puente_ipc::card_move,
            puente_ipc::card_set_completed,
            puente_ipc::agenda_get_day,
            puente_ipc::card_assign_time_block,
            puente_ipc::card_unassign_time_block,
            puente_ipc::planner_get_today,
            puente_ipc::sync_get_status,
            puente_ipc::theme_list,
            puente_ipc::theme_draft_open,
            puente_ipc::theme_draft_select,
            puente_ipc::theme_draft_update,
            puente_ipc::theme_draft_reset,
            puente_ipc::theme_draft_get_status,
            puente_ipc::theme_draft_discard,
            puente_ipc::theme_draft_save_as,
            puente_ipc::theme_apply,
            puente_ipc::theme_rename,
            puente_ipc::theme_delete,
            puente_ipc::widget_add,
            puente_ipc::widget_get_data,
            puente_ipc::widget_configure,
            puente_ipc::weather_city_search,
            puente_ipc::media_get_session,
            puente_ipc::system_open_url,
            puente_ipc::preference_get,
            puente_ipc::preference_set,
            puente_ipc::media_toggle_play_pause,
            puente_ipc::media_skip_next,
            puente_ipc::media_skip_previous,
            puente_ipc::image_import,
            puente_ipc::theme_draft_save,
            puente_ipc::theme_draft_apply,
            puente_ipc::theme_get_applied,
            puente_ipc::asset_resolve,
            puente_ipc::layer_get_initial_state,
            puente_ipc::wallpaper_get_status,
            puente_ipc::wallpaper_fit_get,
            puente_ipc::wallpaper_fit_set,
            puente_ipc::widget_list,
            puente_ipc::widget_set_active,
            puente_ipc::widget_delete,
            puente_ipc::layout_edit_open,
            puente_ipc::layout_edit_move,
            puente_ipc::layout_edit_resize,
            puente_ipc::layout_edit_get_status,
            puente_ipc::layout_edit_save,
            puente_ipc::layout_edit_cancel,
            puente_ipc::widget_catalog_get,
        ])
        // HE-17-HU01: «×» oculta la ventana principal; la aplicación sigue en el área de notificación.
        .on_window_event(integracion_con_el_sistema::area_de_notificacion::atender_ventana)
        .setup(|app| {
            integracion_con_el_sistema::area_de_notificacion::crear_icono(app.handle())?;
            puente_ipc::vigilar_conexion(app.handle().clone());
            puente_ipc::vigilar_dia(app.handle().clone());
            // HE-16-HU03-ET09: antes de sincronizar, la limpieza que quedó pendiente al cerrar la sesión.
            puente_ipc::repetir_limpieza_pendiente(app.handle());
            puente_ipc::sincronizar(app.handle().clone());
            puente_ipc::vigilar_widgets_externos(app.handle().clone());
            puente_ipc::vigilar_carga(app.handle().clone());
            puente_ipc::vigilar_multimedia(app.handle().clone());
            #[cfg(all(windows, feature = "spike"))]
            host_del_wallpaper::spike::iniciar(app.handle())?;
            // HE-02-HU01: la capa se ancla a WorkerW al abrir la aplicación y se muestra si hay sesión guardada
            // (CA02); sin sesión se queda el fondo original de Windows (CA05).
            #[cfg(all(windows, not(feature = "spike")))]
            host_del_wallpaper::anclaje::iniciar(app.handle());
            let manejador = app.handle().clone();
            tauri::async_runtime::spawn(
                async move { puente_ipc::avisar_wallpaper(&manejador).await },
            );
            Ok(())
        });
    if let Err(error) = builder.run(tauri::generate_context!()) {
        eprintln!("No se pudo iniciar Windgets: {error}");
        std::process::exit(1);
    }
}
