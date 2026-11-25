import { TEMA_NOMBRE_MAX } from '@/reglas/limites';
import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { textoDelError } from '@/ipc/textoDelError';

// P-TEM-02 Guardar como tema (HE-03-HU02-ET01): ventana emergente sobre Personalización del wallpaper (RT-02),
// con el campo Nombre y las opciones «Guardar» y «Cancelar». La vista repite el largo del nombre; el Núcleo
// vuelve a validar y responde la unicidad y el máximo de temas (D-188).

export interface GuardarComoTemaProps {
  /** Se creó el tema: la pantalla cierra la ventana, muestra el mensaje y lo deja en edición (CA01). */
  alGuardar: (mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra sin guardar y la vista previa conserva sus cambios (CA06). */
  alCancelar: () => void;
}

export function GuardarComoTema({ alGuardar, alCancelar }: GuardarComoTemaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  // CA07: el campo Nombre empieza vacío.
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  // ET10: con el nombre vacío o con solo espacios, «Guardar» deshabilitada y sin mensaje de campo.
  const vacio = nombre.trim() === '';

  const cambiar = (valor: string) => {
    setNombre(valor);
    setMensaje([...valor.trim()].length > TEMA_NOMBRE_MAX ? textos.NOMBRE_DE_TEMA_MUY_LARGO : '');
  };

  const guardar = useCallback(async () => {
    if (vacio) return;
    if ([...nombre.trim()].length > TEMA_NOMBRE_MAX) {
      setMensaje(textos.NOMBRE_DE_TEMA_MUY_LARGO);
      return;
    }
    const r = await invocar('theme_draft_save_as', { name: nombre.trim() });
    if (!r.ok) {
      // ET09: el largo y el duplicado van en el campo Nombre.
      setMensaje(textoDelError(r.error));
      return;
    }
    alGuardar(r.result_message?.message ?? '');
  }, [alGuardar, invocar, nombre, vacio]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  return (
    <VentanaEmergente
      titulo="Guardar como tema"
      alSalir={alCancelar}
      acciones={
        <>
          <Boton onClick={alCancelar}>Cancelar</Boton>
          <Boton principal type="submit" form={idFormulario} disabled={vacio || enCurso}>
            Guardar
          </Boton>
        </>
      }
    >
      <form
        id={idFormulario}
        className="wg-formulario"
        aria-label="Guardar como tema"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        <CampoTexto etiqueta="Nombre" valor={nombre} alCambiar={cambiar} mensaje={mensaje || undefined} />
      </form>
    </VentanaEmergente>
  );
}
