import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import type { WidgetItem } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// Formulario de widget (HE-04-HU12-ET05, ET06; D-202): ventana emergente sobre Widgets (RT-02) con el mismo campo
// que la subpantalla de agregar (Ciudad para Clima y Texto para Texto), precargado, y «Guardar» y «Cancelar».

const MAXIMO: Record<'weather' | 'text', number> = { weather: 100, text: 200 };

export interface FormularioDeWidgetProps {
  widget: WidgetItem;
  alGuardar: () => void;
  alCancelar: () => void;
}

export function FormularioDeWidget({ widget, alGuardar, alCancelar }: FormularioDeWidgetProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  const esClima = widget.type === 'weather';
  const inicial =
    'city' in widget.config ? widget.config.city : 'text' in widget.config ? widget.config.text : '';
  const [valor, setValor] = useState(inicial);
  const [mensaje, setMensaje] = useState('');
  const maximo = MAXIMO[esClima ? 'weather' : 'text'];
  const largo = [...valor.trim()].length;
  const demasiado = largo > maximo;
  const textoLargo = esClima ? textos.CIUDAD_MUY_LARGA : textos.TEXTO_MUY_LARGO;
  // CA03: vacía o con solo espacios, «Guardar» deshabilitada.
  const deshabilitada = largo === 0 || (!esClima && demasiado);

  const guardar = useCallback(async () => {
    if (largo === 0) return;
    if (demasiado) {
      setMensaje(textoLargo);
      return;
    }
    const r = await invocar('widget_configure', {
      widget_id: widget.widget_id,
      config: esClima ? { city: valor.trim() } : { text: valor.trim() },
    });
    if (!r.ok) {
      // CA04, CA05: el mensaje va en el campo.
      setMensaje(r.error.message);
      return;
    }
    alGuardar();
  }, [alGuardar, demasiado, esClima, invocar, largo, textoLargo, valor, widget.widget_id]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  return (
    <VentanaEmergente
      titulo="Configurar"
      alSalir={alCancelar}
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
        <CampoTexto
          etiqueta={esClima ? 'Ciudad' : 'Texto'}
          valor={valor}
          multilinea={!esClima}
          alCambiar={(v) => {
            setValor(v);
            setMensaje([...v.trim()].length > maximo ? textoLargo : '');
          }}
          mensaje={mensaje || undefined}
        />
        {!esClima && <p>{`${[...valor].length} / ${maximo}`}</p>}
      </form>
    </VentanaEmergente>
  );
}
