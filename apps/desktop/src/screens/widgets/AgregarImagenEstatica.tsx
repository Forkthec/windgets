import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { CatalogItem, ImageRef } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

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
      setMensaje(r.error.message);
      return;
    }
    setMensaje('');
    setImagen({ source: 'own', uploaded_image_id: r.value.uploaded_image_id });
    setNombre(ruta.split(/[\\/]/).pop() ?? '');
  };

  const abrirCatalogo = async () => {
    const r = await invocar('catalog_list', { kind: 'image' });
    if (r.ok) setCatalogo(r.value);
  };

  const agregar = useCallback(async () => {
    if (!imagen) return;
    const r = await invocar('widget_add', { type: 'static_image', config: imagen });
    if (!r.ok) {
      setMensaje(r.error.message);
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, imagen, invocar]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main aria-label="Imagen estática">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Imagen estática' },
        ]}
        alRegresar={alRegresar}
      />
      <div className="wg-fila">
        <Boton onClick={() => void subir()}>Subir imagen</Boton>
        <Boton onClick={() => void abrirCatalogo()}>Catálogo de imágenes</Boton>
      </div>
      <p>JPG, JPEG o PNG. Máximo 20 MB.</p>
      {mensaje && <p role="alert">{mensaje}</p>}
      {imagen?.source === 'own' && <p>{`Imagen propia: ${nombre}`}</p>}
      {catalogo && (
        // ET03: solo se elige; el usuario no agrega imágenes al catálogo.
        <ul className="wg-lista" aria-label="Catálogo de imágenes">
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
                <img src={i.thumbnail_url} alt="" width={96} height={54} />
                <span>{i.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* ET04: deshabilitada sin una imagen elegida (RT-04). */}
      <Boton principal disabled={!imagen || enCurso} onClick={() => void ejecutar()}>
        Agregar
      </Boton>
    </main>
  );
}
