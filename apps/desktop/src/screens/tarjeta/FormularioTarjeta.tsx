import { TARJETA_DESCRIPCION_MAX, TARJETA_ETIQUETAS_MAX, TARJETA_TITULO_MAX } from '@/reglas/limites';
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
import { Segmentado } from '@/ui/Segmentado/Segmentado';
import { useMensajeDeResultado, useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';
import { Selector } from '@/ui/Selector/Selector';
import { SelectorFecha } from '@/ui/SelectorFecha/SelectorFecha';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';
import { FormularioEtiqueta } from '../labels/FormularioEtiqueta';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { escribirFecha, fechaIso, fechaVisible, hoy, leerFecha } from './fechas';
import { textoDelError } from '@/ipc/textoDelError';

// docs/rediseno.md RD-75 (rediseno_final_prototipos.md §3.8 y §6.7; rediseno_final_backend.md §4.5): Tipo y Prioridad
// como controles segmentados («Sin prioridad» elegido por defecto), la fecha con un calendario flotante sin días
// pasados, las etiquetas en un desplegable con chips de color y el bloque horario opcional (D-20).

// P-TAR-02 Formulario de tarjeta. Modo creación (HE-07-HU01) y modo edición (HE-07-HU04, con las mismas reglas
// de campos, ET04). Ventana emergente sobre la pantalla de origen (RT-02). La vista repite solo las validaciones
// de campo para mostrar el mensaje al instante; el Núcleo vuelve a validar (D-188).

const CAMPOS = ['title', 'due_date', 'description', 'block_date', 'block_hour'] as const;
type Campo = (typeof CAMPOS)[number];

// HE-07-HU01-ET05: los tres tipos, con «Tarea» preseleccionado.
const TIPOS: Array<{ valor: CardType; texto: string }> = [
  { valor: 'task', texto: 'Tarea' },
  { valor: 'reminder', texto: 'Recordatorio' },
  { valor: 'event', texto: 'Evento' },
];

// HE-07-HU01-ET11: Alta, Media y Baja; opcional (ET27). RD-75 (§3.8): «Sin prioridad» elegido por defecto.
const PRIORIDADES: Array<{ valor: Priority | ''; texto: string }> = [
  { valor: '', texto: 'Sin prioridad' },
  { valor: 'high', texto: 'Alta' },
  { valor: 'medium', texto: 'Media' },
  { valor: 'low', texto: 'Baja' },
];

/**
 * Reglas de campo (HE-07-HU01-ET06 a ET10). `fechaOriginal` es la fecha límite de la tarjeta que se edita:
 * sin cambiarla, no se compara con hoy (HE-07-HU04-ET08). `bloque` es lo diligenciado en el bloque horario: su
 * fecha y su hora van juntas (D-20).
 */
function validadores(
  fechaOriginal: string | undefined,
  bloque: { fecha: string; hora: string },
): Record<Campo, Validador> {
  return {
    title: (v) => {
      if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
      return [...v.trim()].length > TARJETA_TITULO_MAX ? textos.TITULO_MUY_LARGO : undefined;
    },
    due_date: (v) => {
      if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
      const fecha = leerFecha(v);
      if (!fecha) return textos.FECHA_INVALIDA;
      if (fechaOriginal !== undefined && fechaIso(fecha) === fechaOriginal) return undefined;
      return fecha < hoy() ? textos.FECHA_LIMITE_ANTERIOR_A_HOY : undefined;
    },
    description: (v) => ([...v].length > TARJETA_DESCRIPCION_MAX ? textos.DESCRIPCION_MUY_LARGA : undefined),
    // D-20: el bloque horario es opcional; si tiene fecha u hora, necesita las dos y la fecha debe ser válida. Van
    // aquí para que salgan a la vez que los demás mensajes (docs/rediseno.md RD-91). Que no sea pasado ni posterior a
    // la fecha límite lo valida el Núcleo (`time_block.past`, `time_block.after_due_date`).
    block_date: (v) => {
      if (estaVacio(v)) return bloque.hora ? textos.CAMPO_OBLIGATORIO : undefined;
      return leerFecha(v) ? undefined : textos.FECHA_INVALIDA;
    },
    block_hour: (v) => (!v && !estaVacio(bloque.fecha) ? textos.CAMPO_OBLIGATORIO : undefined),
  };
}

interface Valores {
  type: CardType;
  title: string;
  due_date: string;
  description: string;
  priority: Priority | '';
  label_ids: string[];
  /** D-20: el bloque horario, DD/MM/AAAA y la hora de inicio («» = sin bloque horario). */
  block_date: string;
  block_hour: string;
}

// HE-07-HU01-ET25, ET27: Tipo en «Tarea» y los demás campos vacíos.
const VACIO: Valores = {
  type: 'task',
  title: '',
  due_date: '',
  description: '',
  priority: '',
  label_ids: [],
  block_date: '',
  block_hour: '',
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
    block_date: tarjeta.scheduled_date ? fechaVisible(tarjeta.scheduled_date) : '',
    block_hour: tarjeta.scheduled_hour === null ? '' : String(tarjeta.scheduled_hour),
  };
}

