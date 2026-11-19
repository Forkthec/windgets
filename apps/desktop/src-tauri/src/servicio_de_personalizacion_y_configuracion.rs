//! Servicio de personalización y configuración (arquitectura.md, vista 3a, Núcleo · servicios de negocio y
//! datos locales).
//! Responsabilidad: «Temas (máximo 10), widgets, distribución, plantilla, catálogos, imágenes propias y
//! preferencias.»
//!
//! Aquí vive el borrador del tema en edición (IPC-THEME-03 y 04): una copia en memoria del tema que la
//! persona edita en la pantalla Personalización del wallpaper. Cambiarla no toca el escritorio ni lo guardado
//! (HE-02-HU10-ET04).

use std::sync::Mutex;

use sqlx::Row;
use sqlx::sqlite::SqliteRow;

use crate::messages;
use crate::repositorios_y_archivos_locales::BaseLocal;
use crate::servicio_de_sesion::ConMensaje;
use crate::servicio_del_planificador::{de_sqlx, error, inesperado, resultado};
use crate::tipos::{
    AppError, BackgroundSource, CatalogItem, ErrorCode, FontSize, Hex, ThemeBackground,
    ThemeColors, ThemeContent, ThemeContentFont, ThemeDraftPatch, ThemeDraftPatchBackground,
    ThemeDraftPatchColors, ThemeDraftPatchColorsPrimary, ThemeDraftPatchColorsSecondary,
    ThemeDraftPatchColorsText, ThemeDraftResetParamsPart, ThemeDraftStatus, ThemeDraftView,
    ThemeSummary, Uuid,
};

/// Identificador del tema inicial cuando la base local aún no lo trae (primer inicio sin la primera descarga).
/// DUDA: HE-02-HU10 el modelo no dice con qué `id` se crea «Mi tema» fuera del servidor (lo crea
/// `on_account_confirmed`). Valor neutro: un tema virtual que no se guarda; al llegar el real en `sync_pull`,
/// el real manda.
const TEMA_INICIAL_VIRTUAL: &str = "mi-tema-inicial";

/// Nombre del tema inicial (HE-02-HU10-ET05, D-032).
pub const NOMBRE_DEL_TEMA_INICIAL: &str = "Mi tema";

/// El tema que se edita.
#[derive(Debug, Clone)]
struct Borrador {
    theme_id: String,
    name: String,
    /// Lo último guardado del tema (para saber si hay cambios sin guardar).
    guardado: ThemeContent,
    contenido: ThemeContent,
    /// Se aplicó al escritorio sin guardarlo en el tema (HE-02-HU12).
    aplicado_sin_guardar: bool,
}

impl Borrador {
    fn dirty(&self) -> bool {
        self.contenido != self.guardado
    }

    fn vista(&self) -> ThemeDraftView {
        ThemeDraftView {
            theme_id: Uuid(self.theme_id.clone()),
            name: self.name.clone(),
            content: self.contenido.clone(),
            dirty: self.dirty(),
            applied_unsaved: self.aplicado_sin_guardar,
            // HE-02-HU05-ET07, ET08: la legibilidad de los colores de la vista previa.
            legibility: legibilidad::legibilidad(&self.contenido.colors),
        }
    }
}

/// Servicio de temas sobre la base local. El borrador vive en memoria (IPC-THEME-03: «Memoria: borrador»).
#[derive(Default)]
pub struct ServicioDePersonalizacion {
    borrador: Mutex<Option<Borrador>>,
    /// La distribución de widgets en edición (HE-05, C-03).
    edicion: Mutex<Option<distribucion::Edicion>>,
}

fn texto_de_fuente(valor: &str) -> FontSize {
    match valor {
        "small" => FontSize::Small,
        "large" => FontSize::Large,
        _ => FontSize::Medium,
    }
}

fn origen_de_texto(valor: &str) -> BackgroundSource {
    match valor {
        "catalog" => BackgroundSource::Catalog,
        "own" => BackgroundSource::Own,
        _ => BackgroundSource::TemplateDefault,
    }
}

