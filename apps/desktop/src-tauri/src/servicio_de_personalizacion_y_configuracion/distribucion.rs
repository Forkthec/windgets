//! La distribución de widgets en edición (HE-05, C-03 «pantalla de edición»): IPC-LAY-01 a IPC-LAY-06. Mientras la
//! pantalla está abierta, la posición y el tamaño de cada widget viven en memoria; solo «Guardar» los escribe en
//! el tema aplicado (HE-05-HU02-CA01, HE-05-HU04-ET02).
//!
//! DUDA: HE-05-HU01 el contrato devuelve un solo monitor y la pantalla de edición cubre «todo el escritorio».
//! Valor usado: el monitor principal (el que contiene el origen), en las mismas coordenadas de la capa; sin
//! monitores leídos, 1920 × 1080 (docs/DUDAS.md).

use serde_json::Value;

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::{campos, resultado};
use crate::tipos::{
    LayoutEditOpenResult, LayoutEditRectResult, Monitor, ResultMessage, WidgetRect, WidgetType,
};

/// HE-05-HU03-ET02 (P29): el tamaño mínimo de cada tipo de widget, en píxeles de pantalla (al 100 %), es el menor en
/// que todo su contenido se lee completo: textos sin cortar, la cuadrícula del mes entera, una tarjeta o un titular
/// con su casilla o su fuente, y los botones del reproductor.
pub fn tamano_minimo(tipo: &WidgetType) -> (i64, i64) {
    match tipo {
        WidgetType::Clock => (200, 100),
        WidgetType::Calendar => (260, 260),
        WidgetType::DailyTasks => (260, 180),
        WidgetType::Kanban => (400, 260),
        WidgetType::Weather => (200, 140),
        WidgetType::News => (260, 180),
        WidgetType::MusicPlayer => (260, 160),
        WidgetType::Animation => (160, 120),
        WidgetType::ImageCarousel => (200, 120),
        WidgetType::StaticImage => (160, 100),
        WidgetType::Text => (160, 80),
    }
}

/// El mínimo en píxeles físicos del monitor, como los rectángulos de los widgets (HE-05-HU02-ET07): al 150 % un
/// mínimo de 200 px de pantalla son 300 físicos, para que se lea igual a cualquier escala.
pub fn tamano_minimo_fisico(tipo: &WidgetType, monitor: &Monitor) -> (i64, i64) {
    let escala = if monitor.scale_factor > 0.0 {
        monitor.scale_factor
    } else {
        1.0
    };
    let (ancho, alto) = tamano_minimo(tipo);
    (
        (ancho as f64 * escala).ceil() as i64,
        (alto as f64 * escala).ceil() as i64,
    )
}

/// La distribución en edición.
#[derive(Debug, Clone)]
pub(super) struct Edicion {
    tema: String,
    monitor: Monitor,
    original: Vec<WidgetRect>,
    actual: Vec<WidgetRect>,
}

impl Edicion {
    fn dirty(&self) -> bool {
        self.actual != self.original
    }
}

