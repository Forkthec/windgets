//! Pruebas del Núcleo de HE-05 (distribución de widgets en la pantalla de edición). Monitor de 1920 × 1080 y
//! los cuatro widgets por defecto: Reloj (40, 40, 320 × 160), Calendario (40, 220, 320 × 340), Tareas del día
//! (380, 40, 360 × 520) y Kanban (760, 40, 640 × 520).

use super::pruebas_de_widgets::{CALENDARIO, KANBAN, RELOJ, TAREAS, con_widgets_por_defecto};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{LayoutEditRectResult, Monitor, WidgetType};

const AHORA_MS: i64 = 1_793_600_000_000;

fn abrir() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_widgets_por_defecto();
    bloquear(servicio.abrir_edicion(&base, USUARIO, &[])).unwrap();
    (base, servicio)
}

fn rect(r: &LayoutEditRectResult) -> (i64, i64, i64, i64) {
    (r.rect.x, r.rect.y, r.rect.width, r.rect.height)
}

/// La posición y el tamaño guardados en el tema aplicado.
fn guardado(base: &BaseLocal, widget: &str) -> (i64, i64, i64, i64) {
    bloquear(async {
        sqlx::query_as("SELECT x, y, width, height FROM theme_widget WHERE widget_id = ?")
            .bind(widget)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

fn pendientes(base: &BaseLocal) -> i64 {
    bloquear(async {
        sqlx::query_scalar("SELECT COUNT(*) FROM pending_change WHERE entity_kind = 'theme_widget'")
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn ca_he_05_hu01_ca01() {
    // HE-05-HU01-CA01 · Los widgets activos en su posición y tamaño reales, sobre el monitor principal (ET02).
    let (base, servicio) = con_widgets_por_defecto();
    let r = bloquear(servicio.abrir_edicion(&base, USUARIO, &[])).unwrap();
    assert_eq!((r.monitor.width, r.monitor.height), (1920, 1080));
    let rects: Vec<_> = r
        .widgets
        .iter()
        .map(|w| (w.widget_id.0.as_str(), w.x, w.y, w.width, w.height))
        .collect();
    assert_eq!(
        rects,
        [
            (RELOJ, 40, 40, 320, 160),
            (CALENDARIO, 40, 220, 320, 340),
            (TAREAS, 380, 40, 360, 520),
            (KANBAN, 760, 40, 640, 520),
        ]
    );
    assert!(!servicio.edicion_con_cambios());
}

#[test]
fn ca_he_05_hu01_ca02() {
    // HE-05-HU01-CA02 · Sin widgets activos, solo el wallpaper (ET06; D-159).
    let (base, servicio) = con_widgets_por_defecto();
    bloquear(async {
        sqlx::query("UPDATE theme_widget SET is_active = 0")
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    let r = bloquear(servicio.abrir_edicion(&base, USUARIO, &[])).unwrap();
    assert!(r.widgets.is_empty());
}

#[test]
fn ca_he_05_hu02_ca01() {
    // HE-05-HU02-CA01 · El widget queda en la posición libre, pero el tema no cambia hasta «Guardar» (ET01).
    let (base, servicio) = abrir();
    let r = servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    assert_eq!((rect(&r), r.collided), ((40, 600, 320, 160), false));
    assert!(servicio.edicion_con_cambios());
    assert_eq!(guardado(&base, RELOJ), (40, 40, 320, 160));
}

#[test]
fn ca_he_05_hu02_ca02() {
    // HE-05-HU02-CA02 · Fuera del borde, el widget se ajusta al borde, dentro del área visible (ET02).
    let (_, servicio) = abrir();
    let r = servicio.mover_en_edicion(KANBAN, 1500, 900).unwrap();
    assert_eq!(rect(&r), (1280, 560, 640, 520));
    let r = servicio.mover_en_edicion(KANBAN, -50, 900).unwrap();
    assert_eq!(rect(&r).0, 0);
}

#[test]
fn ca_he_05_hu02_ca03() {
    // HE-05-HU02-CA03 · Sobre otro widget: colisión y vuelve a su última posición libre (ET03; D-042).
    let (_, servicio) = abrir();
    servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    let r = servicio.mover_en_edicion(RELOJ, 400, 100).unwrap();
    assert!(r.collided);
    assert_eq!(rect(&r), (40, 600, 320, 160));
    // Tocar el borde de otro no es superponerse.
    let r = servicio.mover_en_edicion(RELOJ, 40, 560).unwrap();
    assert_eq!((rect(&r), r.collided), ((40, 560, 320, 160), false));
}

#[test]
fn ca_he_05_hu03_ca01() {
    // HE-05-HU03-CA01 · Desde la esquina inferior derecha: nuevo tamaño, sin guardar todavía (ET01).
    let (base, servicio) = abrir();
    let r = servicio
        .redimensionar_en_edicion(KANBAN, 760, 40, 700, 600)
        .unwrap();
    assert_eq!((rect(&r), r.collided), ((760, 40, 700, 600), false));
    assert_eq!(guardado(&base, KANBAN), (760, 40, 640, 520));
}

#[test]
fn ca_he_05_hu03_ca02() {
    // HE-05-HU03-CA02 (P29) · Cada tipo tiene el mínimo en que su contenido se lee completo (ET02): el Reloj no baja
    // de 200 × 100 ni el Kanban de 400 × 260.
    let (_, servicio) = abrir();
    let r = servicio
        .redimensionar_en_edicion(RELOJ, 40, 40, 50, 20)
        .unwrap();
    assert_eq!(rect(&r), (40, 40, 200, 100));
    let r = servicio
        .redimensionar_en_edicion(KANBAN, 760, 40, 120, 120)
        .unwrap();
    assert_eq!(rect(&r), (760, 40, 400, 260));
    // Todos los tipos tienen un mínimo mayor que el antiguo 100 × 100 y menor que su tamaño inicial.
    for tipo in [
        WidgetType::Clock,
        WidgetType::Calendar,
        WidgetType::DailyTasks,
        WidgetType::Kanban,
        WidgetType::Weather,
        WidgetType::News,
        WidgetType::MusicPlayer,
        WidgetType::Animation,
        WidgetType::ImageCarousel,
        WidgetType::StaticImage,
        WidgetType::Text,
    ] {
        let (ancho, alto) = distribucion::tamano_minimo(&tipo);
        assert!(ancho >= 160 && alto >= 80, "{tipo:?}");
    }
    // A 150 % el mínimo se mide en píxeles de pantalla: 200 × 100 son 300 × 150 físicos.
    let monitor = Monitor {
        id: "0".into(),
        x: 0,
        y: 0,
        width: 2880,
        height: 1620,
        scale_factor: 1.5,
    };
    assert_eq!(
        distribucion::tamano_minimo_fisico(&WidgetType::Clock, &monitor),
        (300, 150)
    );
}

#[test]
fn ca_he_05_hu03_ca03() {
    // HE-05-HU03-CA03 · El tamaño se detiene en el borde del área visible (ET03).
    let (_, servicio) = abrir();
    let r = servicio
        .redimensionar_en_edicion(KANBAN, 760, 40, 5000, 5000)
        .unwrap();
    assert_eq!(rect(&r), (760, 40, 1160, 1040));
}

#[test]
fn ca_he_05_hu03_ca04() {
    // HE-05-HU03-CA04 · Hasta otro widget: se detiene en su borde y marca la colisión (ET04; D-042).
    let (_, servicio) = abrir();
    let r = servicio
        .redimensionar_en_edicion(RELOJ, 40, 40, 500, 160)
        .unwrap();
    assert!(r.collided);
    assert_eq!(rect(&r), (40, 40, 340, 160));
    let r = servicio
        .redimensionar_en_edicion(RELOJ, 40, 40, 320, 400)
        .unwrap();
    assert!(r.collided);
    assert_eq!(rect(&r), (40, 40, 320, 180));
}

#[test]
fn ca_he_05_hu04_ca01_y_ca02() {
    // HE-05-HU04-CA01, CA02 · «Guardar» escribe en el tema aplicado la posición y el tamaño, encola cada widget que
    // cambió una sola vez y cierra la edición con «Cambios guardados.» (ET01, ET02, ET04).
    let (base, servicio) = abrir();
    servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    servicio
        .redimensionar_en_edicion(KANBAN, 760, 40, 700, 600)
        .unwrap();
    let (_, mensaje) = bloquear(servicio.guardar_edicion(&base, USUARIO, AHORA_MS))
        .unwrap()
        .unwrap();
    assert_eq!(mensaje.message, "Cambios guardados.");
    assert_eq!(guardado(&base, RELOJ), (40, 600, 320, 160));
    assert_eq!(guardado(&base, KANBAN), (760, 40, 700, 600));
    assert_eq!(guardado(&base, TAREAS), (380, 40, 360, 520));
    assert_eq!(pendientes(&base), 2);
    assert!(!servicio.edicion_con_cambios());
}

#[test]
fn ca_he_05_hu04_ca03() {
    // HE-05-HU04-CA03 · Sin cambios: cierra sin mensaje y no toca el tema aplicado (ET03; D-159).
    let (base, servicio) = abrir();
    assert!(
        bloquear(servicio.guardar_edicion(&base, USUARIO, AHORA_MS))
            .unwrap()
            .is_none()
    );
    assert_eq!(pendientes(&base), 0);
}

#[test]
fn ca_he_05_hu05_ca02() {
    // HE-05-HU05-CA02 · Con cambios, el estado pide el mensaje de salida (ET01; D-204).
    let (_, servicio) = abrir();
    assert!(!servicio.edicion_con_cambios());
    servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    assert!(servicio.edicion_con_cambios());
}

#[test]
fn ca_he_05_hu05_ca03() {
    // HE-05-HU05-CA03 · «Salir sin guardar»: los widgets quedan como estaban y «No se guardaron cambios.» (ET03).
    let (base, servicio) = abrir();
    servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    let mensaje = servicio.cancelar_edicion().unwrap();
    assert_eq!(mensaje.message, "No se guardaron cambios.");
    assert_eq!(guardado(&base, RELOJ), (40, 40, 320, 160));
    assert_eq!(pendientes(&base), 0);
    // Al volver a abrir, cada widget está en su posición y tamaño anteriores.
    let r = bloquear(servicio.abrir_edicion(&base, USUARIO, &[])).unwrap();
    assert_eq!((r.widgets[0].x, r.widgets[0].y), (40, 40));
}

#[test]
fn ca_he_05_hu05_ca05() {
    // HE-05-HU05-CA05 · Sin cambios, cerrar no da mensaje (ET06; D-159).
    let (_, servicio) = abrir();
    assert!(servicio.cancelar_edicion().is_none());
}

/// Un monitor principal de 2560 × 1440 con la escala de Windows en 125 % (píxeles físicos, HE-05-HU02-ET07).
fn monitor_a_escala() -> crate::tipos::Monitor {
    crate::tipos::Monitor {
        id: "0".into(),
        x: 0,
        y: 0,
        width: 2560,
        height: 1440,
        scale_factor: 1.25,
    }
}

/// Lo que la capa muestra en el escritorio para un widget (los mismos rectángulos que lee IPC-DESK-01).
fn en_el_escritorio(base: &BaseLocal, widget: &str) -> (i64, i64, i64, i64) {
    let rects = bloquear(ServicioDePersonalizacion::rectangulos_ajustados(
        base,
        USUARIO,
        &[monitor_a_escala()],
    ))
    .unwrap();
    let w = rects.iter().find(|w| w.widget_id.0 == widget).unwrap();
    (w.x, w.y, w.width, w.height)
}

#[test]
fn ca_he_05_hu02_ca05() {
    // HE-05-HU02-CA05 · A 125 %, la edición parte de los mismos rectángulos que el escritorio y, al guardar, el
    // widget queda en el escritorio donde se soltó, sin volver a escalarlo (ET07; HE-05-HU04-ET05).
    let (base, servicio) = con_widgets_por_defecto();
    let abierta = bloquear(servicio.abrir_edicion(&base, USUARIO, &[monitor_a_escala()])).unwrap();
    let reloj = abierta
        .widgets
        .iter()
        .find(|w| w.widget_id.0 == RELOJ)
        .unwrap();
    assert_eq!(
        (reloj.x, reloj.y, reloj.width, reloj.height),
        en_el_escritorio(&base, RELOJ)
    );
    let movido = servicio.mover_en_edicion(RELOJ, 1800, 1000).unwrap();
    assert!(!movido.collided);
    bloquear(servicio.guardar_edicion(&base, USUARIO, AHORA_MS))
        .unwrap()
        .unwrap();
    assert_eq!(en_el_escritorio(&base, RELOJ), rect(&movido));
    // Los que no cambiaron siguen donde estaban en el escritorio.
    let tareas = abierta
        .widgets
        .iter()
        .find(|w| w.widget_id.0 == TAREAS)
        .unwrap();
    assert_eq!(
        en_el_escritorio(&base, TAREAS),
        (tareas.x, tareas.y, tareas.width, tareas.height)
    );
}

#[test]
fn ca_he_05_hu03_ca06() {
    // HE-05-HU03-CA06 · A 125 %, el widget redimensionado se ve en el escritorio con el mismo tamaño que en la
    // edición y no pasa del área visible del monitor principal (ET03).
    let (base, servicio) = con_widgets_por_defecto();
    let abierta = bloquear(servicio.abrir_edicion(&base, USUARIO, &[monitor_a_escala()])).unwrap();
    let kanban = abierta
        .widgets
        .iter()
        .find(|w| w.widget_id.0 == KANBAN)
        .unwrap();
    let r = servicio
        .redimensionar_en_edicion(KANBAN, kanban.x, kanban.y, 9_000, 9_000)
        .unwrap();
    assert_eq!(r.rect.x + r.rect.width, 2560);
    assert_eq!(r.rect.y + r.rect.height, 1440);
    bloquear(servicio.guardar_edicion(&base, USUARIO, AHORA_MS))
        .unwrap()
        .unwrap();
    assert_eq!(en_el_escritorio(&base, KANBAN), rect(&r));
}

#[test]
fn ca_he_05_hu04_ca05() {
    // HE-05-HU04-CA05 · «Guardar» incluye todos los cambios hechos hasta ese momento (ET05).
    let (base, servicio) = abrir();
    servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    servicio.mover_en_edicion(RELOJ, 40, 700).unwrap();
    servicio
        .redimensionar_en_edicion(KANBAN, 760, 40, 700, 600)
        .unwrap();
    bloquear(servicio.guardar_edicion(&base, USUARIO, AHORA_MS))
        .unwrap()
        .unwrap();
    assert_eq!(guardado(&base, RELOJ), (40, 700, 320, 160));
    assert_eq!(guardado(&base, KANBAN), (760, 40, 700, 600));
}

#[test]
fn ca_he_05_hu04_et06() {
    // HE-05-HU04-ET06 · Un widget eliminado desde otro computador: mover, redimensionar o guardar responden su
    // mensaje y la pantalla de edición no se cierra (los cambios siguen en memoria).
    let (base, servicio) = abrir();
    servicio.mover_en_edicion(RELOJ, 40, 600).unwrap();
    bloquear(async {
        sqlx::query("DELETE FROM theme_widget WHERE widget_id = ?")
            .bind(RELOJ)
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    let e = bloquear(servicio.guardar_edicion(&base, USUARIO, AHORA_MS)).unwrap_err();
    assert_eq!(e.code, ErrorCode::LayoutWidgetMissing);
    assert_eq!(
        e.message,
        "Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición."
    );
    assert!(servicio.edicion_con_cambios());
    let e = servicio.mover_en_edicion("no-existe", 0, 0).unwrap_err();
    assert_eq!(e.code, ErrorCode::LayoutWidgetMissing);
    let e = servicio
        .redimensionar_en_edicion("no-existe", 0, 0, 200, 200)
        .unwrap_err();
    assert_eq!(e.code, ErrorCode::LayoutWidgetMissing);
}