fn contenido_de_fila(fila: &SqliteRow) -> Result<ThemeContent, sqlx::Error> {
    let origen: String = fila.try_get("background_source")?;
    let tamano: String = fila.try_get("font_size")?;
    let propia: Option<String> = fila.try_get("background_uploaded_image_id")?;
    Ok(ThemeContent {
        template_id: fila.try_get("template_id")?,
        background: ThemeBackground {
            source: origen_de_texto(&origen),
            catalog_image_id: fila.try_get("background_catalog_image_id")?,
            uploaded_image_id: propia.map(Uuid),
        },
        colors: ThemeColors {
            primary: Hex(fila.try_get::<String, _>("color_primary")?.to_uppercase()),
            secondary: Hex(fila.try_get::<String, _>("color_secondary")?.to_uppercase()),
            text: Hex(fila.try_get::<String, _>("color_text")?.to_uppercase()),
        },
        palette_id: fila.try_get("palette_id").unwrap_or(None),
        font: ThemeContentFont {
            id: fila.try_get("font_id")?,
            size: texto_de_fuente(&tamano),
        },
    })
}

/// HE-02-HU05-ET04 a ET06: los colores que pide el parche, en `#RRGGBB` y en mayúsculas (ET13). Un color vacío
/// responde `color.required` y uno con otra forma `color.invalid`, en su campo; ninguno cambia la vista previa.
fn colores_pedidos(pedidos: &ThemeDraftPatchColors) -> Result<[Option<Hex>; 3], AppError> {
    let revisar = |campo: &str, valor: Option<Option<&Hex>>| -> Result<Option<Hex>, AppError> {
        match valor {
            None => Ok(None),
            Some(None) => Err(error(
                ErrorCode::ColorRequired,
                messages::CAMPO_OBLIGATORIO,
                Some(campo),
            )),
            Some(Some(hex)) => match legibilidad::de_hex(hex.0.trim()) {
                Some(rgb) => Ok(Some(Hex(legibilidad::a_hex(rgb)))),
                None => Err(error(
                    ErrorCode::ColorInvalid,
                    messages::COLOR_INVALIDO,
                    Some(campo),
                )),
            },
        }
    };
    let primario = pedidos.primary.as_ref().map(|c| match c {
        ThemeDraftPatchColorsPrimary::Hex(h) => Some(h),
        ThemeDraftPatchColorsPrimary::Lit(_) => None,
    });
    let secundario = pedidos.secondary.as_ref().map(|c| match c {
        ThemeDraftPatchColorsSecondary::Hex(h) => Some(h),
        ThemeDraftPatchColorsSecondary::Lit(_) => None,
    });
    let texto = pedidos.text.as_ref().map(|c| match c {
        ThemeDraftPatchColorsText::Hex(h) => Some(h),
        ThemeDraftPatchColorsText::Lit(_) => None,
    });
    Ok([
        revisar("primary", primario)?,
        revisar("secondary", secundario)?,
        revisar("text", texto)?,
    ])
}

/// ¿La copia aplicada es este contenido? `applied_theme` no guarda la paleta (datos.md), así que se compara sin
/// ella (HE-02-HU11-CA02, HE-02-HU12-CA06).
fn es_la_misma_copia(copia: &ThemeContent, contenido: &ThemeContent) -> bool {
    let sin_paleta = |c: &ThemeContent| ThemeContent {
        palette_id: None,
        ..c.clone()
    };
    sin_paleta(copia) == sin_paleta(contenido)
}

const COLUMNAS_DEL_TEMA: &str = "template_id, background_source, background_catalog_image_id, \
     background_uploaded_image_id, color_primary, color_secondary, color_text, font_id, font_size";

impl ServicioDePersonalizacion {
    pub fn nuevo() -> Self {
        Self::default()
    }

    /// HE-17-HU03-CA02 (IPC-DESK-07 `app_request_exit`): hay cambios de la vista previa sin guardar en el tema.
    /// DUDA: HE-17-HU03 la distribución de widgets (HE-05, P14) también tendrá su borrador; hoy solo el del tema.
    pub fn hay_cambios_sin_guardar(&self) -> bool {
        self.con_borrador(|b| b.as_ref().is_some_and(Borrador::dirty))
    }

