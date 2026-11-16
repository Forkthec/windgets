import { convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useEffect, useState } from 'react';
import textos from '@/types/messages.es.json';
import type { CatalogItem, ThemeDraftPatch, ThemeDraftView, ThemeSummary } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { Selector } from '@/ui/Selector/Selector';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// P-WAL-01 Personalización del wallpaper (Menú principal > Personalización > Personalización del wallpaper;
// HE-02-HU10). Esta HU construye la lista «Tema en edición», la vista previa, las secciones y las opciones; el
// contenido de cada sección llega con HE-02-HU02, HU03, HU05 a HU08, y «Guardar», «Aplicar» y «Cancelar» actúan
// con HE-02-HU11, HU12 y HU13.

/** La URL con la que la ventana muestra un archivo del computador (fuera de Tauri, la misma ruta). */
function urlDeArchivo(ruta: string): string {
  try {
    return convertFileSrc(ruta);
  } catch {
    return ruta;
  }
}

/** Las secciones de la pantalla (HE-02-HU10-ET01), en este orden. */
const SECCIONES = ['Plantillas', 'Imagen de fondo', 'Colores', 'Tipografía', 'Paletas'] as const;

export function Personalization() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [temas, setTemas] = useState<ThemeSummary[]>([]);
  const [borrador, setBorrador] = useState<ThemeDraftView | null>(null);
  const [plantillas, setPlantillas] = useState<CatalogItem[]>([]);
  // M-04: el tema que se quería abrir cuando el Núcleo avisó de cambios sin guardar.
  // HE-02-HU03: el catálogo de imágenes (abierto con «Catálogo de imágenes»), la imagen propia que se muestra
  // y el rechazo del último archivo elegido.
  const [imagenes, setImagenes] = useState<CatalogItem[] | null>(null);
  const [vistasPropias, setVistasPropias] = useState<Record<string, string>>({});
  const [rechazo, setRechazo] = useState('');
  const [pendiente, setPendiente] = useState<{ id: string; mensaje: string } | null>(null);

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

  const fondo = borrador?.content.background;
  const imagenDeFondo =
    fondo?.source === 'own' && fondo.uploaded_image_id
      ? vistasPropias[fondo.uploaded_image_id]
      : fondo?.source === 'catalog'
        ? imagenes?.find((i) => i.id === fondo.catalog_image_id)?.thumbnail_url
        : undefined;
  const colores = borrador?.content.colors;
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
          {/* ET01: vista previa del escritorio. Los widgets activos llegan con P07. */}
          <section
            aria-label="Vista previa del escritorio"
            className="wg-vista-previa"
            style={{
              background: colores?.primary,
              color: colores?.text,
              // HE-02-HU03-ET05: la imagen se ajusta al escritorio sin deformarse.
              ...(imagenDeFondo
                ? {
                    backgroundImage: `url("${imagenDeFondo}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}),
            }}
          />
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
                    <Boton>Quitar imagen</Boton>
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
            </section>
          ))}
          <div className="wg-fila">
            {/* ET04: sin cambios sin guardar, «Guardar» queda deshabilitada con su motivo. */}
            <Boton
              disabled={!borrador.dirty}
              motivo={textos.SIN_CAMBIOS_PARA_GUARDAR}
              onClick={() => void guardar()}
            >
              Guardar
            </Boton>
            <Boton>Guardar como tema</Boton>
            <Boton principal>Aplicar</Boton>
            <Boton>Cancelar</Boton>
          </div>
        </>
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
