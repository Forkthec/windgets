import { useCallback, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { AddableWidgetType } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// Subpantalla de un widget que se agrega sin datos (Noticias, HE-04-HU06-ET01; Reproductor de música, HE-04-HU11):
// la miga de pan «Widgets > Agregar widget > <widget>», la descripción del widget y las opciones «Agregar» y
// «Regresar» (RT-03).

export interface AgregarSinDatosProps {
  tipo: AddableWidgetType;
  nombre: string;
  descripcion: string;
  /** «Agregar widget» en la miga de pan y «Regresar». */
  alRegresar: () => void;
  /** «Widgets» en la miga de pan; también al agregar el widget. */
  alIrAWidgets: () => void;
}

export function AgregarSinDatos({
  tipo,
  nombre,
  descripcion,
  alRegresar,
  alIrAWidgets,
}: AgregarSinDatosProps) {
  const { invocar } = useNucleo();
  const [mensaje, setMensaje] = useState('');

  const agregar = useCallback(async () => {
    const r = await invocar('widget_add', { type: tipo, config: {} });
    if (!r.ok) {
      setMensaje(r.error.message);
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, invocar, tipo]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main className="wg-subpantalla-widget" aria-label={nombre}>
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: nombre },
        ]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      {/* docs/rediseno.md RD-60: la descripción en una fila de fondo de columna (84:774, 84:882). */}
      <p className="wg-subpantalla-widget__dato">{descripcion}</p>
      {mensaje && <p role="alert">{mensaje}</p>}
      <div className="wg-subpantalla-widget__acciones">
        <Boton principal disabled={enCurso} onClick={() => void ejecutar()}>
          Agregar
        </Boton>
        <Boton onClick={alRegresar}>Regresar</Boton>
      </div>
    </main>
  );
}