    /// Al cerrar sesión se descarta el borrador en memoria: era de la cuenta que salió (HE-16-HU03, D-190).
    pub fn olvidar_borrador(&self) {
        self.con_borrador(|b| *b = None);
    }

    fn con_borrador<T>(&self, f: impl FnOnce(&mut Option<Borrador>) -> T) -> T {
        match self.borrador.lock() {
            Ok(mut guardia) => f(&mut guardia),
            Err(envenenado) => f(&mut envenenado.into_inner()),
        }
    }

    /// El tema aplicado de la cuenta: su `theme_id` y su copia (IPC-THEME-02).
    async fn aplicado(
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<Option<(String, ThemeContent)>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let fila = sqlx::query(&format!(
            "SELECT theme_id, {COLUMNAS_DEL_TEMA}, NULL AS palette_id FROM applied_theme WHERE user_id = ?"
        ))
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?;
        fila.map(|f| Ok((f.try_get::<String, _>("theme_id")?, contenido_de_fila(&f)?)))
            .transpose()
            .map_err(de_sqlx)
    }

    /// Un tema guardado: su nombre y su contenido.
    async fn guardado(
        base: &BaseLocal,
        user_id: &str,
        theme_id: &str,
    ) -> Result<Option<(String, ThemeContent)>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let fila = sqlx::query(&format!(
            "SELECT name, palette_id, {COLUMNAS_DEL_TEMA} FROM theme WHERE user_id = ? AND id = ?"
        ))
        .bind(user_id)
        .bind(theme_id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?;
        fila.map(|f| Ok((f.try_get::<String, _>("name")?, contenido_de_fila(&f)?)))
            .transpose()
            .map_err(de_sqlx)
    }

