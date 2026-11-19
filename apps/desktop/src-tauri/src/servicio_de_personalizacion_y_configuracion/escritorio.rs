//! Lo que la capa del wallpaper necesita del tema aplicado (HE-02-HU01): IPC-THEME-02 `theme_get_applied`,
//! IPC-CAT-04 `asset_resolve` e IPC-DESK-01 `layer_get_initial_state`. Todo sale de la base local, sin red
//! (RNF-08; D-049).

use std::path::{Path, PathBuf};

use super::*;
use crate::tipos::{
    AppliedThemeView, AssetKind, AssetResolveResult, AssetResolveResultState, LayerInitialState,
    Monitor, WallpaperState,
};

/// Dónde están los archivos del Núcleo: los que baja o copia (`%APPDATA%\Windgets\files`) y los que trae el
/// instalador (la carpeta de recursos con `assets/`).
#[derive(Debug, Clone)]
pub struct Carpetas {
    pub archivos: PathBuf,
    pub recursos: PathBuf,
}

/// La plantilla que trae el instalador y que nunca se baja (HE-02-HU01-ET02).
const PLANTILLA_POR_DEFECTO: &str = "default";

fn texto(ruta: &Path) -> String {
    ruta.to_string_lossy().into_owned()
}

impl ServicioDePersonalizacion {
    /// IPC-THEME-02 `theme_get_applied`: la copia aplicada con sus dos marcas. Sin tema aplicado (primer
    /// inicio de sesión) es la plantilla por defecto (HE-02-HU01-CA01, ET02).
    pub async fn tema_aplicado(
        &self,
        base: &BaseLocal,
        user_id: &str,
    ) -> Result<AppliedThemeView, AppError> {
        let Some((theme_id, copia)) = Self::aplicado(base, user_id).await? else {
            return Ok(AppliedThemeView {
                theme_id: Uuid(TEMA_INICIAL_VIRTUAL.to_string()),
                name: NOMBRE_DEL_TEMA_INICIAL.to_string(),
                content: Self::contenido_inicial(base).await?,
                has_unapplied_changes: false,
                has_unsaved_changes: false,
            });
        };
        let guardado = Self::guardado(base, user_id, &theme_id).await?;
        let borrador = self.con_borrador(|b| b.clone());
        Ok(AppliedThemeView {
            has_unapplied_changes: guardado
                .as_ref()
                .is_some_and(|(_, g)| !es_la_misma_copia(&copia, g)),
            has_unsaved_changes: borrador.is_some_and(|b| b.theme_id == theme_id && b.dirty()),
            name: guardado.map_or_else(|| NOMBRE_DEL_TEMA_INICIAL.to_string(), |(n, _)| n),
            theme_id: Uuid(theme_id),
            content: copia,
        })
    }

    /// IPC-CAT-04 `asset_resolve`: la ruta local del archivo y si está listo. Un archivo que falta es
    /// `unavailable`: la descarga desde Storage llega con el catálogo (HE-02-HU01-ET05).
    pub async fn recurso(
        &self,
        base: &BaseLocal,
        user_id: &str,
        carpetas: &Carpetas,
        tipo: &AssetKind,
        id: &str,
    ) -> Result<AssetResolveResult, AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ruta: Option<PathBuf> = match tipo {
            AssetKind::UploadedImage => {
                let relativa: Option<String> = sqlx::query_scalar(
                    "SELECT storage_path FROM uploaded_image WHERE id = ? AND user_id = ?",
                )
                .bind(id)
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?;
                relativa.map(|r| carpetas.archivos.join(r))
            }
            AssetKind::CatalogTemplate if id == PLANTILLA_POR_DEFECTO => Some(
                carpetas
                    .recursos
                    .join("assets/templates/default/background.jpg"),
            ),
            AssetKind::CatalogFont if id == "nunito" => {
                Some(carpetas.recursos.join("assets/fonts/nunito.woff2"))
            }
            otro => {
                let (clase, ref_id) = match otro {
                    AssetKind::CatalogImage => ("catalog_image", id),
                    AssetKind::CatalogTemplate => ("template_bundle", id),
                    AssetKind::CatalogFont => ("font", id),
                    AssetKind::CatalogAnimation => ("animation", id),
                    AssetKind::UploadedImage => ("uploaded_image", id),
                };
                let relativa: Option<String> = sqlx::query_scalar(
                    "SELECT local_path FROM local_file WHERE kind = ? AND ref_id = ?",
                )
                .bind(clase)
                .bind(ref_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?;
                relativa.map(|r| carpetas.archivos.join(r))
            }
        };
        Ok(match ruta {
            Some(ruta) if ruta.is_file() => AssetResolveResult {
                url: texto(&ruta),
                state: AssetResolveResultState::Ready,
            },
            _ => AssetResolveResult {
                url: String::new(),
                state: AssetResolveResultState::Unavailable,
            },
        })
    }

