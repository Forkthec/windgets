import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type {
  AppError,
  Card,
  CardCreateParams,
  CardDetail,
  CardPatch,
  CardType,
  Label,
  Priority,
  Result,
} from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { Casilla } from '@/ui/Casilla/Casilla';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { Selector } from '@/ui/Selector/Selector';
import { SelectorFecha } from '@/ui/SelectorFecha/SelectorFecha';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { FormularioEtiqueta } from '../labels/FormularioEtiqueta';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { escribirFecha, fechaIso, fechaVisible, hoy, leerFecha } from './fechas';

// P-TAR-02 Formulario de tarjeta. Modo creación (HE-07-HU01) y modo edición (HE-07-HU04, con las mismas reglas
// de campos, ET04). Ventana emergente sobre la pantalla de origen (RT-02). La vista repite solo las validaciones
// de campo para mostrar el mensaje al instante; el Núcleo vuelve a validar (D-188).

const TITULO_MAX = 100;
/** Etiquetas por tarjeta (HE-07-HU02-ET04). */
const ETIQUETAS_MAX = 5;
const DESCRIPCION_MAX = 1000;

const CAMPOS = ['title', 'due_date', 'description'] as const;
type Campo = (typeof CAMPOS)[number];

// HE-07-HU01-ET05: los tres tipos, con «Tarea» preseleccionado.
const TIPOS: Array<{ valor: CardType; texto: string }> = [
  { valor: 'task', texto: 'Tarea' },
  { valor: 'reminder', texto: 'Recordatorio' },
  { valor: 'event', texto: 'Evento' },
];

// HE-07-HU01-ET11: Alta, Media y Baja; opcional, así que empieza vacío (ET27). DUDA: HE-07-HU01 el texto de la
// opción vacía no está definido; se usa una opción sin texto.
const PRIORIDADES: Array<{ valor: Priority | ''; texto: string }> = [
  { valor: '', texto: '' },
  { valor: 'high', texto: 'Alta' },
  { valor: 'medium', texto: 'Media' },
  { valor: 'low', texto: 'Baja' },
];

/**
 * Reglas de campo (HE-07-HU01-ET06 a ET10). `fechaOriginal` es la fecha límite de la tarjeta que se edita:
 * sin cambiarla, no se compara con hoy (HE-07-HU04-ET08).
 */
function validadores(fechaOriginal?: string): Record<Campo, Validador> {
  return {
    title: (v) => {
      if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
      return [...v.trim()].length > TITULO_MAX ? textos.TITULO_MUY_LARGO : undefined;
    },
    due_date: (v) => {
      if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
      const fecha = leerFecha(v);
      if (!fecha) return textos.FECHA_INVALIDA;
      if (fechaOriginal !== undefined && fechaIso(fecha) === fechaOriginal) return undefined;
      return fecha < hoy() ? textos.FECHA_LIMITE_ANTERIOR_A_HOY : undefined;
    },
    description: (v) => ([...v].length > DESCRIPCION_MAX ? textos.DESCRIPCION_MUY_LARGA : undefined),
  };
}

interface Valores {
  type: CardType;
  title: string;
  due_date: string;
  description: string;
  priority: Priority | '';
  label_ids: string[];
}

// HE-07-HU01-ET25, ET27: Tipo en «Tarea» y los demás campos vacíos.
const VACIO: Valores = {
  type: 'task',
  title: '',
  due_date: '',
  description: '',
  priority: '',
  label_ids: [],
};

/** HE-07-HU04-ET02: en modo edición, los datos actuales de la tarjeta. */
function valoresDe(tarjeta: CardDetail): Valores {
  return {
    type: tarjeta.type,
    title: tarjeta.title,
    due_date: fechaVisible(tarjeta.due_date),
    description: tarjeta.description ?? '',
    priority: tarjeta.priority ?? '',
    label_ids: [...tarjeta.label_ids],
  };
}

export interface FormularioTarjetaProps {
  /** La tarjeta que se edita (modo edición); sin ella, el formulario crea una tarjeta. */
  tarjeta?: CardDetail;
  /** «Guardar» creó o editó la tarjeta: la pantalla cierra el formulario y muestra el mensaje de resultado. */
  alGuardar: (tarjeta: Card, mensaje: string) => void;
  /** «Cancelar» (o Esc): cierra sin guardar (HE-07-HU01-CA11, HE-07-HU04-CA09; RT-02). */
  alCancelar: () => void;
  /** La tarjeta que se edita ya no existe (HE-07-HU04-CA11). */
  alNoExistir?: (mensaje: string) => void;
  /** Fecha límite ya diligenciada al crear desde un día del calendario, AAAA-MM-DD (HE-10-HU04-ET02). */
  fechaLimite?: string;
}