    /// La plantilla por defecto como contenido de un tema nuevo (HE-02-HU10-ET05).
    async fn contenido_inicial(base: &BaseLocal) -> Result<ThemeContent, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let fila = sqlx::query(
            "SELECT id, default_color_primary, default_color_secondary, default_color_text, default_font_id \
             FROM catalog_template WHERE is_default = 1",
        )
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?;
        // DUDA: HE-02-HU10 sin catálogo local (primer inicio sin conexión) se usa la plantilla que trae el
        // instalador (seed.sql: «default», Nunito y sus tres colores).
        let (plantilla, primario, secundario, texto, fuente) = match fila {
            Some(f) => (
                f.try_get::<String, _>("id").map_err(de_sqlx)?,
                f.try_get::<String, _>("default_color_primary")
                    .map_err(de_sqlx)?,
                f.try_get::<String, _>("default_color_secondary")
                    .map_err(de_sqlx)?,
                f.try_get::<String, _>("default_color_text")
                    .map_err(de_sqlx)?,
                f.try_get::<String, _>("default_font_id").map_err(de_sqlx)?,
            ),
            None => (
                "default".to_string(),
                "#96B2B2".to_string(),
                "#829890".to_string(),
                "#14201C".to_string(),
                "nunito".to_string(),
            ),
        };
        Ok(ThemeContent {
            template_id: plantilla,
            background: ThemeBackground {
                source: BackgroundSource::TemplateDefault,
                catalog_image_id: None,
                uploaded_image_id: None,
            },
            colors: ThemeColors {
                primary: Hex(primario.to_uppercase()),
                secondary: Hex(secundario.to_uppercase()),
                text: Hex(texto.to_uppercase()),
            },
            palette_id: None,
            font: ThemeContentFont {
                id: fuente,
                size: FontSize::Medium,
            },
        })
    }

    /// Carga un tema como borrador. Sin `theme_id`, el tema aplicado; si la cuenta aún no tiene temas
    /// locales, el tema inicial «Mi tema» (HE-02-HU10-CA05).
    async fn cargar(
        &self,
        base: &BaseLocal,
        user_id: &str,
        theme_id: Option<&str>,
    ) -> Result<Borrador, AppError> {
        let aplicado = Self::aplicado(base, user_id).await?;
        let id = theme_id
            .map(str::to_string)
            .or_else(|| aplicado.as_ref().map(|(id, _)| id.clone()));
        if let Some(id) = id
            && let Some((nombre, contenido)) = Self::guardado(base, user_id, &id).await?
        {
            return Ok(Borrador {
                theme_id: id,
                name: nombre,
                guardado: contenido.clone(),
                contenido,
                aplicado_sin_guardar: false,
            });
        }
        let contenido = Self::contenido_inicial(base).await?;
        Ok(Borrador {
            theme_id: TEMA_INICIAL_VIRTUAL.to_string(),
            name: NOMBRE_DEL_TEMA_INICIAL.to_string(),
            guardado: contenido.clone(),
            contenido,
            aplicado_sin_guardar: false,
        })
    }

    /// IPC-THEME-03 `theme_draft_open`: abre la pantalla. Si ya hay un borrador del mismo tema (o no se pide
    /// uno), lo conserva con sus cambios; si no, carga el tema (HE-02-HU10-CA01, CA05, ET02).
    pub async fn abrir_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
        theme_id: Option<&str>,
    ) -> Result<ThemeDraftView, AppError> {
        if let Some(borrador) = self.con_borrador(|b| b.clone())
            && theme_id.is_none_or(|id| id == borrador.theme_id)
        {
            return Ok(borrador.vista());
        }
        let nuevo = self.cargar(base, user_id, theme_id).await?;
        let vista = nuevo.vista();
        self.con_borrador(|b| *b = Some(nuevo));
        Ok(vista)
    }

    /// IPC-THEME-04 `theme_draft_select`: cambia el tema en edición sin tocar el escritorio (ET03, ET04).
    /// Con cambios sin guardar, responde `draft.unsaved_changes` hasta que la vista repita con
    /// `discard_changes` (CA03, CA04, CA06).
    pub async fn seleccionar_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
        theme_id: &str,
        descartar_cambios: bool,
    ) -> Result<ThemeDraftView, AppError> {
        if let Some(actual) = self.con_borrador(|b| b.clone())
            && actual.dirty()
            && actual.theme_id != theme_id
            && !descartar_cambios
        {
            return Err(error(
                ErrorCode::DraftUnsavedChanges,
                &messages::cambios_sin_guardar_al_cambiar_de_tema(&actual.name),
                None,
            ));
        }
        let nuevo = self.cargar(base, user_id, Some(theme_id)).await?;
        let vista = nuevo.vista();
        self.con_borrador(|b| *b = Some(nuevo));
        Ok(vista)
    }

    /// IPC-THEME-01 `theme_list`: del más reciente al más antiguo por `last_modified_at` (HE-03-HU01-ET02).
    /// Hace falta aquí para la lista «Tema en edición» (HE-02-HU10-CA01, CA02).
    pub async fn temas(
        &self,
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<Vec<ThemeSummary>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let aplicado = Self::aplicado(base, user_id).await?;
        let filas = sqlx::query(&format!(
            "SELECT id, name, last_modified_at, palette_id, {COLUMNAS_DEL_TEMA} FROM theme \
             WHERE user_id = ? ORDER BY last_modified_at DESC, name"
        ))
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let borrador = self.con_borrador(|b| b.clone());
        filas
            .iter()
            .map(|f| {
                let id: String = f.try_get("id")?;
                let contenido = contenido_de_fila(f)?;
                let es_aplicado = aplicado.as_ref().is_some_and(|(a, _)| *a == id);
                Ok(ThemeSummary {
                    has_unapplied_changes: aplicado.as_ref().is_some_and(|(a, copia)| {
                        *a == id && !es_la_misma_copia(copia, &contenido)
                    }),
                    // HE-03-HU01-ET07: cambios de la vista previa que se aplicaron sin guardarlos en el tema.
                    has_unsaved_changes: borrador
                        .as_ref()
                        .is_some_and(|b| b.theme_id == id && b.aplicado_sin_guardar),
                    is_applied: es_aplicado,
                    id: Uuid(id),
                    name: f.try_get("name")?,
                    last_modified_at: crate::tipos::Instant(f.try_get("last_modified_at")?),
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// IPC-CAT-01 `catalog_list` con `kind: 'template'`: las plantillas activas, por `sort_order`
    /// (HE-02-HU02-CA01, ET01). Solo el catálogo: no hay forma de crear plantillas propias (ET04).
    /// DUDA: HE-02-HU02 `thumbnail_url` debe ser una URL del protocolo de assets de Tauri; hasta que
    /// `asset_resolve` (HE-02-HU01) exista, valor neutro: la ruta de la miniatura en el paquete del instalador.
    pub async fn plantillas(&self, base: &BaseLocal) -> Result<Vec<CatalogItem>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT id, name, thumbnail_path, default_color_primary, default_color_secondary,              default_color_text FROM catalog_template WHERE is_active = 1 ORDER BY sort_order, name",
        )
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                Ok(CatalogItem {
                    id: f.try_get("id")?,
                    name: f.try_get("name")?,
                    thumbnail_url: f.try_get("thumbnail_path")?,
                    is_cached: true,
                    hex: None,
                    color_primary: Some(Hex(f.try_get("default_color_primary")?)),
                    color_secondary: Some(Hex(f.try_get("default_color_secondary")?)),
                    color_text: Some(Hex(f.try_get("default_color_text")?)),
                    format: None,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// IPC-THEME-05 `theme_draft_update`: aplica el cambio al borrador y devuelve la vista previa; no toca el
    /// escritorio ni lo guardado (HE-02-HU02-ET07). Por ahora solo `template_id`: la plantilla cambia y el
    /// fondo, los colores y la tipografía del tema se quedan como están (CA02, ET06). El resto del parche llega
    /// con HE-02-HU03 (fondo) y con los pasos de colores, tipografía y paletas.
    pub async fn actualizar_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
        cambio: &ThemeDraftPatch,
    ) -> Result<ThemeDraftView, AppError> {
        // Sin borrador abierto se abre el del tema aplicado, como al entrar a la pantalla.
        self.abrir_borrador(base, user_id, None).await?;
        if let Some(plantilla) = &cambio.template_id {
            let pool = base.pool().await.map_err(de_sqlx)?;
            let existe: Option<String> = sqlx::query_scalar(
                "SELECT id FROM catalog_template WHERE id = ? AND is_active = 1",
            )
            .bind(plantilla)
            .fetch_optional(pool)
            .await
            .map_err(de_sqlx)?;
            if existe.is_none() {
                return Err(error(ErrorCode::TemplateNotFound, "", None));
            }
        }
        let fondo = match &cambio.background {
            Some(pedido) => {
                // HE-02-HU04-ET02: quitar la imagen cuando la plantilla ya muestra la suya no hace nada.
                let ya_por_defecto = self.con_borrador(|b| {
                    b.as_ref().is_some_and(|borrador| {
                        borrador.contenido.background.source == BackgroundSource::TemplateDefault
                    })
                });
                if pedido.source == BackgroundSource::TemplateDefault && ya_por_defecto {
                    return Err(error(
                        ErrorCode::BackgroundAlreadyDefault,
                        messages::FONDO_YA_POR_DEFECTO,
                        None,
                    ));
                }
                Some(Self::fondo_pedido(base, user_id, pedido).await?)
            }
            None => None,
        };
        let colores = match &cambio.colors {
            Some(pedidos) => Some(colores_pedidos(pedidos)?),
            None => None,
        };
        if let Some(fuente) = &cambio.font_id {
            Self::fuente_existe(base, fuente).await?;
        }
        let paleta = match &cambio.palette_id {
            Some(Some(id)) => Some(Some(Self::paleta(base, id).await?)),
            Some(None) => Some(None),
            None => None,
        };
        self.con_borrador(|b| {
            b.as_mut().map(|borrador| {
                if let Some(plantilla) = &cambio.template_id {
                    borrador.contenido.template_id.clone_from(plantilla);
                }
                if let Some(fondo) = fondo {
                    borrador.contenido.background = fondo;
                }
                // HE-02-HU06-ET02, ET03: la fuente del catálogo y el tamaño del texto.
                if let Some(fuente) = &cambio.font_id {
                    borrador.contenido.font.id.clone_from(fuente);
                }
                if let Some(tamano) = &cambio.font_size {
                    borrador.contenido.font.size = tamano.clone();
                }
                // HE-02-HU07-ET02, ET04: la paleta pone los tres colores en un solo paso; nada más cambia.
                match paleta {
                    Some(Some((id, colores_de_la_paleta))) => {
                        borrador.contenido.colors = colores_de_la_paleta;
                        borrador.contenido.palette_id = Some(id);
                    }
                    Some(None) => borrador.contenido.palette_id = None,
                    None => {}
                }
                if let Some([primario, secundario, texto]) = colores {
                    let actuales = &mut borrador.contenido.colors;
                    for (actual, nuevo) in [
                        (&mut actuales.primary, primario),
                        (&mut actuales.secondary, secundario),
                        (&mut actuales.text, texto),
                    ] {
                        if let Some(nuevo) = nuevo {
                            *actual = nuevo;
                        }
                    }
                    // HE-02-HU07: un color cambiado a mano deja la paleta en «Personalizada».
                    borrador.contenido.palette_id = None;
                }
                borrador.vista()
            })
        })
        .ok_or_else(inesperado)
    }

    /// El fondo que pide el parche, ya comprobado: la imagen del catálogo o la propia debe existir
    /// (`image.not_found`, sin texto; HE-02-HU03-ET03).
    async fn fondo_pedido(
        base: &BaseLocal,
        user_id: &str,
        pedido: &ThemeDraftPatchBackground,
    ) -> Result<ThemeBackground, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let sin_imagen = || error(ErrorCode::ImageNotFound, "", None);
        match pedido.source {
            BackgroundSource::TemplateDefault => Ok(ThemeBackground {
                source: BackgroundSource::TemplateDefault,
                catalog_image_id: None,
                uploaded_image_id: None,
            }),
            BackgroundSource::Catalog => {
                let id = pedido.catalog_image_id.clone().ok_or_else(sin_imagen)?;
                let existe: Option<String> = sqlx::query_scalar(
                    "SELECT id FROM catalog_image WHERE id = ? AND is_active = 1",
                )
                .bind(&id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?;
                existe.ok_or_else(sin_imagen)?;
                Ok(ThemeBackground {
                    source: BackgroundSource::Catalog,
                    catalog_image_id: Some(id),
                    uploaded_image_id: None,
                })
            }
            BackgroundSource::Own => {
                let id = pedido.uploaded_image_id.clone().ok_or_else(sin_imagen)?;
                let existe: Option<String> = sqlx::query_scalar(
                    "SELECT id FROM uploaded_image WHERE id = ? AND user_id = ?",
                )
                .bind(&id.0)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?;
                existe.ok_or_else(sin_imagen)?;
                Ok(ThemeBackground {
                    source: BackgroundSource::Own,
                    catalog_image_id: None,
                    uploaded_image_id: Some(id),
                })
            }
        }
    }

    /// IPC-THEME-10 `theme_draft_get_status` (HE-02-HU13-CA02, CA05): si la vista previa tiene cambios sin
    /// guardar y si se aplicaron sin guardarlos, con el nombre del tema en edición.
    pub fn estado_del_borrador(&self) -> ThemeDraftStatus {
        self.con_borrador(|b| match b {
            Some(borrador) => ThemeDraftStatus {
                dirty: borrador.dirty(),
                applied_unsaved: borrador.aplicado_sin_guardar,
                theme_name: borrador.name.clone(),
            },
            None => ThemeDraftStatus {
                dirty: false,
                applied_unsaved: false,
                theme_name: String::new(),
            },
        })
    }

    /// IPC-THEME-11 `theme_draft_discard` (HE-02-HU13-CA01, ET01, ET02): la vista previa vuelve a lo último
    /// guardado del tema en edición, sin guardar nada. Lo aplicado al escritorio no cambia (ET05).
    pub async fn descartar_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<ConMensaje<ThemeDraftView>, AppError> {
        let actual = self.abrir_borrador(base, user_id, None).await?;
        let nuevo = self.cargar(base, user_id, Some(&actual.theme_id.0)).await?;
        let vista = nuevo.vista();
        self.con_borrador(|b| *b = Some(nuevo));
        Ok(ConMensaje {
            valor: vista,
            mensaje: resultado("theme_draft_discard", messages::NO_SE_GUARDARON_CAMBIOS),
        })
    }

    /// IPC-THEME-06 `theme_draft_reset` (HE-02-HU08): devuelve en la vista previa los colores o la tipografía a
    /// los de la plantilla del tema en edición; la tipografía vuelve además al tamaño mediano (ET01, ET02). Los
    /// colores de la plantilla no son una paleta del catálogo: quedan en «Personalizada».
    pub async fn restablecer_borrador(
        &self,
        base: &BaseLocal,
        user_id: &str,
        parte: &ThemeDraftResetParamsPart,
    ) -> Result<ThemeDraftView, AppError> {
        let actual = self.abrir_borrador(base, user_id, None).await?;
        let pool = base.pool().await.map_err(de_sqlx)?;
        let fila = sqlx::query(
            "SELECT default_color_primary, default_color_secondary, default_color_text, default_font_id \
             FROM catalog_template WHERE id = ?",
        )
        .bind(&actual.content.template_id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?;
        // Sin la plantilla en el catálogo local, los valores de la plantilla por defecto (como el tema inicial).
        let por_defecto = Self::contenido_inicial(base).await?;
        let (colores, fuente) = match fila {
            Some(f) => {
                let color = |c: &str| -> Result<Hex, AppError> {
                    Ok(Hex(f
                        .try_get::<String, _>(c)
                        .map_err(de_sqlx)?
                        .to_uppercase()))
                };
                (
                    ThemeColors {
                        primary: color("default_color_primary")?,
                        secondary: color("default_color_secondary")?,
                        text: color("default_color_text")?,
                    },
                    f.try_get::<String, _>("default_font_id").map_err(de_sqlx)?,
                )
            }
            None => (por_defecto.colors, por_defecto.font.id),
        };
        self.con_borrador(|b| {
            b.as_mut().map(|borrador| {
                match parte {
                    ThemeDraftResetParamsPart::Colors => {
                        borrador.contenido.colors = colores;
                        borrador.contenido.palette_id = None;
                    }
                    ThemeDraftResetParamsPart::Typography => {
                        borrador.contenido.font = ThemeContentFont {
                            id: fuente,
                            size: FontSize::Medium,
                        };
                    }
                }
                borrador.vista()
            })
        })
        .ok_or_else(inesperado)
    }

    /// La fuente debe estar en el catálogo de tipografías (`font.not_found`, sin texto; HE-02-HU06-ET03).
    async fn fuente_existe(base: &BaseLocal, id: &str) -> Result<(), AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let existe: Option<String> =
            sqlx::query_scalar("SELECT id FROM catalog_font WHERE id = ? AND is_active = 1")
                .bind(id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?;
        existe
            .map(|_| ())
            .ok_or_else(|| error(ErrorCode::FontNotFound, "", None))
    }

    /// Los tres colores de una paleta del catálogo (HE-02-HU07-ET02).
    /// DUDA: HE-02-HU07 IPC-THEME-05 no define un error para una paleta que no está en el catálogo (la vista solo
    /// ofrece las del catálogo). Valor usado: `internal.unexpected`, como un color fuera del catálogo (HE-09-HU03).
    async fn paleta(base: &BaseLocal, id: &str) -> Result<(String, ThemeColors), AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let fila = sqlx::query(
            "SELECT color_primary, color_secondary, color_text FROM catalog_palette WHERE id = ? AND is_active = 1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?
        .ok_or_else(inesperado)?;
        let color = |columna: &str| -> Result<Hex, AppError> {
            Ok(Hex(fila
                .try_get::<String, _>(columna)
                .map_err(de_sqlx)?
                .to_uppercase()))
        };
        Ok((
            id.to_string(),
            ThemeColors {
                primary: color("color_primary")?,
                secondary: color("color_secondary")?,
                text: color("color_text")?,
            },
        ))
    }

    /// IPC-CAT-01 `catalog_list` con `kind: 'font'`: el catálogo de tipografías, por `sort_order`
    /// (HE-02-HU06-ET01, ET03).
    /// DUDA: HE-02-HU06 `thumbnail_url` con la ruta del archivo de la fuente (como las demás miniaturas); la vista
    /// escribe cada nombre con la familia de esa fuente, que viaja en el instalador.
    pub async fn fuentes(&self, base: &BaseLocal) -> Result<Vec<CatalogItem>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT id, display_name, file_path FROM catalog_font WHERE is_active = 1 ORDER BY sort_order, display_name",
        )
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                Ok(CatalogItem {
                    id: f.try_get("id")?,
                    name: f.try_get("display_name")?,
                    thumbnail_url: f.try_get("file_path")?,
                    is_cached: true,
                    hex: None,
                    color_primary: None,
                    color_secondary: None,
                    color_text: None,
                    format: None,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// IPC-CAT-01 `catalog_list` con `kind: 'palette'`: el catálogo de paletas con sus tres colores, por
    /// `sort_order` (HE-02-HU07-ET01).
    pub async fn paletas(&self, base: &BaseLocal) -> Result<Vec<CatalogItem>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT id, name, color_primary, color_secondary, color_text FROM catalog_palette \
             WHERE is_active = 1 ORDER BY sort_order, name",
        )
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                let color = |c: &str| -> Result<Hex, sqlx::Error> {
                    Ok(Hex(f.try_get::<String, _>(c)?.to_uppercase()))
                };
                Ok(CatalogItem {
                    id: f.try_get("id")?,
                    name: f.try_get("name")?,
                    thumbnail_url: String::new(),
                    is_cached: true,
                    hex: None,
                    color_primary: Some(color("color_primary")?),
                    color_secondary: Some(color("color_secondary")?),
                    color_text: Some(color("color_text")?),
                    format: None,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// IPC-CAT-01 `catalog_list` con `kind: 'image'`: las imágenes activas del catálogo, por `sort_order`
    /// (HE-02-HU03-CA02, ET07). Solo lectura: no hay forma de agregar imágenes al catálogo (ET08).
    /// DUDA: HE-02-HU03 `thumbnail_url` con la ruta de la miniatura hasta que exista `asset_resolve` (HE-02-HU01).
    pub async fn imagenes(&self, base: &BaseLocal) -> Result<Vec<CatalogItem>, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT id, name, thumbnail_path FROM catalog_image WHERE is_active = 1 ORDER BY sort_order, name",
        )
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                Ok(CatalogItem {
                    id: f.try_get("id")?,
                    name: f.try_get("name")?,
                    thumbnail_url: f.try_get("thumbnail_path")?,
                    is_cached: true,
                    hex: None,
                    color_primary: None,
                    color_secondary: None,
                    color_text: None,
                    format: None,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// Solo para las pruebas y para las HU que editan: el contenido del borrador.
    #[cfg(test)]
    fn edicion_de_prueba(&self, cambio: impl FnOnce(&mut ThemeContent)) {
        self.con_borrador(|b| {
            if let Some(borrador) = b {
                cambio(&mut borrador.contenido);
            }
        });
    }
}

mod aplicar;
pub mod distribucion;
pub mod escritorio;
mod guardado;
pub mod guardar_como;
mod imagenes;
pub(crate) mod legibilidad;
mod renombrar;
pub mod ultima_pantalla;
mod widgets;

#[cfg(test)]
mod pruebas_de_aplicar;
#[cfg(test)]
mod pruebas_de_aplicar_un_tema;
#[cfg(test)]
mod pruebas_de_cancelar;
#[cfg(test)]
mod pruebas_de_colores;
#[cfg(test)]
mod pruebas_de_distribucion;
#[cfg(test)]
mod pruebas_de_eliminar_widget;
#[cfg(test)]
mod pruebas_de_escritorio;
#[cfg(test)]
mod pruebas_de_guardado;
#[cfg(test)]
mod pruebas_de_guardar_como;
#[cfg(test)]
mod pruebas_de_imagenes;
#[cfg(test)]
mod pruebas_de_plantillas;
#[cfg(test)]
mod pruebas_de_renombrar;
#[cfg(test)]
mod pruebas_de_restablecer;
#[cfg(test)]
mod pruebas_de_salir;
#[cfg(test)]
mod pruebas_de_temas;
#[cfg(test)]
mod pruebas_de_tipografia_y_paletas;
#[cfg(test)]
mod pruebas_de_vista_previa;
#[cfg(test)]
mod pruebas_de_widgets;
#[cfg(test)]
mod pruebas_del_tema_en_edicion;
