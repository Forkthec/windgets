import { TEMA_NOMBRE_MAX } from '@/reglas/limites';
import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import type { AppError, ThemeSummary } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { textoDelError } from '@/ipc/textoDelError';

// Renombrar tema (HE-03-HU04-ET01): ventana emergente sobre Temas (RT-02), con el campo Nombre con el nombre
// actual y las opciones «Guardar» y «Cancelar». La vista repite el largo; el Núcleo vuelve a validar y responde
// el duplicado (D-188).

export interface RenombrarTemaProps {
  tema: ThemeSummary;
  /** Se renombró: la pantalla cierra la ventana y muestra el mensaje (CA01, CA06). */
  alGuardar: (mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra y conserva el nombre original (CA05). */
  alCancelar: () => void;
  /** El tema ya no existe (RD-86): la pantalla cierra la ventana, lo dice y vuelve a leer la lista. */
  alDesaparecer: (error: AppError) => void;
}

export function RenombrarTema({ tema, alGuardar, alCancelar, alDesaparecer }: RenombrarTemaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  // CA07: el campo Nombre con el nombre actual.
  const [nombre, setNombre] = useState(tema.name);
  const [mensaje, setMensaje] = useState('');
  // ET05: vacío o con solo espacios, «Guardar» deshabilitada.
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
    const r = await invocar('theme_rename', { theme_id: tema.id, name: nombre.trim() });
    if (!r.ok) {
      if (r.error.code === 'theme.not_found') return alDesaparecer(r.error);
      // ET05: el largo y el duplicado van en el campo Nombre.
      setMensaje(textoDelError(r.error));
      return;
    }
    alGuardar(r.result_message?.message ?? '');
  }, [alDesaparecer, alGuardar, invocar, nombre, tema.id, vacio]);
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
