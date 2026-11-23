import { useEffect, useState } from 'react';
import { AgregarClima } from './AgregarClima';
import { AgregarAnimacion } from './AgregarAnimacion';
import { AgregarCarrusel } from './AgregarCarrusel';
import { AgregarImagenEstatica } from './AgregarImagenEstatica';
import { AgregarSinDatos } from './AgregarSinDatos';
import { AgregarTexto } from './AgregarTexto';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { AddableWidgetType, WidgetCatalog, WidgetCatalogEntry } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// P-WID-02 Agregar widget (Menú principal > Personalización > Widgets > Agregar widget; HE-04-HU04). El
// catálogo sale del Núcleo (IPC-WID-02 widget_catalog_get) sin los widgets por defecto. Seleccionar un widget
// abre su subpantalla con HE-04-HU05 a HU11 (P21) (docs/DUDAS.md).

export interface AgregarWidgetProps {
  /** «Regresar» y «Widgets» en la miga de pan vuelven a la pantalla Widgets (RT-03). */
  alRegresar: () => void;
}

function Grupo({
  titulo,
  entradas,
  alElegir,
}: {
  titulo: string;
  entradas: WidgetCatalogEntry[];
  alElegir: (tipo: AddableWidgetType) => void;
}) {
  return (
    <section aria-label={titulo}>
      <h2>{titulo}</h2>
      <ul className="wg-lista wg-catalogo wg-subpantalla-widget__catalogo">
        {entradas.map((e) => (
          // ET02: nombre, ícono y descripción de una línea; CA02: deshabilitado con su motivo (RT-04).
          <li key={e.type} className="wg-lista__elemento">
            <Boton
              disabled={!e.enabled}
              motivo={e.disabled_reason ?? undefined}
              onClick={() => alElegir(e.type)}
            >
              {/* DUDA: HE-04-HU04 el ícono de cada widget no está definido; recuadro neutro. */}
              <span className="wg-icono-widget" data-tipo={e.type} aria-hidden="true" />
              <span className="wg-lista__nombre">{e.name}</span>
              <span>{e.description}</span>
            </Boton>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AgregarWidget({ alRegresar }: AgregarWidgetProps) {
  const { invocar } = useNucleo();
  const [catalogo, setCatalogo] = useState<WidgetCatalog | null>(null);
  // La subpantalla del widget elegido (HE-04-HU05 a HU11).
  const [elegido, setElegido] = useState<AddableWidgetType | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('widget_catalog_get', {}).then((r) => {
      if (vigente && r.ok) setCatalogo(r.value);
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  if (elegido === 'weather') {
    return <AgregarClima alRegresar={() => setElegido(null)} alIrAWidgets={alRegresar} />;
  }
  if (elegido === 'text') {
    return <AgregarTexto alRegresar={() => setElegido(null)} alIrAWidgets={alRegresar} />;
  }
  if (elegido === 'animation') {
    return <AgregarAnimacion alRegresar={() => setElegido(null)} alIrAWidgets={alRegresar} />;
  }
  if (elegido === 'image_carousel') {
    return <AgregarCarrusel alRegresar={() => setElegido(null)} alIrAWidgets={alRegresar} />;
  }
  if (elegido === 'static_image') {
    return <AgregarImagenEstatica alRegresar={() => setElegido(null)} alIrAWidgets={alRegresar} />;
  }
  const entrada = [...(catalogo?.external ?? []), ...(catalogo?.local ?? [])].find((e) => e.type === elegido);
  if (entrada && (elegido === 'news' || elegido === 'music_player')) {
    return (
      <AgregarSinDatos
        tipo={entrada.type}
        nombre={entrada.name}
        descripcion={entrada.description}
        alRegresar={() => setElegido(null)}
        alIrAWidgets={alRegresar}
      />
    );
  }

  return (
    <main className="wg-subpantalla-widget" aria-label="Agregar widget" aria-busy={catalogo === null}>
      {/* ET01: miga de pan «Widgets > Agregar widget» y «Regresar» (RT-03). */}
      <EncabezadoDeRuta
        niveles={[{ texto: 'Widgets', alElegir: alRegresar }, { texto: 'Agregar widget' }]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      {catalogo && (
        <>
          <Grupo titulo="Widgets externos" entradas={catalogo.external} alElegir={setElegido} />
          <Grupo titulo="Widgets locales" entradas={catalogo.local} alElegir={setElegido} />
        </>
      )}
      {/* docs/rediseno.md RD-58: «Regresar» abajo a la izquierda (84:736). */}
      <div className="wg-subpantalla-widget__acciones">
        <Boton onClick={alRegresar}>Regresar</Boton>
      </div>
    </main>
  );
}