const CAMPOS_DE_TEXTO = ['title', 'due_date', 'description', 'block_date', 'block_hour'] as const;

/** Las dos listas tienen las mismas etiquetas, sin importar el orden. */
function mismasEtiquetas(unas: string[], otras: string[]): boolean {
  const conjunto = new Set(unas);
  return conjunto.size === new Set(otras).size && otras.every((id) => conjunto.has(id));
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
  // RD-106: lo que tenía al abrir; si lo escrito difiere, «×» y Esc piden «Salir sin guardar».
  const [inicial] = useState(valores);
  const hayCambios =
    CAMPOS_DE_TEXTO.some((c) => valores[c] !== inicial[c]) ||
    valores.type !== inicial.type ||
    valores.priority !== inicial.priority ||
    !mismasEtiquetas(valores.label_ids, inicial.label_ids);
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const mostrarResultado = useMensajeDeResultado();
  const mostrarError = useMostrarError();
  const reglas = useMemo(
    () => validadores(tarjeta?.due_date, { fecha: valores.block_date, hora: valores.block_hour }),
    [tarjeta?.due_date, valores.block_date, valores.block_hour],
  );
  const campos = useMensajesDeCampo(CAMPOS, reglas);
  // RD-92 y RD-96: el mensaje del Núcleo para el campo Etiquetas.
  const [avisoDeEtiquetas, setAvisoDeEtiquetas] = useState('');
  const idDelAviso = `${idFormulario}-aviso-de-etiquetas`;

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

  // RD-92: una etiqueta elegida se eliminó en otro computador: se vuelve a leer la lista y se quita de la
  // selección, porque ya no aparece para desmarcarla.
  const soltarEtiquetasEliminadas = useCallback(async () => {
    const r = await invocar('label_list', {});
    if (!r.ok) return;
    setEtiquetas(r.value);
    const quedan = new Set(r.value.map((e) => e.id));
    setValores((v) => ({ ...v, label_ids: v.label_ids.filter((id) => quedan.has(id)) }));
  }, [invocar]);

  const cambiar = (campo: Campo) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  const marcarEtiqueta = (id: string, marcada: boolean) => {
    setAvisoDeEtiquetas('');
    setValores((v) => ({
      ...v,
      label_ids: marcada ? [...v.label_ids, id] : v.label_ids.filter((e) => e !== id),
    }));
  };

  const fallo = useCallback(
    (error: AppError) => {
      // RD-96: una tarjeta puede traer más etiquetas que el máximo; se avisa en su campo y se desmarcan.
      if (error.code === 'labels.not_found' || error.code === 'labels.too_many') {
        setAvisoDeEtiquetas(textoDelError(error));
        document.getElementById(`${idDelAviso}-campo`)?.focus();
        if (error.code === 'labels.not_found') void soltarEtiquetasEliminadas();
        return;
      }
      if (error.field && campos.mostrarDelNucleo([error])) return;
      if (error.code === 'card.not_found' && alNoExistir) alNoExistir(textoDelError(error));
      else mostrarError(error);
    },
    [alNoExistir, campos, idDelAviso, mostrarError, soltarEtiquetasEliminadas],
  );

  const guardar = useCallback(async () => {
    setAvisoDeEtiquetas('');
    if (!campos.validarTodo(valores)) return;
    const fecha = leerFecha(valores.due_date);
    if (!fecha) return;
    let r: Result<Card>;
    if (tarjeta) {
      // Edición: se envían todos los campos; vacío quita la descripción o la prioridad. RD-96: las etiquetas solo
      // si cambiaron, para que una tarjeta con más que el máximo guarde los demás datos sin tocarlas.
      const patch: CardPatch = {
        type: valores.type,
        title: valores.title.trim(),
        due_date: fechaIso(fecha),
        description: estaVacio(valores.description) ? null : valores.description,
        priority: valores.priority || null,
      };
      if (!mismasEtiquetas(valores.label_ids, tarjeta.label_ids)) patch.label_ids = valores.label_ids;
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
    // D-20 (rediseno_final_backend.md §4.5): después de guardar la tarjeta, el bloque horario con
    // `card_assign_time_block` o `card_unassign_time_block` si cambió. La interfaz los muestra como una sola
    // operación; si el bloque falla, la tarjeta ya quedó guardada y se muestra el error del bloque.
    const antes = tarjeta?.scheduled_date ? `${tarjeta.scheduled_date} ${tarjeta.scheduled_hour}` : '';
    const diaDelBloque = leerFecha(valores.block_date);
    const despues =
      diaDelBloque && valores.block_hour ? `${fechaIso(diaDelBloque)} ${valores.block_hour}` : '';
    let tarjetaFinal = r.value;
    let errorDelBloque: string | null = null;
    if (antes !== despues) {
      const b =
        diaDelBloque && valores.block_hour
          ? await invocar('card_assign_time_block', {
              card_id: r.value.id,
              date: fechaIso(diaDelBloque),
              hour: Number(valores.block_hour),
            })
          : await invocar('card_unassign_time_block', { card_id: r.value.id });
      if (b.ok) tarjetaFinal = b.value;
      else errorDelBloque = b.error.message || textos.SERVICIO_NO_DISPONIBLE;
    }
    alGuardar(tarjetaFinal, r.result_message?.message ?? porDefecto);
    if (errorDelBloque) mostrarResultado(errorDelBloque, 'error');
  }, [alGuardar, campos, fallo, invocar, mostrarResultado, tarjeta, valores]);
  const { ejecutar, enCurso } = useEnvioUnico(guardar);

  const fechaElegida = useMemo(() => leerFecha(valores.due_date), [valores.due_date]);
  const elegidas = etiquetas.filter((e) => valores.label_ids.includes(e.id));
  // D-20: «Sin bloque horario» y las horas en punto de 00:00 a 23:00; si el bloque es hoy, las horas que ya
  // pasaron quedan deshabilitadas (el Núcleo valida `time_block.past`).
  const horasDelBloque = useMemo(() => {
    const esHoy = valores.block_date === escribirFecha(hoy());
    const ahora = new Date().getHours();
    return [
      { valor: '', texto: 'Sin bloque horario' },
      ...Array.from({ length: 24 }, (_, h) => ({
        valor: String(h),
        texto: `${String(h).padStart(2, '0')}:00`,
        deshabilitada: esHoy && h < ahora,
      })),
    ];
  }, [valores.block_date]);

  return (
    <VentanaEmergente
      titulo="Formulario de tarjeta"
      alSalir={alCancelar}
      hayCambios={hayCambios}
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
        {/* RD-51 y RD-75: en dos columnas, Título y Tipo, Fecha límite y Prioridad, Etiquetas y Descripción, y
            debajo el bloque horario (D-20). */}
        <CampoTexto
          id={campos.ids.title}
          etiqueta="Título"
          valor={valores.title}
          alCambiar={cambiar('title')}
          mensaje={campos.mensajes.title}
        />
        <Segmentado
          etiqueta="Tipo"
          opciones={TIPOS}
          valor={valores.type}
          alCambiar={(tipo) => setValores((v) => ({ ...v, type: tipo }))}
        />
        <div className="wg-formulario__celda wg-formulario__fecha">
          <CampoTexto
            id={campos.ids.due_date}
            etiqueta="Fecha límite"
            placeholder="DD/MM/AAAA"
            valor={valores.due_date}
            alCambiar={cambiar('due_date')}
            mensaje={campos.mensajes.due_date}
          />
          {/* HE-07-HU01-ET04, ET27: el calendario escribe la fecha elegida en DD/MM/AAAA. RD-75 (§3.6-1): los días
              anteriores a hoy no se pueden elegir (ET08, ET09); el Núcleo sigue validando `due_date.in_past`. */}
          <SelectorFecha
            etiqueta="Selector de fecha"
            flotante
            valor={fechaElegida}
            deshabilitados={{ before: hoy() }}
            alCambiar={(fecha) => cambiar('due_date')(fecha ? escribirFecha(fecha) : '')}
          />
        </div>
        <Segmentado
          etiqueta="Prioridad"
          opciones={PRIORIDADES}
          valor={valores.priority}
          alCambiar={(p) => setValores((v) => ({ ...v, priority: p }))}
        />
        {/* HE-07-HU02-ET01 y RD-75 (§3.8): desplegable con casillas; las elegidas se ven como chips de su color. */}
        <div
          className="wg-campo wg-etiquetas-desplegable"
          role="group"
          aria-label="Etiquetas"
          aria-describedby={avisoDeEtiquetas ? idDelAviso : undefined}
        >
          <span className="wg-campo__etiqueta">Etiquetas</span>
          <button
            id={`${idDelAviso}-campo`}
            type="button"
            className="wg-campo__entrada wg-etiquetas-desplegable__campo"
            aria-invalid={avisoDeEtiquetas ? true : undefined}
            aria-describedby={avisoDeEtiquetas ? idDelAviso : undefined}
            aria-expanded={listaAbierta}
            aria-label="Etiquetas asignadas"
            onClick={() => setListaAbierta((a) => !a)}
          >
            {elegidas.length === 0 ? (
              <span className="wg-etiquetas-desplegable__vacio">Elige etiquetas</span>
            ) : (
              elegidas.map((e) => (
                <span key={e.id} className="wg-chip">
                  <span className="wg-muestra-color" style={{ background: e.color_hex }} aria-hidden="true" />
                  {e.name}
                </span>
              ))
            )}
          </button>
          {listaAbierta && (
            <div className="wg-etiquetas-desplegable__lista">
              {etiquetas.length === 0 ? (
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
                      <span key={e.id} role="listitem" className="wg-fila">
                        <span
                          className="wg-muestra-color"
                          style={{ background: e.color_hex }}
                          aria-hidden="true"
                        />
                        <Casilla
                          etiqueta={e.name}
                          marcada={marcada}
                          // ET04, ET06: en el máximo, las demás quedan deshabilitadas con su motivo.
                          deshabilitada={!marcada && valores.label_ids.length >= TARJETA_ETIQUETAS_MAX}
                          alCambiar={(m) => marcarEtiqueta(e.id, m)}
                        />
                      </span>
                    );
                  })}
                  {valores.label_ids.length >= TARJETA_ETIQUETAS_MAX && (
                    <span className="wg-motivo">{textos.MAXIMO_ETIQUETAS}</span>
                  )}
                </div>
              )}
            </div>
          )}
          {avisoDeEtiquetas && (
            <span id={idDelAviso} className="wg-campo__mensaje">
              {avisoDeEtiquetas}
            </span>
          )}
        </div>
        <CampoTexto
          id={campos.ids.description}
          etiqueta="Descripción"
          multilinea
          valor={valores.description}
          alCambiar={cambiar('description')}
          mensaje={campos.mensajes.description}
        />
        {/* D-20 (rediseno_final_backend.md §4.5; HU v13 HE-07-HU01-CA13): bloque horario opcional, fecha y hora en
            punto, sin horas pasadas y no después de la fecha límite. */}
        <fieldset className="wg-formulario__bloque">
          <legend className="wg-campo__etiqueta">Bloque horario</legend>
          <div className="wg-formulario__celda wg-formulario__fecha">
            <CampoTexto
              id={campos.ids.block_date}
              etiqueta="Fecha del bloque"
              placeholder="DD/MM/AAAA"
              valor={valores.block_date}
              alCambiar={cambiar('block_date')}
              mensaje={campos.mensajes.block_date}
            />
            <SelectorFecha
              etiqueta="Selector de fecha del bloque"
              flotante
              valor={leerFecha(valores.block_date)}
              deshabilitados={[{ before: hoy() }, ...(fechaElegida ? [{ after: fechaElegida }] : [])]}
              alCambiar={(fecha) => cambiar('block_date')(fecha ? escribirFecha(fecha) : '')}
            />
          </div>
          <Selector
            id={campos.ids.block_hour}
            etiqueta="Hora del bloque"
            opciones={horasDelBloque}
            valor={valores.block_hour}
            alCambiar={(hora) => {
              setValores((v) => ({ ...v, block_hour: hora }));
              campos.alCorregir('block_hour', hora);
            }}
            mensaje={campos.mensajes.block_hour}
          />
        </fieldset>
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
