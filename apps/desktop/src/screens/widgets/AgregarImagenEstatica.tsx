import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { CatalogItem, ImageRef } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { MiniaturaDelCatalogo } from './MiniaturaDelCatalogo';
import { textoDelError } from '@/ipc/textoDelError';

// Subpantalla Imagen estática (Widgets > Agregar widget > Imagen estática; HE-04-HU07-ET01): «Subir imagen» con el
// texto «JPG, JPEG o PNG. Máximo 20 MB.», «Catálogo de imágenes», «Agregar» y «Regresar» (RT-03). El Núcleo valida
// el archivo al importarlo (`image_import`, ET02) y la imagen al agregar el widget.

export interface AgregarImagenEstaticaProps {
  /** «Agregar widget» en la miga de pan y «Regresar» (CA06, ET05). */
  alRegresar: () => void;
  /** «Widgets» en la miga de pan; también al agregar el widget (CA01, CA02). */
  alIrAWidgets: () => void;
}

export function AgregarImagenEstatica({ alRegresar, alIrAWidgets }: AgregarImagenEstaticaProps) {
  const { invocar } = useNucleo();
  const [imagen, setImagen] = useState<ImageRef | null>(null);
  const [nombre, setNombre] = useState('');
  const [catalogo, setCatalogo] = useState<CatalogItem[] | null>(null);
  const [mensaje, setMensaje] = useState('');

  // «Subir imagen» abre el explorador de archivos; «Cancelar» lo cierra sin cambios.
  const subir = async () => {
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
    const r = await invocar('image_import', { path: ruta, purpose: 'static_image' });
    if (!r.ok) {
      // CA03, CA04: el archivo no se acepta.
      setMensaje(textoDelError(r.error));
      return;
    }
    setMensaje('');
    setImagen({ source: 'own', uploaded_image_id: r.value.uploaded_image_id });
    setNombre(ruta.split(/[\\/]/).pop() ?? '');
  };

  const abrirCatalogo = async () => {
    const r = await invocar('catalog_list', { kind: 'image' });
    if (r.ok) setCatalogo(r.value);
    else setMensaje(textoDelError(r.error));
  };

  const agregar = useCallback(async () => {
    if (!imagen) return;
    const r = await invocar('widget_add', { type: 'static_image', config: imagen });
    if (!r.ok) {
      setMensaje(textoDelError(r.error));
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, imagen, invocar]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main className="wg-subpantalla-widget" aria-label="Imagen estática">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Imagen estática' },
        ]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      {imagen?.source === 'own' && (
        <p className="wg-subpantalla-widget__dato">{`Imagen propia: ${nombre}`}</p>
      )}
      {catalogo && (
        // ET03: solo se elige; el usuario no agrega imágenes al catálogo.
        <ul className="wg-lista wg-subpantalla-widget__catalogo" aria-label="Catálogo de imágenes">
          {catalogo.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                className="wg-fila"
                aria-pressed={imagen?.source === 'catalog' && imagen.catalog_image_id === i.id}
                onClick={() => {
                  setMensaje('');
                  setImagen({ source: 'catalog', catalog_image_id: i.id });
                }}
              >
                <MiniaturaDelCatalogo ruta={i.thumbnail_url} />
                <span>{i.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p>JPG, JPEG o PNG. Máximo 20 MB.</p>
      {mensaje && <p role="alert">{mensaje}</p>}
      {/* docs/rediseno.md RD-60: «Subir imagen», «Catálogo de imágenes», «Agregar» y «Regresar» abajo a la izquierda
          (84:796 a 84:800). */}
      <div className="wg-subpantalla-widget__acciones">
        <Boton onClick={() => void subir()}>Subir imagen</Boton>
        <Boton onClick={() => void abrirCatalogo()}>Catálogo de imágenes</Boton>
        {/* ET04: deshabilitada sin una imagen elegida (RT-04). */}
        <Boton principal disabled={!imagen || enCurso} onClick={() => void ejecutar()}>
          Agregar
        </Boton>
        <Boton onClick={alRegresar}>Regresar</Boton>
      </div>
    </main>
  );
}
