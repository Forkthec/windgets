import { CARRUSEL_IMAGENES_MAX, CARRUSEL_IMAGENES_MIN } from '@/reglas/limites';
import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { CatalogItem, ImageRef } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { MiniaturaDelCatalogo } from './MiniaturaDelCatalogo';
import { textoDelError } from '@/ipc/textoDelError';

// Subpantalla Carrusel de imágenes (Widgets > Agregar widget > Carrusel de imágenes; HE-04-HU08-ET01): «Subir
// imagen», «Catálogo de imágenes», la lista de imágenes elegidas con «<cantidad> de 10», el campo Intervalo en
// segundos (5 por defecto) y las opciones «Agregar» y «Regresar» (RT-03).

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
  const lleno = elegidas.length >= CARRUSEL_IMAGENES_MAX;

  /** ET06: si se eligen varias a la vez que superan el límite, solo entran las que caben. */
  const sumar = (nuevas: Elegida[]) =>
    setElegidas((actuales) => {
      const caben = nuevas.slice(0, CARRUSEL_IMAGENES_MAX - actuales.length);
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
    for (const ruta of rutas.slice(0, CARRUSEL_IMAGENES_MAX - elegidas.length)) {
      const r = await invocar('image_import', { path: ruta, purpose: 'carousel_item' });
      if (!r.ok) {
        // CA05, CA06 (ET03): ese archivo no entra al carrusel.
        setRechazo(textoDelError(r.error));
        continue;
      }
      nuevas.push({
        imagen: { source: 'own', uploaded_image_id: r.value.uploaded_image_id },
        nombre: ruta.split(/[\\/]/).pop() ?? '',
      });
    }
    sumar(nuevas);
    if (rutas.length > CARRUSEL_IMAGENES_MAX - elegidas.length)
      setRechazo(textos.CARRUSEL_DEMASIADAS_IMAGENES);
  };

  const abrirCatalogo = async () => {
    const r = await invocar('catalog_list', { kind: 'image' });
    if (r.ok) setCatalogo(r.value);
    else setRechazo(textoDelError(r.error));
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
      if (r.error.field === 'interval_seconds') setMensajeIntervalo(textoDelError(r.error));
      else setRechazo(textoDelError(r.error));
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, elegidas, intervalo, invocar]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main className="wg-subpantalla-widget" aria-label="Carrusel de imágenes">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Carrusel de imágenes' },
        ]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      {/* docs/rediseno.md RD-60: las imágenes del carrusel en una fila de fondo de columna (84:818). */}
      <div className="wg-subpantalla-widget__dato">
        <p>{`${elegidas.length} de ${CARRUSEL_IMAGENES_MAX}`}</p>
        <ol aria-label="Imágenes elegidas">
          {elegidas.map((e, i) => (
            <li key={`${i}-${e.nombre}`}>{e.nombre}</li>
          ))}
        </ol>
      </div>
      {catalogo && !lleno && (
        <ul className="wg-lista wg-subpantalla-widget__catalogo" aria-label="Catálogo de imágenes">
          {catalogo.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                className="wg-fila"
                onClick={() =>
                  sumar([{ imagen: { source: 'catalog', catalog_image_id: i.id }, nombre: i.name }])
                }
              >
                <MiniaturaDelCatalogo ruta={i.thumbnail_url} />
                <span>{i.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="wg-subpantalla-widget__formulario">
        <CampoTexto
          etiqueta="Intervalo (segundos)"
          valor={intervalo}
          alCambiar={cambiarIntervalo}
          inputMode="numeric"
          mensaje={mensajeIntervalo || undefined}
        />
      </div>
      <p>JPG, JPEG o PNG. Máximo 20 MB.</p>
      {rechazo && !lleno && <p role="alert">{rechazo}</p>}
      {/* docs/rediseno.md RD-60: «Subir imagen», «Catálogo de imágenes», «Agregar» y «Regresar» abajo a la izquierda
          (84:820 a 84:824). */}
      <div className="wg-subpantalla-widget__acciones">
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
        {/* ET07: con menos de 2 imágenes, deshabilitada con su texto (RT-04). */}
        <Boton
          principal
          disabled={elegidas.length < CARRUSEL_IMAGENES_MIN || enCurso}
          motivo={elegidas.length < CARRUSEL_IMAGENES_MIN ? textos.CARRUSEL_POCAS_IMAGENES : undefined}
          onClick={() => void ejecutar()}
        >
          Agregar
        </Boton>
        <Boton onClick={alRegresar}>Regresar</Boton>
      </div>
    </main>
  );
}
