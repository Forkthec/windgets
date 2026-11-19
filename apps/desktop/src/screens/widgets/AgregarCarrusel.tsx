import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { CatalogItem, ImageRef } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// Subpantalla Carrusel de imágenes (Widgets > Agregar widget > Carrusel de imágenes; HE-04-HU08-ET01): «Subir
// imagen», «Catálogo de imágenes», la lista de imágenes elegidas con «<cantidad> de 10», el campo Intervalo en
// segundos (5 por defecto) y las opciones «Agregar» y «Regresar» (RT-03).

/** ET02, ET05 (D-040): de 2 a 10 imágenes. */
const MINIMO = 2;
const MAXIMO = 10;

interface Elegida {
  imagen: ImageRef;
  nombre: string;
}

export interface AgregarCarruselProps {
  alRegresar: () => void;
  alIrAWidgets: () => void;
}

export function AgregarCarrusel({ alRegresar, alIrAWidgets }: AgregarCarruselProps) {
  const { invocar } = useNucleo();
  const [elegidas, setElegidas] = useState<Elegida[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogItem[] | null>(null);
  const [rechazo, setRechazo] = useState('');
  const [intervalo, setIntervalo] = useState('5');
  const [mensajeIntervalo, setMensajeIntervalo] = useState('');
  const lleno = elegidas.length >= MAXIMO;

  /** ET06: si se eligen varias a la vez que superan el límite, solo entran las que caben. */
  const sumar = (nuevas: Elegida[]) =>
    setElegidas((actuales) => {
      const caben = nuevas.slice(0, MAXIMO - actuales.length);
      if (caben.length < nuevas.length) setRechazo(textos.CARRUSEL_DEMASIADAS_IMAGENES);
      return [...actuales, ...caben];
    });

  const subir = async () => {
    let rutas: string[] = [];
    try {
      const r = await open({
        multiple: true,
        directory: false,
        filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png'] }],
      });
      rutas = Array.isArray(r) ? r : r ? [r] : [];
    } catch {
      return;
    }
    setRechazo('');
    const nuevas: Elegida[] = [];
    for (const ruta of rutas.slice(0, MAXIMO - elegidas.length)) {
      const r = await invocar('image_import', { path: ruta, purpose: 'carousel_item' });
      if (!r.ok) {
        // CA05, CA06 (ET03): ese archivo no entra al carrusel.
        setRechazo(r.error.message);
        continue;
      }
      nuevas.push({
        imagen: { source: 'own', uploaded_image_id: r.value.uploaded_image_id },
        nombre: ruta.split(/[\\/]/).pop() ?? '',
      });
    }
    sumar(nuevas);
    if (rutas.length > MAXIMO - elegidas.length) setRechazo(textos.CARRUSEL_DEMASIADAS_IMAGENES);
  };

  const abrirCatalogo = async () => {
    const r = await invocar('catalog_list', { kind: 'image' });
    if (r.ok) setCatalogo(r.value);
  };

  const cambiarIntervalo = (valor: string) => {
    setIntervalo(valor);
    setMensajeIntervalo('');
  };

  const agregar = useCallback(async () => {
    // CA07, CA08 (ET04): la vista repite la regla del intervalo; el Núcleo vuelve a validar el rango.
    const texto = intervalo.trim();
    if (texto === '') {
      setMensajeIntervalo(textos.CAMPO_OBLIGATORIO);
      return;
    }
    const segundos = Number(texto);
    if (!Number.isInteger(segundos) || segundos < 3 || segundos > 60) {
      setMensajeIntervalo(textos.INTERVALO_FUERA_DE_RANGO);
      return;
    }
    const r = await invocar('widget_add', {
      type: 'image_carousel',
      config: { items: elegidas.map((e) => e.imagen), interval_seconds: segundos },
    });
    if (!r.ok) {
      if (r.error.field === 'interval_seconds') setMensajeIntervalo(r.error.message);
      else setRechazo(r.error.message);
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, elegidas, intervalo, invocar]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main aria-label="Carrusel de imágenes">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Carrusel de imágenes' },
        ]}
        alRegresar={alRegresar}
      />
      <div className="wg-fila">
        {/* ET06: con 10 imágenes, deshabilitadas con su texto (RT-04). */}
        <Boton disabled={lleno} motivo={textos.CARRUSEL_DEMASIADAS_IMAGENES} onClick={() => void subir()}>
          Subir imagen
        </Boton>
        <Boton
          disabled={lleno}
          motivo={textos.CARRUSEL_DEMASIADAS_IMAGENES}
          onClick={() => void abrirCatalogo()}
        >
          Catálogo de imágenes
        </Boton>
      </div>
      <p>JPG, JPEG o PNG. Máximo 20 MB.</p>
      {rechazo && !lleno && <p role="alert">{rechazo}</p>}
      <p>{`${elegidas.length} de ${MAXIMO}`}</p>
      <ol aria-label="Imágenes elegidas">
        {elegidas.map((e, i) => (
          <li key={`${i}-${e.nombre}`}>{e.nombre}</li>
        ))}
      </ol>
      {catalogo && !lleno && (
        <ul className="wg-lista" aria-label="Catálogo de imágenes">
          {catalogo.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                className="wg-fila"
                onClick={() =>
                  sumar([{ imagen: { source: 'catalog', catalog_image_id: i.id }, nombre: i.name }])
                }
              >
                <img src={i.thumbnail_url} alt="" width={96} height={54} />
                <span>{i.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <CampoTexto
        etiqueta="Intervalo (segundos)"
        valor={intervalo}
        alCambiar={cambiarIntervalo}
        inputMode="numeric"
        mensaje={mensajeIntervalo || undefined}
      />
      {/* ET07: con menos de 2 imágenes, deshabilitada con su texto (RT-04). */}
      <Boton
        principal
        disabled={elegidas.length < MINIMO || enCurso}
        motivo={elegidas.length < MINIMO ? textos.CARRUSEL_POCAS_IMAGENES : undefined}
        onClick={() => void ejecutar()}
      >
        Agregar
      </Boton>
    </main>
  );
}
