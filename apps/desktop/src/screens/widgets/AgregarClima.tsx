import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { GeocodeResult } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { CampoCiudad } from './CampoCiudad';

// Subpantalla Clima (Widgets > Agregar widget > Clima; HE-04-HU05-ET01): el campo Ciudad y las opciones «Agregar»
// y «Regresar» (RT-03). El campo sugiere lugares mientras se escribe y la persona elige uno (ET18, P29); el Núcleo
// responde si ya tiene un widget Clima para ese lugar (D-188).

export interface AgregarClimaProps {
  /** «Agregar widget» en la miga de pan y «Regresar». */
  alRegresar: () => void;
  /** «Widgets» en la miga de pan; también al agregar el widget (CA01). */
  alIrAWidgets: () => void;
}

export function AgregarClima({ alRegresar, alIrAWidgets }: AgregarClimaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  // ET16: el campo Ciudad viene vacío.
  const [ciudad, setCiudad] = useState('');
  const [lugar, setLugar] = useState<GeocodeResult | null>(null);
  const [mensaje, setMensaje] = useState('');

  const agregar = useCallback(async () => {
    // ET03, ET18: sin un lugar elegido de las sugerencias no se agrega.
    if (!lugar) return;
    const r = await invocar('widget_add', { type: 'weather', config: { city: lugar.name, place: lugar } });
    if (!r.ok) {
      // CA04, CA05, CA09: el mensaje va en el campo Ciudad.
      setMensaje(r.error.message);
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, invocar, lugar]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main className="wg-subpantalla-widget" aria-label="Clima">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Clima' },
        ]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      <form
        id={idFormulario}
        className="wg-formulario wg-subpantalla-widget__formulario"
        aria-label="Clima"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        <CampoCiudad
          invocar={invocar}
          valor={ciudad}
          alCambiar={(v) => {
            setCiudad(v);
            setMensaje('');
          }}
          elegido={lugar}
          alElegir={setLugar}
          mensaje={mensaje || undefined}
        />
        {/* ET03, ET18: deshabilitada sin un lugar elegido; ET12: también mientras se agrega (RT-04). */}
        {/* docs/rediseno.md RD-59: «Agregar» y «Regresar» abajo a la izquierda (84:756, 84:758). */}
        <div className="wg-subpantalla-widget__acciones">
          <Boton principal type="submit" disabled={!lugar || enCurso}>
            Agregar
          </Boton>
          <Boton onClick={alRegresar}>Regresar</Boton>
        </div>
      </form>
    </main>
  );
}