/// ¿Se superponen? Tocarse en un borde no es superponerse.
fn se_superponen(a: &WidgetRect, b: &WidgetRect) -> bool {
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/// HE-05-HU04-ET06: «Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.»
fn widget_que_ya_no_existe() -> AppError {
    error(
        ErrorCode::LayoutWidgetMissing,
        messages::WIDGET_YA_NO_EXISTE_EN_LA_EDICION,
        None,
    )
}

/// El monitor principal: el que contiene el origen, o el primero; sin monitores, 1920 × 1080.
pub fn monitor_principal(monitores: &[Monitor]) -> Monitor {
    monitores
        .iter()
        .find(|m| m.x <= 0 && 0 < m.x + m.width && m.y <= 0 && 0 < m.y + m.height)
        .or_else(|| monitores.first())
        .cloned()
        .unwrap_or(Monitor {
            id: "0".into(),
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
        })
}

impl ServicioDePersonalizacion {
    fn con_edicion<T>(&self, f: impl FnOnce(&mut Option<Edicion>) -> T) -> T {
        match self.edicion.lock() {
            Ok(mut guardia) => f(&mut guardia),
            Err(envenenado) => f(&mut envenenado.into_inner()),
        }
    }

    /// IPC-LAY-01 `layout_edit_open` (HE-05-HU01): los widgets activos del tema aplicado en su posición y tamaño
    /// reales (ET02); sin widgets activos, ninguno (ET06; D-159). Son los mismos rectángulos que muestra la capa,
    /// ya ajustados al monitor principal, en píxeles físicos (HE-05-HU02-ET07, HE-05-HU04-ET05).
    pub async fn abrir_edicion(
        &self,
        base: &BaseLocal,
        user_id: &str,
        monitores: &[Monitor],
    ) -> Result<LayoutEditOpenResult, AppError> {
        let tema = Self::id_del_tema_aplicado(base, user_id)
            .await?
            .unwrap_or_default();
        let widgets = Self::rectangulos_ajustados(base, user_id, monitores).await?;
        let monitor = monitor_principal(monitores);
        self.con_edicion(|e| {
            *e = Some(Edicion {
                tema,
                monitor: monitor.clone(),
                original: widgets.clone(),
                actual: widgets.clone(),
            });
        });
        Ok(LayoutEditOpenResult { monitor, widgets })
    }

    /// El widget en edición y los demás. Un widget que no está en la distribución (por ejemplo, eliminado desde otro
    /// computador) es `layout.widget_missing`, con su mensaje; la pantalla de edición no se cierra (HE-05-HU04-ET06).
    fn en_edicion(&self, widget_id: &str) -> Result<(Edicion, usize), AppError> {
        self.con_edicion(|e| {
            let edicion = e.clone().ok_or_else(widget_que_ya_no_existe)?;
            let i = edicion
                .actual
                .iter()
                .position(|w| w.widget_id.0 == widget_id)
                .ok_or_else(widget_que_ya_no_existe)?;
            Ok((edicion, i))
        })
    }

    fn fijar(&self, i: usize, rect: &WidgetRect) {
        self.con_edicion(|e| {
            if let Some(edicion) = e
                && let Some(w) = edicion.actual.get_mut(i)
            {
                *w = rect.clone();
            }
        });
    }

    /// IPC-LAY-02 `layout_edit_move` (HE-05-HU02): el widget queda dentro del área visible (ET02); si queda sobre
    /// otro, `collided` y el widget sigue en su última posición libre (ET03; D-042).
    pub fn mover_en_edicion(
        &self,
        widget_id: &str,
        x: i64,
        y: i64,
    ) -> Result<LayoutEditRectResult, AppError> {
        let (edicion, i) = self.en_edicion(widget_id)?;
        let actual = edicion.actual[i].clone();
        let m = &edicion.monitor;
        let pedido = WidgetRect {
            x: x.clamp(m.x, (m.x + m.width - actual.width).max(m.x)),
            y: y.clamp(m.y, (m.y + m.height - actual.height).max(m.y)),
            ..actual.clone()
        };
        let choca = edicion
            .actual
            .iter()
            .enumerate()
            .any(|(j, otro)| j != i && se_superponen(&pedido, otro));
        if choca {
            return Ok(LayoutEditRectResult {
                rect: actual,
                collided: true,
            });
        }
        self.fijar(i, &pedido);
        Ok(LayoutEditRectResult {
            rect: pedido,
            collided: false,
        })
    }

    /// IPC-LAY-03 `layout_edit_resize` (HE-05-HU03): el mínimo de su tipo (ET02), máximo hasta el borde del área
    /// visible (ET03) y se detiene en el borde de otro widget, con `collided` (ET04; D-042).
    pub fn redimensionar_en_edicion(
        &self,
        widget_id: &str,
        x: i64,
        y: i64,
        ancho: i64,
        alto: i64,
    ) -> Result<LayoutEditRectResult, AppError> {
        let (edicion, i) = self.en_edicion(widget_id)?;
        let actual = edicion.actual[i].clone();
        let m = &edicion.monitor;
        // ET03: un monitor más chico que el mínimo deja el widget del tamaño del monitor.
        let (minimo_ancho, minimo_alto) = tamano_minimo_fisico(&actual.r#type, m);
        let (minimo_ancho, minimo_alto) = (minimo_ancho.min(m.width), minimo_alto.min(m.height));
        let x = x.clamp(m.x, m.x + m.width - minimo_ancho);
        let y = y.clamp(m.y, m.y + m.height - minimo_alto);
        let mut ancho = ancho.clamp(minimo_ancho, m.x + m.width - x);
        let mut alto = alto.clamp(minimo_alto, m.y + m.height - y);
        let mut choca = false;
        for (j, otro) in edicion.actual.iter().enumerate() {
            let pedido = WidgetRect {
                x,
                y,
                width: ancho,
                height: alto,
                ..actual.clone()
            };
            if j == i || !se_superponen(&pedido, otro) {
                continue;
            }
            choca = true;
            // El otro está a la derecha o debajo del widget antes de crecer: el borde de ese lado se detiene ahí.
            if otro.x >= actual.x + actual.width {
                ancho = ancho.min(otro.x - x);
            } else if otro.y >= actual.y + actual.height {
                alto = alto.min(otro.y - y);
            } else {
                ancho = actual.width;
                alto = actual.height;
            }
        }
        if ancho < minimo_ancho || alto < minimo_alto {
            return Ok(LayoutEditRectResult {
                rect: actual,
                collided: true,
            });
        }
        let rect = WidgetRect {
            x,
            y,
            width: ancho,
            height: alto,
            ..actual
        };
        self.fijar(i, &rect);
        Ok(LayoutEditRectResult {
            rect,
            collided: choca,
        })
    }

    /// IPC-LAY-04 `layout_edit_get_status` (HE-05-HU05-CA02; D-204): si hay cambios sin guardar.
    pub fn edicion_con_cambios(&self) -> bool {
        self.con_edicion(|e| e.as_ref().is_some_and(Edicion::dirty))
    }

    /// IPC-LAY-05 `layout_edit_save` (HE-05-HU04): escribe en el tema aplicado la posición y el tamaño de los
    /// widgets que cambiaron y los encola una sola vez (ET01, ET04). Sin cambios no escribe ni da mensaje (CA03,
    /// ET03). Guarda también el tamaño del monitor como escritorio de referencia, para que la capa muestre los
    /// widgets sin volver a escalarlos (ET05). Si un widget ya no existe, `layout.widget_missing` y la edición sigue
    /// abierta (ET06). Cierra la edición. Devuelve el tema y el mensaje, si lo hay.
    pub async fn guardar_edicion(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ahora_ms: i64,
    ) -> Result<Option<(String, ResultMessage)>, AppError> {
        let Some(edicion) = self.con_edicion(|e| e.clone()) else {
            return Ok(None);
        };
        if !edicion.dirty() {
            self.con_edicion(|e| *e = None);
            return Ok(None);
        }
        let (ref_ancho, ref_alto) = (edicion.monitor.width, edicion.monitor.height);
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ahora = instante(ahora_ms).0;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        for (nuevo, viejo) in edicion.actual.iter().zip(&edicion.original) {
            if nuevo == viejo {
                continue;
            }
            let id: String = sqlx::query_scalar(
                "SELECT id FROM theme_widget WHERE user_id = ? AND theme_id = ? AND widget_id = ?",
            )
            .bind(user_id)
            .bind(&edicion.tema)
            .bind(&nuevo.widget_id.0)
            .fetch_optional(&mut *tx)
            .await
            .map_err(de_sqlx)?
            .ok_or_else(widget_que_ya_no_existe)?;
            let (fields, mods) = campos(
                &[
                    ("x", Value::from(nuevo.x)),
                    ("y", Value::from(nuevo.y)),
                    ("width", Value::from(nuevo.width)),
                    ("height", Value::from(nuevo.height)),
                    ("ref_width", Value::from(ref_ancho)),
                    ("ref_height", Value::from(ref_alto)),
                ],
                &ahora,
            );
            sqlx::query(
                "UPDATE theme_widget SET x = ?, y = ?, width = ?, height = ?, ref_width = ?, ref_height = ?, \
                 field_mods = json_patch(field_mods, ?) WHERE id = ?",
            )
            .bind(nuevo.x)
            .bind(nuevo.y)
            .bind(nuevo.width)
            .bind(nuevo.height)
            .bind(ref_ancho)
            .bind(ref_alto)
            .bind(mods.to_string())
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            encolar_cambio(&mut tx, "theme_widget", &id, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        tx.commit().await.map_err(de_sqlx)?;
        self.con_edicion(|e| *e = None);
        Ok(Some((
            edicion.tema,
            resultado("layout_edit_save", messages::CAMBIOS_GUARDADOS),
        )))
    }

    /// IPC-LAY-06 `layout_edit_cancel` (HE-05-HU05): cada widget vuelve a su posición y tamaño anteriores (nada se
    /// escribió); con cambios, «No se guardaron cambios.» (CA03, ET03); sin cambios, sin mensaje (CA05, ET06).
    pub fn cancelar_edicion(&self) -> Option<ResultMessage> {
        let edicion = self.con_edicion(Option::take)?;
        edicion
            .dirty()
            .then(|| resultado("layout_edit_cancel", messages::DISTRIBUCION_NO_GUARDADA))
    }
}
