import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useEffect, useState } from 'react';
import { urlDeArchivo } from '@/ipc/archivos';
import textos from '@/types/messages.es.json';
import type {
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
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { Selector } from '@/ui/Selector/Selector';
import { useGuardiaDeSalida, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { Colores, type CampoDeColor } from './Colores';
import { GuardarComoTema } from './GuardarComoTema';
import { Paletas } from './Paletas';
import { VistaPrevia } from './VistaPrevia';
import { familia, PIXELES_DEL_TAMANO, Tipografia } from './Tipografia';

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
const SECCIONES = ['Plantillas', 'Imagen de fondo', 'Colores', 'Tipografía', 'Paletas'] as const;

export function Personalization() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
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
      setPendiente({ id, mensaje: r.error.message });
    }
  };

  // HE-02-HU02-CA02, ET07: cambia solo la vista previa; el escritorio cambia al aplicar.
  const cambiar = async (patch: ThemeDraftPatch) => {
    const r = await invocar('theme_draft_update', { patch });
    if (r.ok) setBorrador(r.value);
  };

  // HE-02-HU05: el color se valida en el Núcleo; si no es válido, la vista previa no cambia (ET05).
  const cambiarColor = async (campo: CampoDeColor, valor: string) => {
    const r = await invocar('theme_draft_update', { patch: { colors: { [campo]: valor.trim() } } });
    if (r.ok) {
      setBorrador(r.value);
      setMensajesDeColor((m) => ({ ...m, [campo]: undefined }));
    } else if (r.error.field === campo) {
      setMensajesDeColor((m) => ({ ...m, [campo]: { code: r.error.code, message: r.error.message } }));
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
    if (!r.ok) return;
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

  // HE-02-HU08: vuelve a los colores o a la tipografía de la plantilla (ET01, ET02).
  const restablecer = async (part: 'colors' | 'typography') => {
    const r = await invocar('theme_draft_reset', { part });
    if (!r.ok) return;
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
      setRechazo(r.error.message);
      return;
    }
    setRechazo('');
    setVistasPropias((v) => ({ ...v, [r.value.uploaded_image_id]: urlDeArchivo(r.value.preview_url) }));
    await cambiar({ background: { source: 'own', uploaded_image_id: r.value.uploaded_image_id } });
  };

  const abrirCatalogoDeImagenes = async () => {
    const r = await invocar('catalog_list', { kind: 'image' });
    if (r.ok) setImagenes(r.value);
  };

  // HE-02-HU11: «Guardar» actualiza el tema en edición (no crea otro) y no toca el escritorio (ET01, ET02).
  const guardar = async () => {
    const r = await invocar('theme_draft_save', {});
    if (!r.ok) {
      if (r.error.message) mostrarResultado(r.error.message);
      return;
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
      if (r.error.code === 'draft.unsaved_changes_on_apply') setAlAplicar(r.error.message);
      else if (r.error.message) mostrarResultado(r.error.message);
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
  const imagenDeFondo =
    fondo?.source === 'own' && fondo.uploaded_image_id
      ? vistasPropias[fondo.uploaded_image_id]
      : fondo?.source === 'catalog'
        ? imagenes?.find((i) => i.id === fondo.catalog_image_id)?.thumbnail_url
        : undefined;
  // HE-02-HU06: la fuente y el tamaño de los textos de la vista previa.
  const nombreDeLaFuente = fuentes.find((f) => f.id === borrador?.content.font.id)?.name;
  return (
    <main aria-label="Personalización del wallpaper" aria-busy={borrador === null}>
      {borrador && (
        <>
          <Selector
            etiqueta="Tema en edición"
            valor={borrador.theme_id}
            opciones={(temas.length > 0 ? temas : [{ id: borrador.theme_id, name: borrador.name }]).map(
              (t) => ({ valor: t.id, texto: t.name }),
            )}
            alCambiar={(id) => void seleccionar(id)}
          />
          {/* HE-02-HU09-ET01, ET03: el wallpaper y los widgets activos con los cambios, antes de aplicarlos. */}
          <VistaPrevia
            contenido={borrador.content}
            imagen={imagenDeFondo}
            fuente={nombreDeLaFuente ? familia(nombreDeLaFuente) : undefined}
            tamano={PIXELES_DEL_TAMANO[borrador.content.font.size]}
            widgets={escritorio?.widgets ?? []}
            monitor={escritorio?.monitor ?? null}
          />
          {/* HE-02-HU05-ET17: el aviso de contraste va debajo de la vista previa. */}
          {aviso && (
            <p className="wg-aviso" aria-live="polite">
              {aviso}
            </p>
          )}
          {SECCIONES.map((nombre) => (
            <section key={nombre} aria-label={nombre}>
              <h2>{nombre}</h2>
              {nombre === 'Plantillas' && (
                // HE-02-HU02-ET01, ET02, ET04: solo el catálogo, sin crear plantillas ni subir archivos.
                <ul className="wg-lista" aria-label="Catálogo de plantillas">
                  {plantillas.map((p) => {
                    const elegida = p.id === borrador.content.template_id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="wg-fila"
                          aria-pressed={elegida}
                          onClick={() => void cambiar({ template_id: p.id })}
                        >
                          <img src={p.thumbnail_url} alt="" width={96} height={54} />
                          <span>{p.name}</span>
                          {elegida && <span>Seleccionada</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {nombre === 'Imagen de fondo' && (
                // HE-02-HU03-ET01, ET02: la imagen actual y las tres opciones.
                <>
                  <p>
                    {fondo?.source === 'template_default'
                      ? 'Imagen de fondo de la plantilla'
                      : fondo?.source === 'own'
                        ? 'Imagen propia'
                        : 'Imagen del catálogo de imágenes'}
                  </p>
                  <div className="wg-fila">
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
                  <p>JPG, JPEG o PNG. Máximo 20 MB.</p>
                  {rechazo && <p role="alert">{rechazo}</p>}
                  {imagenes && (
                    // ET07, ET08: solo miniaturas para elegir; no se agregan imágenes al catálogo.
                    <ul className="wg-lista" aria-label="Catálogo de imágenes">
                      {imagenes.map((i) => (
                        <li key={i.id}>
                          <button
                            type="button"
                            className="wg-fila"
                            aria-pressed={fondo?.catalog_image_id === i.id}
                            onClick={() =>
                              void cambiar({ background: { source: 'catalog', catalog_image_id: i.id } })
                            }
                          >
                            <img src={i.thumbnail_url} alt="" width={96} height={54} />
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
                  restablecer={<Boton onClick={() => void restablecer('colors')}>Restablecer colores</Boton>}
                />
              )}
              {nombre === 'Tipografía' && (
                <Tipografia
                  fuentes={fuentes}
                  tipografia={borrador.content.font}
                  alElegirFuente={(id) => void cambiar({ font_id: id })}
                  alElegirTamano={(tamano) => void cambiar({ font_size: tamano })}
                  restablecer={
                    <Boton onClick={() => void restablecer('typography')}>Restablecer tipografía</Boton>
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
            </section>
          ))}
          <div className="wg-fila">
            {/* ET04: sin cambios sin guardar, «Guardar» queda deshabilitada con su motivo. */}
            <Boton
              disabled={!borrador.dirty || colorVacio}
              motivo={colorVacio ? undefined : textos.SIN_CAMBIOS_PARA_GUARDAR}
              onClick={() => void guardar()}
            >
              Guardar
            </Boton>
            <Boton
              disabled={colorVacio || enElMaximo}
              motivo={enElMaximo ? textos.MAXIMO_DE_TEMAS : undefined}
              onClick={() => setGuardandoComo(true)}
            >
              Guardar como tema
            </Boton>
            {/* HE-02-HU12-CA06, ET06: «Aplicar» deshabilitada con su motivo. */}
            <Boton
              principal
              disabled={yaAplicado || colorVacio}
              motivo={yaAplicado ? textos.TEMA_YA_APLICADO : undefined}
              onClick={() => void aplicar('apply')}
            >
              Aplicar
            </Boton>
            <Boton onClick={() => void cancelar()}>Cancelar</Boton>
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
          alConfirmar={() => void invocar('theme_draft_discard', {}).then(() => responderSalida(true))}
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
              responderSalida(r.ok);
            })
          }
          // CA06: sale; lo aplicado sigue en el escritorio y el tema guardado no cambia (ET05).
          alElegirSecundaria={() => void invocar('theme_draft_discard', {}).then(() => responderSalida(true))}
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
