import { useCallback, useEffect, useState } from 'react';
import type { CatalogItem, ThemeDraftPatch, ThemeDraftView, ThemeSummary } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { Selector } from '@/ui/Selector/Selector';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// P-WAL-01 Personalización del wallpaper (Menú principal > Personalización > Personalización del wallpaper;
// HE-02-HU10). Esta HU construye la lista «Tema en edición», la vista previa, las secciones y las opciones; el
// contenido de cada sección llega con HE-02-HU02, HU03, HU05 a HU08, y «Guardar», «Aplicar» y «Cancelar» actúan
// con HE-02-HU11, HU12 y HU13.

/** Las secciones de la pantalla (HE-02-HU10-ET01), en este orden. */
const SECCIONES = ['Plantillas', 'Imagen de fondo', 'Colores', 'Tipografía', 'Paletas'] as const;

export function Personalization() {
  const { invocar, escuchar } = useNucleo();
  const [temas, setTemas] = useState<ThemeSummary[]>([]);
  const [borrador, setBorrador] = useState<ThemeDraftView | null>(null);
  const [plantillas, setPlantillas] = useState<CatalogItem[]>([]);
  // M-04: el tema que se quería abrir cuando el Núcleo avisó de cambios sin guardar.
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
            style={{ background: colores?.primary, color: colores?.text }}
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
            </section>
          ))}
          <div className="wg-fila">
            <Boton>Guardar</Boton>
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