export function FormularioTarjeta({
  tarjeta,
  alGuardar,
  alCancelar,
  alNoExistir,
  fechaLimite,
}: FormularioTarjetaProps) {
  const { invocar } = useNucleo();
  const idFormulario = useId();
  const [valores, setValores] = useState<Valores>(() =>
    tarjeta ? valoresDe(tarjeta) : { ...VACIO, due_date: fechaLimite ? fechaVisible(fechaLimite) : '' },
  );
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const mostrarResultado = useMensajeDeResultado();
  const reglas = useMemo(() => validadores(tarjeta?.due_date), [tarjeta?.due_date]);
  const campos = useMensajesDeCampo(CAMPOS, reglas);

  // HE-07-HU01-ET12; HE-07-HU02-ET03, ET10: solo las etiquetas creadas, en el orden del Núcleo (A a la Z).
  const leerEtiquetas = useCallback(async () => {
    const r = await invocar('label_list', {});
    if (r.ok) setEtiquetas(r.value);
  }, [invocar]);
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
      else if (error.code === 'card.not_found') alNoExistir?.(error.message);
    },
    [alNoExistir, campos],
  );

  const guardar = useCallback(async () => {
    if (!campos.validarTodo(valores)) return;
    const fecha = leerFecha(valores.due_date);
    if (!fecha) return;
    let r: Result<Card>;
    if (tarjeta) {
      // Edición: se envían todos los campos; vacío quita la descripción o la prioridad.
      const patch: CardPatch = {
        type: valores.type,
        title: valores.title.trim(),
        due_date: fechaIso(fecha),
        description: estaVacio(valores.description) ? null : valores.description,
        priority: valores.priority || null,
        label_ids: valores.label_ids,
      };
      r = await invocar('card_update', { id: tarjeta.id, patch });
    } else {
      const params: CardCreateParams = {
        type: valores.type,
        title: valores.title.trim(),
        due_date: fechaIso(fecha),
      };
      if (!estaVacio(valores.description)) params.description = valores.description;
      if (valores.priority) params.priority = valores.priority;
      if (valores.label_ids.length > 0) params.label_ids = valores.label_ids;
      r = await invocar('card_create', params);
    }
    if (!r.ok) return fallo(r.error);
    const porDefecto = tarjeta ? textos.TARJETA_ACTUALIZADA : textos.TARJETA_CREADA;
    alGuardar(r.value, r.result_message?.message ?? porDefecto);
  }, [alGuardar, campos, fallo, invocar, tarjeta, valores]);
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
        className="wg-formulario wg-formulario--tarjeta"
        aria-label="Formulario de tarjeta"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        {/* docs/rediseno.md RD-51 (Figma 84:550): en dos columnas, Título y Tipo, Fecha límite y Prioridad,
            Etiquetas y Descripción. */}
        <CampoTexto
          id={campos.ids.title}
          etiqueta="Título"
          valor={valores.title}
          alCambiar={cambiar('title')}
          mensaje={campos.mensajes.title}
        />
        <Selector
          etiqueta="Tipo"
          opciones={TIPOS}
          valor={valores.type}
          alCambiar={(tipo) => setValores((v) => ({ ...v, type: tipo as CardType }))}
        />
        <div className="wg-formulario__celda">
          <CampoTexto
            id={campos.ids.due_date}
            etiqueta="Fecha límite"
            valor={valores.due_date}
            alCambiar={cambiar('due_date')}
            mensaje={campos.mensajes.due_date}
          />
          {/* HE-07-HU01-ET04, ET27: el selector de fecha escribe la fecha elegida en DD/MM/AAAA. */}
          <SelectorFecha
            etiqueta="Selector de fecha"
            etiquetaVisible={false}
            valor={fechaElegida}
            alCambiar={(fecha) => cambiar('due_date')(fecha ? escribirFecha(fecha) : '')}
          />
        </div>
        <Selector
          etiqueta="Prioridad"
          opciones={PRIORIDADES}
          valor={valores.priority}
          alCambiar={(p) => setValores((v) => ({ ...v, priority: p as Priority | '' }))}
        />
        {/* HE-07-HU02-ET01: lista desplegable con las etiquetas creadas; las asignadas se ven en el campo. */}
        <div className="wg-campo" role="group" aria-label="Etiquetas">
          <span className="wg-campo__etiqueta">Etiquetas</span>
          <button
            type="button"
            className="wg-campo__entrada"
            aria-expanded={listaAbierta}
            aria-label="Etiquetas asignadas"
            onClick={() => setListaAbierta((a) => !a)}
          >
            {etiquetas
              .filter((e) => valores.label_ids.includes(e.id))
              .map((e) => e.name)
              .join(', ')}
          </button>
          {listaAbierta &&
            (etiquetas.length === 0 ? (
              // ET07: estado vacío con «Nueva etiqueta».
              <span className="wg-fila">
                <span>Aún no tienes etiquetas.</span>
                <Boton onClick={() => setCreandoEtiqueta(true)}>Nueva etiqueta</Boton>
              </span>
            ) : (
              <div className="wg-lista" role="list" aria-label="Lista de etiquetas">
                {etiquetas.map((e) => {
                  const marcada = valores.label_ids.includes(e.id);
                  return (
                    <span key={e.id} role="listitem">
                      <Casilla
                        etiqueta={e.name}
                        marcada={marcada}
                        // ET04, ET06: con 5 asignadas, las demás quedan deshabilitadas.
                        deshabilitada={!marcada && valores.label_ids.length >= ETIQUETAS_MAX}
                        alCambiar={(m) => marcarEtiqueta(e.id, m)}
                      />
                    </span>
                  );
                })}
                {valores.label_ids.length >= ETIQUETAS_MAX && (
                  <span className="wg-motivo">{textos.MAXIMO_ETIQUETAS}</span>
                )}
              </div>
            ))}
        </div>
        <CampoTexto
          id={campos.ids.description}
          etiqueta="Descripción"
          multilinea
          valor={valores.description}
          alCambiar={cambiar('description')}
          mensaje={campos.mensajes.description}
        />
      </form>
      {/* ET08, ET09: el Formulario de etiqueta se abre encima; al guardar o cancelar, este formulario sigue
          abierto con sus datos. */}
      {creandoEtiqueta && (
        <FormularioEtiqueta
          alCancelar={() => setCreandoEtiqueta(false)}
          alGuardar={(_, mensaje) => {
            setCreandoEtiqueta(false);
            mostrarResultado(mensaje);
            void leerEtiquetas();
          }}
        />
      )}
    </VentanaEmergente>
  );
}
