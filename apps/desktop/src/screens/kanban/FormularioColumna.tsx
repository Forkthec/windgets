import { COLUMNA_NOMBRE_MAX } from '@/reglas/limites';
import { useCallback, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type { Column } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { CatalogoColores } from '@/ui/CatalogoColores/CatalogoColores';
import { useColoresDelCatalogo } from '@/ui/CatalogoColores/useColoresDelCatalogo';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';

// P-KAN-02 Formulario de columna. Modo creación, título «Nueva columna» (HE-09-HU03-ET02), y modo edición, título
// «Editar columna» (HE-09-HU04-ET02), con las mismas reglas de nombre (ET09). Ventana emergente sobre el Tablero
// Kanban (RT-02). La vista repite las validaciones de campo; el Núcleo vuelve a validar (D-188).

/** ET06: el gris viene preseleccionado (IPC-COL-02, `color_id` def. 'gray'). */
const COLOR_POR_DEFECTO = 'gray';

const CAMPOS = ['name', 'color_id'] as const;
type Campo = (typeof CAMPOS)[number];

// ET03: obligatorio, de 1 a 30 caracteres. La unicidad (ET04) la responde el Núcleo. El color siempre viene
// elegido (ET06): su único mensaje es el del Núcleo (RD-85).
const REGLAS: Partial<Record<Campo, Validador>> = {
  name: (v) => {
    if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
    return [...v.trim()].length > COLUMNA_NOMBRE_MAX ? textos.NOMBRE_DE_COLUMNA_MUY_LARGO : undefined;
  },
};

export interface FormularioColumnaProps {
  /** La columna que se edita (modo edición); sin ella, el formulario crea una columna. */
  columna?: Column;
  /** «Guardar» creó o editó la columna: el tablero cierra el formulario y muestra el mensaje (CA01). */
  alGuardar: (columna: Column, mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra sin guardar (HE-09-HU03-CA07, HE-09-HU04-CA07; RT-02). */
  alCancelar: () => void;
}

export function FormularioColumna({ columna, alGuardar, alCancelar }: FormularioColumnaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  // Creación: Nombre vacío y gris marcado (HE-09-HU03-CA08, ET06). Edición: el nombre y el color actuales
  // (HE-09-HU04-CA08).
  const [nombre, setNombre] = useState(columna?.name ?? '');
  const [color, setColor] = useState(columna?.color_id ?? COLOR_POR_DEFECTO);
  // ET05: el color se elige del catálogo de colores (IPC-CAT-01).
  const { colores, recargar } = useColoresDelCatalogo(invocar);
  const campos = useMensajesDeCampo(CAMPOS, REGLAS);
  const mostrarError = useMostrarError();

  const guardar = useCallback(async () => {
    if (!campos.validarTodo({ name: nombre, color_id: color })) return;
    const datos = { name: nombre.trim(), color_id: color };
    const r = columna
      ? await invocar('column_update', { id: columna.id, ...datos })
      : await invocar('column_create', datos);
    if (!r.ok) {
      // RD-85: el color se desactivó con la ventana abierta: se vuelven a pedir los colores.
      if (r.error.code === 'color.invalid') recargar();
      if (!campos.mostrarDelNucleo([r.error])) mostrarError(r.error);
      return;
    }
    const porDefecto = columna ? textos.COLUMNA_ACTUALIZADA : textos.COLUMNA_CREADA;
    alGuardar(r.value, r.result_message?.message ?? porDefecto);
  }, [alGuardar, campos, color, columna, invocar, mostrarError, nombre, recargar]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  return (
    <VentanaEmergente
      titulo={columna ? 'Editar columna' : 'Nueva columna'}
      alSalir={alCancelar}
      acciones={
        <>
          <Boton onClick={alCancelar}>Cancelar</Boton>
          <Boton principal type="submit" form={idFormulario} disabled={enCurso}>
            Guardar
          </Boton>
        </>
      }
    >
      <form
        id={idFormulario}
        className="wg-formulario"
        aria-label="Formulario de columna"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        <CampoTexto
          id={campos.ids.name}
          etiqueta="Nombre"
          valor={nombre}
          alCambiar={(v) => {
            setNombre(v);
            campos.alCorregir('name', v);
          }}
          mensaje={campos.mensajes.name}
        />
        <CatalogoColores
          id={campos.ids.color_id}
          etiqueta="Color"
          colores={colores}
          valor={color}
          alCambiar={(v) => {
            setColor(v);
            campos.alCorregir('color_id', v);
          }}
          mensaje={campos.mensajes.color_id}
        />
      </form>
    </VentanaEmergente>
  );
}