    /// ¿El fondo de este contenido se puede mostrar? La imagen del fondo (propia o del catálogo) o la
    /// plantilla deben estar en el computador.
    async fn se_puede_mostrar(
        &self,
        base: &BaseLocal,
        user_id: &str,
        carpetas: &Carpetas,
        contenido: &ThemeContent,
    ) -> Result<bool, AppError> {
        let (tipo, id) = match contenido.background.source {
            BackgroundSource::Own => match &contenido.background.uploaded_image_id {
                Some(id) => (AssetKind::UploadedImage, id.0.clone()),
                None => return Ok(false),
            },
            BackgroundSource::Catalog => match &contenido.background.catalog_image_id {
                Some(id) => (AssetKind::CatalogImage, id.clone()),
                None => return Ok(false),
            },
            BackgroundSource::TemplateDefault => {
                (AssetKind::CatalogTemplate, contenido.template_id.clone())
            }
        };
        let recurso = self.recurso(base, user_id, carpetas, &tipo, &id).await?;
        Ok(recurso.state == AssetResolveResultState::Ready)
    }

    /// IPC-DESK-01 `layer_get_initial_state`: el primer pintado de la capa a partir de lo guardado. Si el
    /// wallpaper aplicado no se puede mostrar, muestra el de la plantilla por defecto y lo avisa con
    /// `fallback_default` (CA04, ET05, ET06). Con la capa oculta (sin sesión) el estado sigue `hidden` (CA05).
    pub async fn estado_de_la_capa(
        &self,
        base: &BaseLocal,
        user_id: &str,
        carpetas: &Carpetas,
        monitores: Vec<Monitor>,
        estado_del_host: WallpaperState,
    ) -> Result<LayerInitialState, AppError> {
        let aplicado = self.tema_aplicado(base, user_id).await?.content;
        // El host dice si la capa está oculta (sin sesión, CA05) o si no pudo anclarse y pide el wallpaper por
        // defecto (CA04); con la capa a la vista se comprueba que el fondo aplicado esté en el computador.
        let (applied, wallpaper_state) = match estado_del_host {
            WallpaperState::Hidden => (aplicado, WallpaperState::Hidden),
            WallpaperState::Ok
                if self
                    .se_puede_mostrar(base, user_id, carpetas, &aplicado)
                    .await? =>
            {
                (aplicado, WallpaperState::Ok)
            }
            WallpaperState::Ok | WallpaperState::FallbackDefault => (
                Self::contenido_inicial(base).await?,
                WallpaperState::FallbackDefault,
            ),
        };
        Ok(LayerInitialState {
            applied,
            // Los widgets activos del tema aplicado encima del wallpaper (HE-04-HU01-CA01, CA03).
            widgets: Self::rectangulos_ajustados(base, user_id, &monitores).await?,
            monitors: monitores,
            wallpaper_state,
        })
    }
}
