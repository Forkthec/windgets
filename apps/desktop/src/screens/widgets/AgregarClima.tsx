import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// Subpantalla Clima (Widgets > Agregar widget > Clima; HE-04-HU05-ET01): el campo Ciudad y las opciones «Agregar»
// y «Regresar» (RT-03). La vista repite el largo; el Núcleo valida la ciudad con el servicio de clima (ET06) y
// responde si no la encuentra o si ya tiene un widget Clima (D-188).

/** ET10, ET16: de 1 a 100 caracteres. */
const CIUDAD_MAX = 100;

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
  const [mensaje, setMensaje] = useState('');
  const vacia = ciudad.trim() === '';

  const cambiar = (valor: string) => {
    setCiudad(valor);
    setMensaje([...valor.trim()].length > CIUDAD_MAX ? textos.CIUDAD_MUY_LARGA : '');
  };

  const agregar = useCallback(async () => {
    if (vacia) return;
    if ([...ciudad.trim()].length > CIUDAD_MAX) {
      setMensaje(textos.CIUDAD_MUY_LARGA);
      return;
    }
    const r = await invocar('widget_add', { type: 'weather', config: { city: ciudad.trim() } });
    if (!r.ok) {
      // CA04, CA05, CA09: el mensaje va en el campo Ciudad.
      setMensaje(r.error.message);
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, ciudad, invocar, vacia]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main aria-label="Clima">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Clima' },
        ]}
        alRegresar={alRegresar}
      />
      <form
        id={idFormulario}
        className="wg-formulario"
        aria-label="Clima"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        <CampoTexto etiqueta="Ciudad" valor={ciudad} alCambiar={cambiar} mensaje={mensaje || undefined} />
        {/* ET03: deshabilitada sin ciudad; ET12: también mientras se valida la ciudad (RT-04). */}
        <Boton principal type="submit" disabled={vacia || enCurso}>
          Agregar
        </Boton>
      </form>
    </main>
  );
}
