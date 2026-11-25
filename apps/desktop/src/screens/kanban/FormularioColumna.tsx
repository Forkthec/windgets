import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type { Column } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { CatalogoColores, type ColorDelCatalogo } from '@/ui/CatalogoColores/CatalogoColores';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';

// P-KAN-02 Formulario de columna. Modo creación, título «Nueva columna» (HE-09-HU03-ET02), y modo edición, título
// «Editar columna» (HE-09-HU04-ET02), con las mismas reglas de nombre (ET09). Ventana emergente sobre el Tablero
// Kanban (RT-02). La vista repite las validaciones de campo; el Núcleo vuelve a validar (D-188).

const NOMBRE_MAX = 30;
/** ET06: el gris viene preseleccionado (IPC-COL-02, `color_id` def. 'gray'). */
const COLOR_POR_DEFECTO = 'gray';

const CAMPOS = ['name'] as const;
type Campo = (typeof CAMPOS)[number];

// ET03: obligatorio, de 1 a 30 caracteres. La unicidad (ET04) la responde el Núcleo.
const REGLAS: Record<Campo, Validador> = {
  name: (v) => {
    if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
    return [...v.trim()].length > NOMBRE_MAX ? textos.NOMBRE_DE_COLUMNA_MUY_LARGO : undefined;
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
  const [colores, setColores] = useState<ColorDelCatalogo[]>([]);
  const campos = useMensajesDeCampo(CAMPOS, REGLAS);
  const mostrarError = useMostrarError();

  // ET05: el color se elige del catálogo de colores (IPC-CAT-01).
  useEffect(() => {
    let vigente = true;
    void invocar('catalog_list', { kind: 'color' }).then((r) => {
      if (vigente && r.ok) setColores(r.value.map((c) => ({ id: c.id, name: c.name, hex: c.hex ?? '' })));
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  const guardar = useCallback(async () => {
    if (!campos.validarTodo({ name: nombre })) return;
    const datos = { name: nombre.trim(), color_id: color };
    const r = columna
      ? await invocar('column_update', { id: columna.id, ...datos })
      : await invocar('column_create', datos);
    if (!r.ok) {
      if (!campos.mostrarDelNucleo([r.error])) mostrarError(r.error);
      return;
    }
    const porDefecto = columna ? textos.COLUMNA_ACTUALIZADA : textos.COLUMNA_CREADA;
    alGuardar(r.value, r.result_message?.message ?? porDefecto);
  }, [alGuardar, campos, color, columna, invocar, mostrarError, nombre]);
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
        <CatalogoColores etiqueta="Color" colores={colores} valor={color} alCambiar={setColor} />
      </form>
    </VentanaEmergente>
  );
}
