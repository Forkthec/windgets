import { useCallback, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { textoDelError } from '@/ipc/textoDelError';

// Subpantalla Texto (Widgets > Agregar widget > Texto; HE-04-HU10-ET01): el campo Texto con el contador
// «<caracteres> / 200» y las opciones «Agregar» y «Regresar» (RT-03). Sin opciones de fuente ni de tamaño: el widget
// usa la tipografía del tema (ET04; D-041).

/** ET02: de 1 a 200 caracteres. */
export const TEXTO_MAX = 200;

export interface AgregarTextoProps {
  alRegresar: () => void;
  alIrAWidgets: () => void;
}

export function AgregarTexto({ alRegresar, alIrAWidgets }: AgregarTextoProps) {
  const { invocar } = useNucleo();
  const [texto, setTexto] = useState('');
  const [mensajeDelNucleo, setMensajeDelNucleo] = useState('');
  const largo = [...texto].length;
  const largoSinEspacios = [...texto.trim()].length;
  const demasiado = largoSinEspacios > TEXTO_MAX;
  // ET03, ET05: deshabilitada vacía, con solo espacios o con más de 200 caracteres.
  const deshabilitada = largoSinEspacios === 0 || demasiado;

  const agregar = useCallback(async () => {
    if (deshabilitada) return;
    const r = await invocar('widget_add', { type: 'text', config: { text: texto.trim() } });
    if (!r.ok) {
      setMensajeDelNucleo(textoDelError(r.error));
      return;
    }
    alIrAWidgets();
  }, [alIrAWidgets, deshabilitada, invocar, texto]);
  const { ejecutar, enCurso } = useEnvioUnico(agregar);

  return (
    <main className="wg-subpantalla-widget" aria-label="Texto">
      <EncabezadoDeRuta
        niveles={[
          { texto: 'Widgets', alElegir: alIrAWidgets },
          { texto: 'Agregar widget', alElegir: alRegresar },
          { texto: 'Texto' },
        ]}
        alRegresar={alRegresar}
        conRegresar={false}
      />
      <div className="wg-subpantalla-widget__formulario">
        <CampoTexto
          etiqueta="Texto"
          valor={texto}
          alCambiar={(v) => {
            setTexto(v);
            setMensajeDelNucleo('');
          }}
          multilinea
          mensaje={demasiado ? textos.TEXTO_MUY_LARGO : mensajeDelNucleo || undefined}
        />
        <p>{`${largo} / ${TEXTO_MAX}`}</p>
      </div>
      {/* docs/rediseno.md RD-59: «Agregar» y «Regresar» abajo a la izquierda (84:864, 84:866). */}
      <div className="wg-subpantalla-widget__acciones">
        <Boton principal disabled={deshabilitada || enCurso} onClick={() => void ejecutar()}>
          Agregar
        </Boton>
        <Boton onClick={alRegresar}>Regresar</Boton>
      </div>
    </main>
  );
}
