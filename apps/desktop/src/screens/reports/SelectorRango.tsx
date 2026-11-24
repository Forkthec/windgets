import { useCallback, useState } from 'react';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type { RangeInput, ResolvedRange } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { Selector } from '@/ui/Selector/Selector';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { SelectorFecha } from '@/ui/SelectorFecha/SelectorFecha';
import { escribirFecha, fechaIso, leerFecha } from '../tarjeta/fechas';

/** HE-13-HU01: el rango personalizado tiene como máximo 366 días, contando el inicio y el fin. */
const DIAS_MAXIMOS = 366;

// Selector Rango de fechas de la pantalla Reportes (HE-13-HU01). El Núcleo resuelve el rango (IPC-REP-01) y
// vuelve a validar el personalizado (D-188).

type Opcion = 'last_7' | 'last_30' | 'last_12_months' | 'custom';

// ET01: las cuatro opciones.
const OPCIONES: Array<{ valor: Opcion; texto: string }> = [
  { valor: 'last_7', texto: 'Últimos 7 días' },
  { valor: 'last_30', texto: 'Últimos 30 días' },
  { valor: 'last_12_months', texto: 'Últimos 12 meses' },
  { valor: 'custom', texto: 'Personalizado' },
];

const CAMPOS = ['start', 'end'] as const;
type Campo = (typeof CAMPOS)[number];

// ET04 a ET06: obligatorias y DD/MM/AAAA que exista. El orden de las fechas y el máximo los responde el Núcleo.
const fechaDelRango: Validador = (v) => {
  if (estaVacio(v)) return textos.CAMPO_OBLIGATORIO;
  return leerFecha(v) ? undefined : textos.FECHA_INVALIDA;
};
const REGLAS: Record<Campo, Validador> = { start: fechaDelRango, end: fechaDelRango };

export interface SelectorRangoProps {
  /** El rango resuelto que aplica a todas las secciones del reporte (ET09). */
  alAplicar: (rango: ResolvedRange) => void;
  /** Sin tarjetas, la barra de filtros se muestra deshabilitada (HE-13-HU02-ET12). */
  deshabilitado?: boolean;
}

export function SelectorRango({ alAplicar, deshabilitado = false }: SelectorRangoProps) {
  const { invocar } = useNucleo();
  // ET16: al abrir la pantalla, «Últimos 30 días».
  const [opcion, setOpcion] = useState<Opcion>('last_30');
  const [fechas, setFechas] = useState<Record<Campo, string>>({ start: '', end: '' });
  const campos = useMensajesDeCampo(CAMPOS, REGLAS);

  const resolver = useCallback(
    async (rango: RangeInput) => {
      const r = await invocar('report_resolve_range', { range: rango });
      // ET10: con un error, el reporte no se actualiza.
      if (!r.ok) {
        if (r.error.field) campos.mostrarDelNucleo([r.error]);
        return;
      }
      alAplicar(r.value);
    },
    [alAplicar, campos, invocar],
  );

  const elegir = (valor: string) => {
    const nueva = valor as Opcion;
    setOpcion(nueva);
    // ET02: los rangos predefinidos se aplican al seleccionarlos, sin «Aplicar».
    if (nueva !== 'custom') void resolver({ kind: nueva });
  };

  // ET03: «Aplicar» aplica el rango personalizado diligenciado. RD-80 (rediseno_final_backend.md §3.6-2, §4.8): la
  // vista comprueba antes de llamar al Núcleo que el fin no sea anterior al inicio y el máximo de 366 días; el Núcleo
  // vuelve a validar (`range.start_after_end`, `range.too_long`).
  const aplicar = () => {
    if (!campos.validarTodo(fechas)) return;
    const inicio = leerFecha(fechas.start);
    const fin = leerFecha(fechas.end);
    if (!inicio || !fin) return;
    if (inicio > fin) {
      // HE-13-HU01-ET07, ET11: el mensaje va en Fecha de fin.
      campos.mostrarDelNucleo([{ field: 'end', message: textos.INICIO_POSTERIOR_AL_FIN }]);
      return;
    }
    const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
    if (dias > DIAS_MAXIMOS) {
      campos.mostrarDelNucleo([{ field: 'end', message: textos.RANGO_MUY_LARGO }]);
      return;
    }
    void resolver({ kind: 'custom', start: fechaIso(inicio), end: fechaIso(fin) });
  };

  const cambiar = (campo: Campo) => (valor: string) => {
    setFechas((f) => ({ ...f, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  const inicioElegido = leerFecha(fechas.start);
  return (
    <div className="wg-fila" role="group" aria-label="Rango de fechas">
      <Selector
        etiqueta="Rango de fechas"
        opciones={OPCIONES}
        valor={opcion}
        alCambiar={elegir}
        deshabilitado={deshabilitado}
      />
      {opcion === 'custom' && (
        <>
          {/* RD-80 (§3.8): cada fecha con su calendario flotante, que solo deja elegir fechas válidas. */}
          <div className="wg-formulario__fecha">
            <CampoTexto
              id={campos.ids.start}
              etiqueta="Fecha de inicio"
              placeholder="DD/MM/AAAA"
              valor={fechas.start}
              alCambiar={cambiar('start')}
              mensaje={campos.mensajes.start}
            />
            <SelectorFecha
              etiqueta="Selector de la fecha de inicio"
              flotante
              valor={leerFecha(fechas.start)}
              alCambiar={(f) => cambiar('start')(f ? escribirFecha(f) : '')}
            />
          </div>
          <div className="wg-formulario__fecha">
            <CampoTexto
              id={campos.ids.end}
              etiqueta="Fecha de fin"
              placeholder="DD/MM/AAAA"
              valor={fechas.end}
              alCambiar={cambiar('end')}
              mensaje={campos.mensajes.end}
            />
            <SelectorFecha
              etiqueta="Selector de la fecha de fin"
              flotante
              valor={leerFecha(fechas.end)}
              deshabilitados={inicioElegido ? { before: inicioElegido } : undefined}
              alCambiar={(f) => cambiar('end')(f ? escribirFecha(f) : '')}
            />
          </div>
          <Boton principal onClick={aplicar}>
            Aplicar
          </Boton>
        </>
      )}
    </div>
  );
}
