//! Pruebas del Núcleo de HE-06-HU05 (consultar el tablero Kanban en el widget Kanban, IPC-CARD-15).

use super::pruebas::*;
use super::*;

fn widget(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<KanbanWidgetColumn> {
    bloquear(servicio.widget_kanban(USUARIO)).unwrap().columns
}

fn titulos(columna: &KanbanWidgetColumn) -> Vec<&str> {
    columna.titles.iter().map(|t| t.title.as_str()).collect()
}

#[test]
fn ca_he_06_hu05_ca01() {
    // HE-06-HU05-CA01 · Tablero en el widget: las columnas en el orden del tablero, con nombre, color y cantidad
    // de tarjetas (ET01), y los títulos de cada columna en su orden (ET02).
    let servicio = con_semilla();
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Leer capítulo 3",
        "2026-11-20",
        2048.0,
    );
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    tarjeta_en(&servicio, HECHO, "Pagar arriendo", "2026-11-20", 1024.0);
    let columnas = widget(&servicio);
    let tablero = bloquear(servicio.tablero(USUARIO)).unwrap().columns;
    assert_eq!(
        columnas.iter().map(|c| &c.column).collect::<Vec<_>>(),
        tablero.iter().map(|c| &c.column).collect::<Vec<_>>()
    );
    let nombres: Vec<_> = columnas.iter().map(|c| c.column.name.as_str()).collect();
    assert_eq!(nombres, ["Por hacer", "En progreso", "Hecho"]);
    let cantidades: Vec<_> = columnas.iter().map(|c| c.column.card_count).collect();
    assert_eq!(cantidades, [2, 0, 1]);
    assert_eq!(
        titulos(&columnas[0]),
        ["Entregar informe", "Leer capítulo 3"]
    );
    assert!(columnas[1].titles.is_empty());
    assert_eq!(titulos(&columnas[2]), ["Pagar arriendo"]);
    assert!(columnas.iter().all(|c| c.extra_count == 0));
}

#[test]
fn ca_he_06_hu05_ca02() {
    // HE-06-HU05-CA02 · Tarjeta movida: tras moverla en el tablero, el widget la muestra en la columna de destino
    // y con las cantidades de ambas columnas al día (ET03; la vista vuelve a leer con EV-07).
    let servicio = con_semilla();
    let id = tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    bloquear(servicio.mover_tarjeta(
        USUARIO,
        CardMoveParams {
            card_id: Uuid(id.clone()),
            column_id: Uuid(EN_PROGRESO.into()),
            placement: Placement::Variant1(PlacementVariant1 {
                kind: PlacementVariant1Kind::End,
            }),
        },
    ))
    .unwrap();
    let columnas = widget(&servicio);
    assert!(columnas[0].titles.is_empty());
    assert_eq!(columnas[1].titles[0].card_id, Uuid(id));
    let cantidades: Vec<_> = columnas.iter().map(|c| c.column.card_count).collect();
    assert_eq!(cantidades, [0, 1, 0]);
}

#[test]
fn ca_he_06_hu05_ca03() {
    // HE-06-HU05-CA03 · Más de 5 tarjetas en una columna: los títulos de las primeras 5 y la cantidad restante.
    let servicio = con_semilla();
    for i in 1..=7 {
        tarjeta_en(
            &servicio,
            POR_HACER,
            &format!("Tarjeta {i}"),
            "2026-11-20",
            f64::from(i) * 1024.0,
        );
    }
    let columnas = widget(&servicio);
    assert_eq!(
        titulos(&columnas[0]),
        [
            "Tarjeta 1",
            "Tarjeta 2",
            "Tarjeta 3",
            "Tarjeta 4",
            "Tarjeta 5"
        ]
    );
    assert_eq!(columnas[0].extra_count, 2);
    assert_eq!(columnas[0].column.card_count, 7);
}

#[test]
fn ca_he_06_hu05_ca04() {
    // HE-06-HU05-CA04 · Tablero sin tarjetas: las columnas vacías; el texto lo pone la vista.
    let columnas = widget(&con_semilla());
    assert_eq!(columnas.len(), 3);
    assert!(
        columnas
            .iter()
            .all(|c| c.titles.is_empty() && c.extra_count == 0 && c.column.card_count == 0)
    );
}
