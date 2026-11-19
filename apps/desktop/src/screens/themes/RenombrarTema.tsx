import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import type { ThemeSummary } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// Renombrar tema (HE-03-HU04-ET01): ventana emergente sobre Temas (RT-02), con el campo Nombre con el nombre
// actual y las opciones «Guardar» y «Cancelar». La vista repite el largo; el Núcleo vuelve a validar y responde
// el duplicado (D-188).

/** ET03: de 1 a 40 caracteres, como en «Guardar como tema». */
const NOMBRE_MAX = 40;

export interface RenombrarTemaProps {
  tema: ThemeSummary;
  /** Se renombró: la pantalla cierra la ventana y muestra el mensaje (CA01, CA06). */
  alGuardar: (mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra y conserva el nombre original (CA05). */
  alCancelar: () => void;
}

export function RenombrarTema({ tema, alGuardar, alCancelar }: RenombrarTemaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  // CA07: el campo Nombre con el nombre actual.
  const [nombre, setNombre] = useState(tema.name);
  const [mensaje, setMensaje] = useState('');
  // ET05: vacío o con solo espacios, «Guardar» deshabilitada.
  const vacio = nombre.trim() === '';

  const cambiar = (valor: string) => {
    setNombre(valor);
    setMensaje([...valor.trim()].length > NOMBRE_MAX ? textos.NOMBRE_DE_TEMA_MUY_LARGO : '');
  };

  const guardar = useCallback(async () => {
    if (vacio) return;
    if ([...nombre.trim()].length > NOMBRE_MAX) {
      setMensaje(textos.NOMBRE_DE_TEMA_MUY_LARGO);
      return;
    }
    const r = await invocar('theme_rename', { theme_id: tema.id, name: nombre.trim() });
    if (!r.ok) {
      // ET05: el largo y el duplicado van en el campo Nombre.
      setMensaje(r.error.message);
      return;
    }
    alGuardar(r.result_message?.message ?? '');
  }, [alGuardar, invocar, nombre, tema.id, vacio]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  return (
    <VentanaEmergente
      titulo="Renombrar tema"
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
        aria-label="Renombrar tema"
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
