import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type { AppError, Card, CardCreateParams, CardType, Label, Priority } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { Casilla } from '@/ui/Casilla/Casilla';
import { Selector } from '@/ui/Selector/Selector';
import { SelectorFecha } from '@/ui/SelectorFecha/SelectorFecha';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { escribirFecha, fechaIso, hoy, leerFecha } from './fechas';

// P-TAR-02 Formulario de tarjeta, modo creación (HE-07-HU01). Ventana emergente sobre la pantalla de origen
// (ET01, RT-02). La vista repite solo las validaciones de campo para mostrar el mensaje al instante; el Núcleo
// vuelve a validar (D-188).

const TITULO_MAX = 100;
const DESCRIPCION_MAX = 1000;

const CAMPOS = ['title', 'due_date', 'description'] as const;
type Campo = (typeof CAMPOS)[number];

// ET05: los tres tipos, con «Tarea» preseleccionado.
const TIPOS: Array<{ valor: CardType; texto: string }> = [
  { valor: 'task', texto: 'Tarea' },
  { valor: 'reminder', texto: 'Recordatorio' },
  { valor: 'event', texto: 'Evento' },
];

// ET11: Alta, Media y Baja; opcional, así que empieza vacío (ET27). DUDA: HE-07-HU01 el texto de la opción
// vacía no está definido; se usa una opción sin texto.
const PRIORIDADES: Array<{ valor: Priority | ''; texto: string }> = [
  { valor: '', texto: '' },
  { valor: 'high', texto: 'Alta' },
  { valor: 'medium', texto: 'Media' },
  { valor: 'low', texto: 'Baja' },
];

const VALIDADORES: Record<Campo, Validador> = {
  // ET06, ET07: obligatorio, de 1 a 100 caracteres; solo espacios cuenta como vacío.
  title: (v) => {
    if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
    return [...v.trim()].length > TITULO_MAX ? textos.TITULO_MUY_LARGO : undefined;
  },
  // ET08, ET09: obligatoria, DD/MM/AAAA, que exista y no anterior a hoy.
  due_date: (v) => {
    if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
    const fecha = leerFecha(v);
    if (!fecha) return textos.FECHA_INVALIDA;
    return fecha < hoy() ? textos.FECHA_LIMITE_ANTERIOR_A_HOY : undefined;
  },
  // ET10: opcional, hasta 1000 caracteres.
  description: (v) => ([...v].length > DESCRIPCION_MAX ? textos.DESCRIPCION_MUY_LARGA : undefined),
};

interface Valores {
  type: CardType;
  title: string;
  due_date: string;
  description: string;
  priority: Priority | '';
  label_ids: string[];
}

// ET25, ET27: Tipo en «Tarea» y los demás campos vacíos.
const VACIO: Valores = {
  type: 'task',
  title: '',
  due_date: '',
  description: '',
  priority: '',
  label_ids: [],
};

export interface FormularioTarjetaProps {
  /** «Guardar» creó la tarjeta: la pantalla cierra el formulario y muestra el mensaje de resultado. */
  alCrear: (tarjeta: Card, mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra sin crear la tarjeta (CA11, RT-02). */
  alCancelar: () => void;
}

export function FormularioTarjeta({ alCrear, alCancelar }: FormularioTarjetaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  const [valores, setValores] = useState<Valores>(VACIO);
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  const campos = useMensajesDeCampo(CAMPOS, VALIDADORES);

  // ET12: el campo Etiquetas ofrece solo las etiquetas creadas (sus reglas están en HE-07-HU02).
  useEffect(() => {
    let vigente = true;
    void invocar('label_list', {}).then((r) => {
      if (vigente && r.ok) setEtiquetas(r.value);
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  const cambiar = (campo: Campo) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  const marcarEtiqueta = (id: string, marcada: boolean) =>
    setValores((v) => ({
      ...v,
      label_ids: marcada ? [...v.label_ids, id] : v.label_ids.filter((e) => e !== id),
    }));

  const fallo = useCallback(
    (error: AppError) => {
      if (error.field) campos.mostrarDelNucleo([error]);
    },
    [campos],
  );

  const guardar = useCallback(async () => {
    if (!campos.validarTodo(valores)) return;
    const fecha = leerFecha(valores.due_date);
    if (!fecha) return;
    const params: CardCreateParams = {
      type: valores.type,
      title: valores.title.trim(),
      due_date: fechaIso(fecha),
    };
    if (!estaVacio(valores.description)) params.description = valores.description;
    if (valores.priority) params.priority = valores.priority;
    if (valores.label_ids.length > 0) params.label_ids = valores.label_ids;
    const r = await invocar('card_create', params);
    if (!r.ok) return fallo(r.error);
    alCrear(r.value, r.result_message?.message ?? textos.TARJETA_CREADA);
  }, [alCrear, campos, fallo, invocar, valores]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  const fechaElegida = useMemo(() => leerFecha(valores.due_date), [valores.due_date]);

  return (
    <VentanaEmergente
      titulo="Formulario de tarjeta"
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
        aria-label="Formulario de tarjeta"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        <Selector
          etiqueta="Tipo"
          opciones={TIPOS}
          valor={valores.type}
          alCambiar={(tipo) => setValores((v) => ({ ...v, type: tipo as CardType }))}
        />
        <CampoTexto
          id={campos.ids.title}
          etiqueta="Título"
          valor={valores.title}
          alCambiar={cambiar('title')}
          mensaje={campos.mensajes.title}
        />
        <CampoTexto
          id={campos.ids.due_date}
          etiqueta="Fecha límite"
          valor={valores.due_date}
          alCambiar={cambiar('due_date')}
          mensaje={campos.mensajes.due_date}
        />
        {/* ET04, ET27: el selector de fecha escribe la fecha elegida en DD/MM/AAAA. */}
        <SelectorFecha
          etiqueta="Selector de fecha"
          etiquetaVisible={false}
          valor={fechaElegida}
          alCambiar={(fecha) => cambiar('due_date')(fecha ? escribirFecha(fecha) : '')}
        />
        <CampoTexto
          id={campos.ids.description}
          etiqueta="Descripción"
          multilinea
          valor={valores.description}
          alCambiar={cambiar('description')}
          mensaje={campos.mensajes.description}
        />
        <Selector
          etiqueta="Prioridad"
          opciones={PRIORIDADES}
          valor={valores.priority}
          alCambiar={(p) => setValores((v) => ({ ...v, priority: p as Priority | '' }))}
        />
        <div className="wg-campo" role="group" aria-label="Etiquetas">
          <span className="wg-campo__etiqueta">Etiquetas</span>
          {etiquetas.map((e) => (
            <Casilla
              key={e.id}
              etiqueta={e.name}
              marcada={valores.label_ids.includes(e.id)}
              alCambiar={(marcada) => marcarEtiqueta(e.id, marcada)}
            />
          ))}
        </div>
      </form>
    </VentanaEmergente>
  );
}
