import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useEffect, useState } from 'react';
import { recursoDelFondo } from '@/capa/Capa';
import { urlDeArchivo } from '@/ipc/archivos';
import textos from '@/types/messages.es.json';
import type {
  AppError,
  ApplyMode,
  CatalogItem,
  Legibility,
  Monitor,
  ThemeDraftPatch,
  ThemeDraftView,
  ThemeSummary,
  WidgetRect,
} from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado, useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';
import { Selector } from '@/ui/Selector/Selector';
import { useGuardiaDeSalida, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { AjusteDelFondo } from './AjusteDelFondo';
import { Colores, type CampoDeColor } from './Colores';
import { GuardarComoTema } from './GuardarComoTema';
import { Paletas } from './Paletas';
import { VistaPrevia } from './VistaPrevia';
import { familia, PIXELES_DEL_TAMANO } from '@/ui/tema/temaAplicado';
import { Tipografia } from './Tipografia';
import { textoDelError } from '@/ipc/textoDelError';
import './wallpaper.css';

// P-WAL-01 Personalización del wallpaper (Menú principal > Personalización > Personalización del wallpaper;
// HE-02-HU10). La lista «Tema en edición», la vista previa (HE-02-HU09), las secciones (HE-02-HU02 a HU08) y
// las opciones «Guardar», «Guardar como tema», «Aplicar» y «Cancelar» (HE-02-HU11, HE-03-HU02, HE-02-HU12,
// HE-02-HU13).

/**
 * HE-02-HU05-CA05 (ET08, ET16): «El contraste de estos colores es bajo (<contraste>:1). Prueba con <color
 * sugerido>.», con el menor contraste de los pares que no cumplen, truncado a un decimal y con coma.
 */
export function avisoDeContraste(legibilidad: Legibility): string | null {
  if (legibilidad.ok || !legibilidad.suggestion) return null;
  const menor = Math.min(...legibilidad.items.filter((i) => i.ratio < i.min).map((i) => i.ratio));
  const contraste = (Math.floor(menor * 10) / 10).toFixed(1).replace('.', ',');
  return textos.CONTRASTE_BAJO.replace('<contraste>', contraste).replace(
    '<color sugerido>',
    legibilidad.suggestion.color,
  );
}

/** Las secciones de la pantalla (HE-02-HU10-ET01), en este orden. */
/** La miniatura de una imagen del catálogo, o nada si todavía no se descargó (INT-09). */
const miniaturaDelCatalogo = (ruta: string | undefined) => (ruta ? urlDeArchivo(ruta) : undefined);

const SECCIONES = ['Plantillas', 'Imagen de fondo', 'Colores', 'Tipografía', 'Paletas'] as const;

export function Personalization() {
  const { invocar, escuchar } = useNucleo();
  // docs/rediseno.md RD-45: las secciones abiertas del inspector; al entrar, Plantillas (91:1672).
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(() => new Set(['Plantillas']));
  const alternarSeccion = (nombre: string) =>
    setAbiertas((actuales) => {
      const nuevas = new Set(actuales);
      if (nuevas.has(nombre)) nuevas.delete(nombre);
      else nuevas.add(nombre);
      return nuevas;
    });
  const mostrarResultado = useMensajeDeResultado();
  const mostrarError = useMostrarError();
  const [temas, setTemas] = useState<ThemeSummary[]>([]);
  const [borrador, setBorrador] = useState<ThemeDraftView | null>(null);
  const [plantillas, setPlantillas] = useState<CatalogItem[]>([]);
  // HE-02-HU06 y HU07: el catálogo de tipografías y el de paletas.
  const [fuentes, setFuentes] = useState<CatalogItem[]>([]);
  const [paletas, setPaletas] = useState<CatalogItem[]>([]);
  // HE-02-HU09-ET03: los widgets activos y el monitor principal para la vista previa.
  const [escritorio, setEscritorio] = useState<{ widgets: WidgetRect[]; monitor: Monitor | null } | null>(
    null,
  );
  // M-04: el tema que se quería abrir cuando el Núcleo avisó de cambios sin guardar.
  // HE-02-HU03: el catálogo de imágenes (abierto con «Catálogo de imágenes»), la imagen propia que se muestra
  // y el rechazo del último archivo elegido.
  const [imagenes, setImagenes] = useState<CatalogItem[] | null>(null);
  const [vistasPropias, setVistasPropias] = useState<Record<string, string>>({});
  const [imagenResuelta, setImagenResuelta] = useState<{ clave: string; url: string } | null>(null);
  const [rechazo, setRechazo] = useState('');
  const [pendiente, setPendiente] = useState<{ id: string; mensaje: string } | null>(null);
  // M-15: el mensaje del Núcleo al aplicar con cambios sin guardar (HE-02-HU12-CA02).
  const [alAplicar, setAlAplicar] = useState('');
  // HE-03-HU02: la ventana emergente Guardar como tema.
  const [guardandoComo, setGuardandoComo] = useState(false);
  // HE-02-HU13: el mensaje al salir por el Menú principal con cambios sin guardar (M-02) o con cambios aplicados
  // que no se guardaron (M-03), y cómo responder a la navegación.
  const [salida, setSalida] = useState<{ aplicados: boolean; responder: (salir: boolean) => void } | null>(
    null,
  );
  // HE-02-HU05-CA03, CA04: el mensaje de campo de cada color y si un color está vacío.
  const [mensajesDeColor, setMensajesDeColor] = useState<
    Partial<Record<CampoDeColor, { code: string; message: string }>>
  >({});

  const leerTemas = useCallback(async () => {
    const r = await invocar('theme_list', {});
    if (r.ok) setTemas(r.value);
  }, [invocar]);

  /** El error de una acción sobre un tema; si ya no existe (RD-86), la lista se vuelve a leer. */
  const fallar = useCallback(
    (error: AppError) => {
      mostrarError(error);
      if (error.code === 'theme.not_found') void leerTemas();
    },
    [leerTemas, mostrarError],
  );

  useEffect(() => {
    let vigente = true;
    void invocar('theme_draft_open', {}).then((r) => {
      if (vigente && r.ok) setBorrador(r.value);
    });
    void leerTemas();
    void invocar('catalog_list', { kind: 'template' }).then((r) => {
      if (vigente && r.ok) setPlantillas(r.value);
    });
    void invocar('catalog_list', { kind: 'font' }).then((r) => {
      if (vigente && r.ok) setFuentes(r.value);
    });
    void invocar('catalog_list', { kind: 'palette' }).then((r) => {
      if (vigente && r.ok) setPaletas(r.value);
    });
    void invocar('layer_get_initial_state', {}).then((r) => {
      if (!vigente || !r.ok) return;
      const { monitors, widgets } = r.value;
      const principal = monitors.find((m) => m.x === 0 && m.y === 0) ?? monitors[0] ?? null;
      setEscritorio({ widgets, monitor: principal });
    });
    return () => {
      vigente = false;
    };
  }, [invocar, leerTemas]);

  // Los temas guardados cambian al guardar, crear o eliminar uno (EV-12 `themes_changed`).
  useEffect(() => escuchar('themes_changed', () => void leerTemas()), [escuchar, leerTemas]);

  // HE-02-HU03-ET11: la ruta local de la imagen de fondo propia o del catálogo del tema en edición.
  const recursoDeImagen =
    borrador && borrador.content.background.source !== 'template_default'
      ? recursoDelFondo(borrador.content)
      : null;
  const claveDelFondo = recursoDeImagen ? `${recursoDeImagen.kind}:${recursoDeImagen.id}` : '';
  // RT-04 (P26): la clave de la imagen propia que no está en el computador (archivo borrado o descarga fallida).
  const [imagenFaltante, setImagenFaltante] = useState<string | null>(null);
  // Al bajar la imagen de Storage llega EV-11 (INT-09, «Descargar»): se vuelve a resolver.
  const [revision, setRevision] = useState(0);
  useEffect(() => escuchar('applied_theme_changed', () => setRevision((n) => n + 1)), [escuchar]);
  useEffect(() => {
    if (!recursoDeImagen) return;
    let vigente = true;
    void invocar('asset_resolve', recursoDeImagen).then((r) => {
      if (!vigente) return;
      if (r.ok && r.value.state === 'ready')
        setImagenResuelta({ clave: claveDelFondo, url: urlDeArchivo(r.value.url) });
      const falta = recursoDeImagen.kind === 'uploaded_image' && (!r.ok || r.value.state === 'unavailable');
      setImagenFaltante(falta ? claveDelFondo : null);
    });
    return () => {
      vigente = false;
    };
    // Se vuelve a resolver solo cuando cambia la imagen (la clave) o llega EV-11, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveDelFondo, invocar, revision]);

  // HE-15-HU04-CA08 (ET11, ET12): llega una personalización más reciente de otro computador con cambios sin guardar
  // en la vista previa: el escritorio la aplica, la vista previa conserva los cambios y se muestra el aviso.
  useEffect(
    () =>
      escuchar('applied_theme_changed', (carga) => {
        if (carga.origin === 'remote' && carga.has_unsaved_draft) {
          mostrarResultado(textos.PERSONALIZACION_REMOTA_CON_CAMBIOS);
        }
      }),
    [escuchar, mostrarResultado],
  );

  const seleccionar = async (id: string, descartar = false) => {
    const r = await invocar('theme_draft_select', {
      theme_id: id,
      ...(descartar ? { discard_changes: true } : {}),
    });
    if (r.ok) {
      setBorrador(r.value);
      setPendiente(null);
    } else if (r.error.code === 'draft.unsaved_changes') {
      // CA03: la lista sigue en el tema anterior hasta que se confirme (CA06).
      setPendiente({ id, mensaje: textoDelError(r.error) });
    } else {
      setPendiente(null);
      mostrarError(r.error);
      void leerTemas();
    }
  };

  // HE-02-HU02-CA02, ET07: cambia solo la vista previa; el escritorio cambia al aplicar.
  const cambiar = async (patch: ThemeDraftPatch) => {
    const r = await invocar('theme_draft_update', { patch });
    if (r.ok) setBorrador(r.value);
    else mostrarError(r.error);
  };

  // HE-02-HU05: el color se valida en el Núcleo; si no es válido, la vista previa no cambia (ET05).
  const cambiarColor = async (campo: CampoDeColor, valor: string) => {
    const r = await invocar('theme_draft_update', { patch: { colors: { [campo]: valor.trim() } } });
    if (r.ok) {
      setBorrador(r.value);
      setMensajesDeColor((m) => ({ ...m, [campo]: undefined }));
    } else if (r.error.field === campo) {
      setMensajesDeColor((m) => ({
        ...m,
        [campo]: { code: r.error.code, message: textoDelError(r.error) },
      }));
    } else {
      mostrarError(r.error);
    }
  };

  // HE-03-HU02-CA01: el tema nuevo queda en edición con la vista previa; el escritorio no cambia (ET07, ET08).
  const guardadoComo = async (mensaje: string) => {
    setGuardandoComo(false);
    mostrarResultado(mensaje);
    const abierto = await invocar('theme_draft_open', {});
    if (abierto.ok) setBorrador(abierto.value);
    void leerTemas();
  };

  // HE-02-HU13-CA01: «Cancelar» vuelve a lo último guardado del tema en edición, sin guardar nada (ET01, ET02).
  const cancelar = async () => {
    const r = await invocar('theme_draft_discard', {});
    if (!r.ok) return mostrarError(r.error);
    setBorrador(r.value);
    setMensajesDeColor({});
    mostrarResultado(r.result_message?.message ?? '');
  };

  // HE-02-HU13-CA02, CA05 (RT-01-ET05): al elegir otra pantalla en el Menú principal, el Núcleo dice si hay
  // cambios sin guardar y si se aplicaron; la navegación espera la respuesta del mensaje.
  const guardia = useCallback(async () => {
    const r = await invocar('theme_draft_get_status', {});
    if (!r.ok || !r.value.dirty) return true;
    return new Promise<boolean>((responder) => setSalida({ aplicados: r.value.applied_unsaved, responder }));
  }, [invocar]);
  useGuardiaDeSalida(guardia);

  /** Responde al Menú principal: `true` sale de la pantalla y `false` la mantiene con sus cambios. */
  const responderSalida = (salir: boolean) => {
    salida?.responder(salir);
    setSalida(null);
  };

  /** «Salir sin guardar»: descarta y sale; si no se puede descartar, se queda en la pantalla con el motivo. */
  const descartarYSalir = async () => {
    const r = await invocar('theme_draft_discard', {});
    if (!r.ok) mostrarError(r.error);
    responderSalida(r.ok);
  };

  // HE-02-HU08: vuelve a los colores o a la tipografía de la plantilla (ET01, ET02).
  const restablecer = async (part: 'colors' | 'typography') => {
    const r = await invocar('theme_draft_reset', { part });
    if (!r.ok) return mostrarError(r.error);
    setBorrador(r.value);
    if (part === 'colors') setMensajesDeColor({});
  };

  // HE-02-HU03-ET06: «Subir imagen» abre el explorador de archivos; «Cancelar» lo cierra sin cambios (CA08).
  const subirImagen = async () => {
    let ruta: string | null = null;
    try {
      ruta = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png'] }],
      });
    } catch {
      return;
    }
    if (!ruta) return;
    const r = await invocar('image_import', { path: ruta, purpose: 'background' });
    if (!r.ok) {
      // CA05 a CA07: el archivo no se sube y la vista previa sigue igual.
      setRechazo(textoDelError(r.error));
      return;
    }
    setRechazo('');
    setVistasPropias((v) => ({ ...v, [r.value.uploaded_image_id]: urlDeArchivo(r.value.preview_url) }));
    await cambiar({ background: { source: 'own', uploaded_image_id: r.value.uploaded_image_id } });
  };

  const abrirCatalogoDeImagenes = async () => {
    const r = await invocar('catalog_list', { kind: 'image' });
    // RT-04 (P26): si el Núcleo no pudo leer el catálogo, se muestra su error en vez de no hacer nada.
    if (!r.ok) return mostrarError(r.error);
    setImagenes(r.value);
  };

  // HE-02-HU11: «Guardar» actualiza el tema en edición (no crea otro) y no toca el escritorio (ET01, ET02).
  const guardar = async () => {
    const r = await invocar('theme_draft_save', {});
    if (!r.ok) {
      if (r.error.code === 'theme.not_found') return fallar(r.error);
      // El tipo sale del texto (RD-63): «Ya tienes el tema…» sigue como mensaje de resultado (HE-02-HU11-ET06).
      return mostrarResultado(textoDelError(r.error));
    }
    mostrarResultado(r.result_message?.message ?? '');
    const abierto = await invocar('theme_draft_open', {});
    if (abierto.ok) setBorrador(abierto.value);
    void leerTemas();
  };

  // HE-02-HU12: «Aplicar» lleva la vista previa al escritorio y a la aplicación (ET01). Con cambios sin guardar
  // el Núcleo responde `draft.unsaved_changes_on_apply` y se abre M-15 (CA02, ET02, ET03).
  const aplicar = async (mode: ApplyMode) => {
    setAlAplicar('');
    const r = await invocar('theme_draft_apply', { mode });
    if (!r.ok) {
      if (r.error.code === 'draft.unsaved_changes_on_apply') setAlAplicar(textoDelError(r.error));
      else fallar(r.error);
      return;
    }
    mostrarResultado(r.result_message?.message ?? '');
    const abierto = await invocar('theme_draft_open', {});
    if (abierto.ok) setBorrador(abierto.value);
    void leerTemas();
  };

  // ET06: el tema en edición es el aplicado y no tiene cambios sin guardar ni cambios sin aplicar.
  const enEdicion = temas.find((t) => t.id === borrador?.theme_id);
  const yaAplicado =
    !!borrador &&
    !!enEdicion?.is_applied &&
    !enEdicion.has_unapplied_changes &&
    !borrador.dirty &&
    !borrador.applied_unsaved;

  // HE-02-HU05-ET06: con un color vacío, «Guardar», «Guardar como tema» y «Aplicar» quedan deshabilitadas.
  const colorVacio = Object.values(mensajesDeColor).some((m) => m?.code === 'color.required');
  // HE-03-HU02-ET05, ET11: como máximo 10 temas (D-035).
  const enElMaximo = temas.length >= 10;
  const aviso = borrador ? avisoDeContraste(borrador.legibility) : null;

  const fondo = borrador?.content.background;
  // HE-02-HU03-ET11: la imagen propia o del catálogo se muestra desde la carpeta de archivos de la aplicación
  // (asset_resolve), también en un tema guardado antes o al volver a abrir la aplicación. Mientras se resuelve,
  // la imagen recién importada o la miniatura del catálogo.
  const resuelta = imagenResuelta && imagenResuelta.clave === claveDelFondo ? imagenResuelta.url : undefined;
  const imagenDeFondo =
    fondo?.source === 'own' && fondo.uploaded_image_id
      ? (resuelta ?? vistasPropias[fondo.uploaded_image_id])
      : fondo?.source === 'catalog'
        ? (resuelta ??
          miniaturaDelCatalogo(imagenes?.find((i) => i.id === fondo.catalog_image_id)?.thumbnail_url))
        : undefined;
  // HE-02-HU06: la fuente y el tamaño de los textos de la vista previa.
  const nombreDeLaFuente = fuentes.find((f) => f.id === borrador?.content.font.id)?.name;
  // RD-46: lo que dice la barra de acciones: el motivo de «Aplicar» deshabilitada o que hay cambios.
  const estadoDeLaBarra = !borrador
    ? ''
    : yaAplicado
      ? textos.TEMA_YA_APLICADO
      : borrador.dirty || borrador.applied_unsaved
        ? 'Cambios en la vista previa'
        : '';
  return (
    <main className="wg-wallpaper" aria-label="Personalización del wallpaper" aria-busy={borrador === null}>
      {borrador && (
        <>
          {/* docs/rediseno.md RD-43 (Figma 91:1642 a 91:1646): título, subtítulo y «Tema en edición». */}
          <div className="wg-wallpaper__cabecera">
            <div>
              <h1 className="wg-wallpaper__titulo">Personalización del wallpaper</h1>
              <p className="wg-wallpaper__subtitulo">
                Prueba los cambios aquí antes de aplicarlos a tu escritorio.
              </p>
            </div>
            <div className="wg-wallpaper__tema">
              <Selector
                etiqueta="Tema en edición"
                valor={borrador.theme_id}
                // El tema en edición va en la lista aunque aún no esté guardado o ya no exista (RD-86).
                opciones={(temas.some((t) => t.id === borrador.theme_id)
                  ? temas
                  : [{ id: borrador.theme_id, name: borrador.name }, ...temas]
                ).map((t) => ({ valor: t.id, texto: t.name }))}
                alCambiar={(id) => void seleccionar(id)}
              />
            </div>
          </div>
          <div className="wg-wallpaper__cuerpo">
            {/* RD-44 (91:1647, 91:1648, 91:1670): «Vista previa de <tema>» y el monitor con su pie. */}
            <div className="wg-wallpaper__previa">
              <h2 className="wg-wallpaper__previa-titulo">{`Vista previa de ${borrador.name}`}</h2>
              <div className="wg-wallpaper__monitor">
                {/* HE-02-HU09-ET01, ET03: el wallpaper y los widgets activos con los cambios, antes de aplicarlos. */}
                <VistaPrevia
                  contenido={borrador.content}
                  imagen={imagenDeFondo}
                  fuente={nombreDeLaFuente ? familia(nombreDeLaFuente) : undefined}
                  tamano={PIXELES_DEL_TAMANO[borrador.content.font.size]}
                  widgets={escritorio?.widgets ?? []}
                  monitor={escritorio?.monitor ?? null}
                />
              </div>
              <div className="wg-wallpaper__pie" aria-hidden="true" />
              {/* HE-02-HU05-ET17: el aviso de contraste va debajo de la vista previa. */}
              {aviso && (
                <p className="wg-aviso" aria-live="polite">
                  {aviso}
                </p>
              )}
            </div>
            <div className="wg-wallpaper__inspector">
              {SECCIONES.map((nombre) => (
                // docs/rediseno.md RD-45 (Figma 91:1671 «Inspector»): cada sección se abre y se cierra con su encabezado.
                <section key={nombre} aria-label={nombre} className="wg-wallpaper__seccion">
                  <h2 className="wg-wallpaper__encabezado-seccion">
                    <button
                      type="button"
                      aria-expanded={abiertas.has(nombre)}
                      aria-controls={`wg-wallpaper-${SECCIONES.indexOf(nombre)}`}
                      onClick={() => alternarSeccion(nombre)}
                    >
                      {nombre}
                      <span aria-hidden="true">{abiertas.has(nombre) ? '−' : '+'}</span>
                    </button>
                  </h2>
                  {abiertas.has(nombre) && (
                    <div id={`wg-wallpaper-${SECCIONES.indexOf(nombre)}`} className="wg-wallpaper__filas">
                      {nombre === 'Plantillas' && (
                        // HE-02-HU02-ET01, ET02, ET04: solo el catálogo, sin crear plantillas ni subir archivos.
                        <ul className="wg-wallpaper__plantillas" aria-label="Catálogo de plantillas">
                          {plantillas.map((p) => {
                            const elegida = p.id === borrador.content.template_id;
                            return (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  className="wg-wallpaper__plantilla"
                                  aria-pressed={elegida}
                                  onClick={() => void cambiar({ template_id: p.id })}
                                >
                                  {/* INT-09: mientras la miniatura se descarga, un espacio del mismo tamaño (sin imagen rota). */}
                                  {p.thumbnail_url ? (
                                    <img src={urlDeArchivo(p.thumbnail_url)} alt="" width={182} height={45} />
                                  ) : (
                                    <span className="wg-wallpaper__sin-miniatura" aria-hidden="true" />
                                  )}
                                  <span className="wg-wallpaper__plantilla-nombre">
                                    <span>{p.name}</span>
                                    {/* RD-45 (91:1686 «Cuaderno · Activa»): la elegida. */}
                                    {elegida && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span>Activa</span>
                                      </>
                                    )}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {nombre === 'Imagen de fondo' && (
                        // HE-02-HU03-ET01, ET02: la imagen actual y las tres opciones.
                        <>
                          <p className="wg-wallpaper__fila">
                            {fondo?.source === 'template_default'
                              ? 'Imagen de fondo de la plantilla'
                              : fondo?.source === 'own'
                                ? 'Imagen propia'
                                : 'Imagen del catálogo de imágenes'}
                          </p>
                          <div className="wg-wallpaper__opciones">
                            <Boton onClick={() => void subirImagen()}>Subir imagen</Boton>
                            <Boton onClick={() => void abrirCatalogoDeImagenes()}>Catálogo de imágenes</Boton>
                            {/* HE-02-HU04: vuelve a la imagen de la plantilla (ET01); con ella, deshabilitada (ET02). */}
                            <Boton
                              disabled={fondo?.source === 'template_default'}
                              motivo={textos.FONDO_YA_POR_DEFECTO}
                              onClick={() => void cambiar({ background: { source: 'template_default' } })}
                            >
                              Quitar imagen
                            </Boton>
                          </div>
                          {/* HE-02-HU14 (P29): el ajuste de la imagen en cada monitor, propio de este computador. */}
                          <AjusteDelFondo invocar={invocar} escuchar={escuchar} />
                          {/* RD-45 (91:1935): «JPG, JPEG o PNG · Máximo 20 MB». */}
                          <p className="wg-wallpaper__fila">JPG, JPEG o PNG · Máximo 20 MB</p>
                          {rechazo && <p role="alert">{rechazo}</p>}
                          {fondo?.source === 'own' && imagenFaltante === claveDelFondo && (
                            <p className="wg-aviso" aria-live="polite">
                              {textos.IMAGEN_DE_FONDO_NO_ENCONTRADA}
                            </p>
                          )}
                          {/* RT-04-ET19 (P26, DUDAS): el catálogo abierto sin imágenes muestra su estado vacío. */}
                          {imagenes?.length === 0 && (
                            <EstadoVacio texto={textos.CATALOGO_DE_IMAGENES_VACIO} />
                          )}
                          {imagenes && imagenes.length > 0 && (
                            // ET07, ET08: solo miniaturas para elegir; no se agregan imágenes al catálogo.
                            <ul className="wg-lista" aria-label="Catálogo de imágenes">
                              {imagenes.map((i) => (
                                <li key={i.id}>
                                  <button
                                    type="button"
                                    className="wg-fila"
                                    aria-pressed={fondo?.catalog_image_id === i.id}
                                    onClick={() =>
                                      void cambiar({
                                        background: { source: 'catalog', catalog_image_id: i.id },
                                      })
                                    }
                                  >
                                    {i.thumbnail_url ? (
                                      <img
                                        src={urlDeArchivo(i.thumbnail_url)}
                                        alt=""
                                        width={96}
                                        height={54}
                                      />
                                    ) : (
                                      <span
                                        className="wg-wallpaper__sin-miniatura wg-wallpaper__sin-miniatura--imagen"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span>{i.name}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                      {nombre === 'Colores' && (
                        <Colores
                          colores={borrador.content.colors}
                          mensajes={{
                            primary: mensajesDeColor.primary?.message,
                            secondary: mensajesDeColor.secondary?.message,
                            text: mensajesDeColor.text?.message,
                          }}
                          alCambiar={(campo, valor) => void cambiarColor(campo, valor)}
                          restablecer={
                            <Boton onClick={() => void restablecer('colors')}>Restablecer colores</Boton>
                          }
                        />
                      )}
                      {nombre === 'Tipografía' && (
                        <Tipografia
                          fuentes={fuentes}
                          tipografia={borrador.content.font}
                          alElegirFuente={(id) => void cambiar({ font_id: id })}
                          alElegirTamano={(tamano) => void cambiar({ font_size: tamano })}
                          restablecer={
                            <Boton onClick={() => void restablecer('typography')}>
                              Restablecer tipografía
                            </Boton>
                          }
                        />
                      )}
                      {nombre === 'Paletas' && (
                        <Paletas
                          paletas={paletas}
                          actual={borrador.content.palette_id}
                          alElegir={(id) => void cambiar({ palette_id: id })}
                        />
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
          {/* RD-46 (91:1711 «Acciones del tema»): el estado a la izquierda y las acciones a la derecha. */}
          <div className="wg-wallpaper__acciones">
            <p id="wg-wallpaper-estado" className="wg-wallpaper__estado" aria-live="polite">
              {estadoDeLaBarra}
            </p>
            <Boton onClick={() => void cancelar()}>Cancelar</Boton>
            {/* ET04: sin cambios sin guardar, «Guardar» queda deshabilitada con su motivo. */}
            <Boton
              disabled={!borrador.dirty || colorVacio}
              motivo={colorVacio ? undefined : textos.SIN_CAMBIOS_PARA_GUARDAR}
              motivoAlPasar
              aria-describedby={!borrador.dirty && !colorVacio ? 'wg-wallpaper-motivo-guardar' : undefined}
              onClick={() => void guardar()}
            >
              Guardar
            </Boton>
            {!borrador.dirty && !colorVacio && (
              <span id="wg-wallpaper-motivo-guardar" className="wg-oculto">
                {textos.SIN_CAMBIOS_PARA_GUARDAR}
              </span>
            )}
            <Boton
              disabled={colorVacio || enElMaximo}
              motivo={enElMaximo ? textos.MAXIMO_DE_TEMAS : undefined}
              motivoAlPasar
              aria-describedby={enElMaximo ? 'wg-wallpaper-motivo-maximo' : undefined}
              onClick={() => setGuardandoComo(true)}
            >
              Guardar como tema
            </Boton>
            {enElMaximo && (
              <span id="wg-wallpaper-motivo-maximo" className="wg-oculto">
                {textos.MAXIMO_DE_TEMAS}
              </span>
            )}
            {/* HE-02-HU12-CA06, ET06: «Aplicar» deshabilitada; su motivo es el estado de la barra (RD-46). */}
            <Boton
              principal
              disabled={yaAplicado || colorVacio}
              aria-describedby={yaAplicado ? 'wg-wallpaper-estado' : undefined}
              onClick={() => void aplicar('apply')}
            >
              Aplicar
            </Boton>
          </div>
        </>
      )}
      {alAplicar && (
        // M-15 (HE-02-HU12-CA02 a CA04). DUDA: HE-02-HU12 M-15 no define el título. Valor usado: «Aplicar».
        <Confirmacion
          titulo="Aplicar"
          texto={alAplicar}
          opcionPrincipal="Guardar y aplicar"
          opcionSecundaria="Aplicar sin guardar"
          alConfirmar={() => void aplicar('save_and_apply')}
          alElegirSecundaria={() => void aplicar('apply_without_saving')}
          alCancelar={() => setAlAplicar('')}
        />
      )}
      {salida && !salida.aplicados && (
        // M-02 (HE-02-HU13-CA02 a CA04). DUDA: HE-02-HU13 M-02 no define el título. Valor usado: «Salir».
        <Confirmacion
          titulo="Salir"
          texto={textos.SALIR_SIN_GUARDAR}
          opcionPrincipal="Salir sin guardar"
          opcionSalir="Seguir editando"
          // CA03: se descartan los cambios y se abre la pantalla elegida; el escritorio no cambia.
          alConfirmar={() => void descartarYSalir()}
          // CA04: se cierra el mensaje y la vista previa conserva sus cambios.
          alCancelar={() => responderSalida(false)}
        />
      )}
      {salida?.aplicados && (
        // M-03 (HE-02-HU13-CA05, CA06, CA08, CA09). DUDA: HE-02-HU13 M-03 no define el título. Valor usado: «Salir».
        <Confirmacion
          titulo="Salir"
          texto={textos.CAMBIOS_APLICADOS_SIN_GUARDAR_AL_SALIR}
          opcionPrincipal="Guardar"
          opcionSecundaria="Salir sin guardar"
          opcionSalir="Seguir editando"
          // CA08: guarda en el tema en edición y sale.
          alConfirmar={() =>
            void invocar('theme_draft_save', {}).then((r) => {
              if (r.ok) mostrarResultado(r.result_message?.message ?? '');
              else fallar(r.error);
              responderSalida(r.ok);
            })
          }
          // CA06: sale; lo aplicado sigue en el escritorio y el tema guardado no cambia (ET05).
          alElegirSecundaria={() => void descartarYSalir()}
          // CA09: se cierra el mensaje y los cambios siguen intactos.
          alCancelar={() => responderSalida(false)}
        />
      )}
      {guardandoComo && (
        <GuardarComoTema
          alGuardar={(mensaje) => void guardadoComo(mensaje)}
          alCancelar={() => setGuardandoComo(false)}
        />
      )}
      {pendiente && (
        <Confirmacion
          titulo="Cambiar de tema"
          texto={pendiente.mensaje}
          opcionPrincipal="Cambiar sin guardar"
          opcionSalir="Seguir editando"
          alConfirmar={() => void seleccionar(pendiente.id, true)}
          alCancelar={() => setPendiente(null)}
        />
      )}
    </main>
  );
}
