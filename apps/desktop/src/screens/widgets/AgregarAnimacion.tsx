import { useCallback, useEffect, useState } from 'react';
import { urlDeArchivo } from '@/ipc/archivos';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { CatalogItem } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { MiniaturaDelCatalogo } from './MiniaturaDelCatalogo';
import { textoDelError } from '@/ipc/textoDelError';

// Subpantalla Animación (Widgets > Agregar widget > Animación; HE-04-HU09-ET01): el catálogo de animaciones con la
// miniatura y el nombre de cada una, la animación elegida en reproducción (ET03) y las opciones «Agregar» y
// «Regresar» (RT-03). El usuario no sube animaciones propias (ET02).

export interface AgregarAnimacionProps {
  alRegresar: () => void;
  alIrAWidgets: () => void;
}

export function AgregarAnimacion({ alRegresar, alIrAWidgets }: AgregarAnimacionProps) {
  const { invocar } = useNucleo();
  const [catalogo, setCatalogo] = useState<CatalogItem[] | null>(null);
  const [elegida, setElegida] = useState<CatalogItem | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let vigente = true;
    void invocar('catalog_list', { kind: 'animation' }).then((r) => {
      if (vigente && r.ok) setCatalogo(r.value);
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  // ET03: al elegirla se reproduce antes de agregarla.
  const elegir = async (a: CatalogItem) => {
    setElegida(a);
    setVideo(null);
    setMensaje('');
    const archivo = await invocar('asset_resolve', { kind: 'catalog_animation', id: a.id });
    if (!archivo.ok) setMensaje(textoDelError(archivo.error));
    else if (archivo.value.state === 'ready') setVideo(urlDeArchivo(archivo.value.url));
  };

  const agregar = useCallback(async () => {
    if (!elegida) return;
    const r = await invocar('widget_add', { type: 'animation', config: { animation_id: elegida.id } });
    if (r.ok) alIrAWidgets();
    else setMensaje(textoDelError(r.error));
  }, [alIrAWidgets, elegida, invocar]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main className="wg-subpantalla-widget" aria-label="Animación">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Animación' },
        ]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      {catalogo && (
        <ul className="wg-lista wg-subpantalla-widget__catalogo" aria-label="Catálogo de animaciones">
          {catalogo.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="wg-fila"
                aria-pressed={elegida?.id === a.id}
                onClick={() => void elegir(a)}
              >
                <MiniaturaDelCatalogo ruta={a.thumbnail_url} />
                <span>{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {elegida && (
        <section className="wg-subpantalla-widget__dato" aria-label="Vista previa de la animación">
          {/* DUDA: HE-04-HU09 las animaciones Lottie necesitan un reproductor que el proyecto no tiene; se
              reproducen las webm y de las Lottie se muestra la miniatura (docs/DUDAS.md). */}
          {video && elegida.format !== 'lottie' ? (
            <video src={video} autoPlay loop muted playsInline width={320} height={180} />
          ) : (
            elegida.thumbnail_url && (
              <img src={urlDeArchivo(elegida.thumbnail_url)} alt="" width={320} height={180} />
            )
          )}
        </section>
      )}
      {mensaje && <p role="alert">{mensaje}</p>}
      {/* docs/rediseno.md RD-59: «Agregar» y «Regresar» abajo a la izquierda (84:844, 84:846). */}
      <div className="wg-subpantalla-widget__acciones">
        <Boton principal disabled={!elegida || enCurso} onClick={() => void ejecutar()}>
          Agregar
        </Boton>
        <Boton onClick={alRegresar}>Regresar</Boton>
      </div>
    </main>
  );
}
