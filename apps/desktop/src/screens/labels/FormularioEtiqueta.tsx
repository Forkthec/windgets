import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type { Label } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { CatalogoColores, type ColorDelCatalogo } from '@/ui/CatalogoColores/CatalogoColores';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';

// P-ETQ-02 Formulario de etiqueta, título «Nueva etiqueta» (HE-08-HU02-ET01, ET02) o «Editar etiqueta» con el
// nombre y el color actuales (HE-08-HU03-ET01, ET02). Ventana emergente sobre la
// pantalla Etiquetas (RT-02). La vista repite las validaciones de campo; el Núcleo vuelve a validar (D-188).

const NOMBRE_MAX = 30;

const CAMPOS = ['name', 'color_id'] as const;
type Campo = (typeof CAMPOS)[number];

// ET03, ET14: nombre de 1 a 30 caracteres y color obligatorio. La unicidad (ET04) la responde el Núcleo.
const REGLAS: Record<Campo, Validador> = {
  name: (v) => {
    if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
    return [...v.trim()].length > NOMBRE_MAX ? textos.NOMBRE_DE_ETIQUETA_MUY_LARGO : undefined;
  },
  color_id: (v) => (estaVacio(v) ? textos.CAMPO_OBLIGATORIO : undefined),
};

export interface FormularioEtiquetaProps {
  /** HE-08-HU03: la etiqueta que se edita; sin ella, se crea una nueva. */
  etiqueta?: Label;
  /** «Guardar» creó la etiqueta: la pantalla cierra el formulario y muestra el mensaje (CA01). */
  alGuardar: (etiqueta: Label, mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra sin crear (CA07, RT-02). */
  alCancelar: () => void;
}

export function FormularioEtiqueta({ etiqueta, alGuardar, alCancelar }: FormularioEtiquetaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  // CA09: el campo Nombre vacío y ningún color elegido (sin valor por defecto, D-162).
  const [valores, setValores] = useState<Record<Campo, string>>({
    name: etiqueta?.name ?? '',
    color_id: etiqueta?.color_id ?? '',
  });
  const [colores, setColores] = useState<ColorDelCatalogo[]>([]);
  const campos = useMensajesDeCampo(CAMPOS, REGLAS);
  const mostrarError = useMostrarError();

  // ET05: el color se toma del catálogo de colores (IPC-CAT-01).
  useEffect(() => {
    let vigente = true;
    void invocar('catalog_list', { kind: 'color' }).then((r) => {
      if (vigente && r.ok) setColores(r.value.map((c) => ({ id: c.id, name: c.name, hex: c.hex ?? '' })));
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  const cambiar = (campo: Campo) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  const guardar = useCallback(async () => {
    if (!campos.validarTodo(valores)) return;
    const datos = { name: valores.name.trim(), color_id: valores.color_id };
    const r = etiqueta
      ? await invocar('label_update', { id: etiqueta.id, ...datos })
      : await invocar('label_create', datos);
    if (!r.ok) {
      if (!campos.mostrarDelNucleo([r.error])) mostrarError(r.error);
      return;
    }
    const porDefecto = etiqueta ? textos.ETIQUETA_ACTUALIZADA : textos.ETIQUETA_CREADA;
    alGuardar(r.value, r.result_message?.message ?? porDefecto);
  }, [alGuardar, campos, etiqueta, invocar, mostrarError, valores]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  return (
    <VentanaEmergente
      titulo={etiqueta ? 'Editar etiqueta' : 'Nueva etiqueta'}
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
        aria-label="Formulario de etiqueta"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        <CampoTexto
          id={campos.ids.name}
          etiqueta="Nombre"
          valor={valores.name}
          alCambiar={cambiar('name')}
          mensaje={campos.mensajes.name}
        />
        <CatalogoColores
          id={campos.ids.color_id}
          etiqueta="Color"
          colores={colores}
          valor={valores.color_id}
          alCambiar={cambiar('color_id')}
          mensaje={campos.mensajes.color_id}
        />
      </form>
    </VentanaEmergente>
  );
}
