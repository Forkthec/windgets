import { CIUDAD_MAX, TEXTO_WIDGET_MAX } from '@/reglas/limites';
import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import type { AppError, GeocodeResult, WidgetItem } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { CampoCiudad } from './CampoCiudad';
import { textoDelError } from '@/ipc/textoDelError';

// Formulario de widget (HE-04-HU12-ET05, ET06; D-202): ventana emergente sobre Widgets (RT-02) con el mismo campo
// que la subpantalla de agregar (Ciudad para Clima y Texto para Texto), precargado, y «Guardar» y «Cancelar».

const MAXIMO: Record<'weather' | 'text', number> = { weather: CIUDAD_MAX, text: TEXTO_WIDGET_MAX };

export interface FormularioDeWidgetProps {
  widget: WidgetItem;
  alGuardar: () => void;
  alCancelar: () => void;
  /** RD-92: el widget que se configura se eliminó en otro computador. */
  alDesaparecer: (error: AppError) => void;
}

export function FormularioDeWidget({
  widget,
  alGuardar,
  alCancelar,
  alDesaparecer,
}: FormularioDeWidgetProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  const esClima = widget.type === 'weather';
  const inicial =
    'city' in widget.config ? widget.config.city : 'text' in widget.config ? widget.config.text : '';
  const [valor, setValor] = useState(inicial);
  // HE-04-HU12 con HE-04-HU05-ET18 (P29): la ciudad nueva se elige de las sugerencias.
  const [lugar, setLugar] = useState<GeocodeResult | null>(null);
  // RD-106: si el texto o la ciudad difieren de lo que tenía al abrir, «×» y Esc piden «Salir sin guardar».
  // La ciudad elegida de las sugerencias parte de «ninguna» al abrir (`lugar` nulo): elegir una es un cambio.
  const hayCambios = valor !== inicial || lugar !== null;
  const [mensaje, setMensaje] = useState('');
  const maximo = MAXIMO[esClima ? 'weather' : 'text'];
  const largo = [...valor.trim()].length;
  const demasiado = largo > maximo;
  const textoLargo = esClima ? textos.CIUDAD_MUY_LARGA : textos.TEXTO_MUY_LARGO;
  // CA03: vacía o con solo espacios, «Guardar» deshabilitada.
  const deshabilitada = esClima ? !lugar : largo === 0 || demasiado;

  const guardar = useCallback(async () => {
    if (esClima ? !lugar : largo === 0) return;
    if (demasiado) {
      setMensaje(textoLargo);
      return;
    }
    const r = await invocar('widget_configure', {
      widget_id: widget.widget_id,
      config: esClima && lugar ? { city: lugar.name, place: lugar } : { text: valor.trim() },
    });
    if (!r.ok) {
      if (r.error.code === 'widget.not_found') return alDesaparecer(r.error);
      // CA04, CA05: el mensaje va en el campo.
      setMensaje(textoDelError(r.error));
      return;
    }
    alGuardar();
  }, [
    alDesaparecer,
    alGuardar,
    demasiado,
    esClima,
    invocar,
    largo,
    lugar,
    textoLargo,
    valor,
    widget.widget_id,
  ]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  return (
    <VentanaEmergente
      titulo="Configurar"
      alSalir={alCancelar}
      hayCambios={hayCambios}
      acciones={
        <>
          <Boton onClick={alCancelar}>Cancelar</Boton>
          <Boton principal type="submit" form={idFormulario} disabled={deshabilitada || enCurso}>
            Guardar
          </Boton>
        </>
      }
    >
      <form
        id={idFormulario}
        className="wg-formulario"
        aria-label="Formulario de widget"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        {esClima ? (
          <CampoCiudad
            invocar={invocar}
            valor={valor}
            alCambiar={(v) => {
              setValor(v);
              setMensaje('');
            }}
            elegido={lugar}
            alElegir={setLugar}
            mensaje={mensaje || undefined}
          />
        ) : (
          <CampoTexto
            etiqueta="Texto"
            valor={valor}
            multilinea
            alCambiar={(v) => {
              setValor(v);
              setMensaje([...v.trim()].length > maximo ? textoLargo : '');
            }}
            mensaje={mensaje || undefined}
          />
        )}
        {!esClima && <p>{`${[...valor].length} / ${maximo}`}</p>}
      </form>
    </VentanaEmergente>
  );
}
