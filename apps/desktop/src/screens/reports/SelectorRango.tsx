import { useCallback, useState } from 'react';
import { estaVacio, useMensajesDeCampo, type Validador } from '@/reglas/formulario';
import type { RangeInput, ResolvedRange } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { Selector } from '@/ui/Selector/Selector';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaIso, leerFecha } from '../tarjeta/fechas';

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
}

export function SelectorRango({ alAplicar }: SelectorRangoProps) {
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

  // ET03: «Aplicar» aplica el rango personalizado diligenciado.
  const aplicar = () => {
    if (!campos.validarTodo(fechas)) return;
    const inicio = leerFecha(fechas.start);
    const fin = leerFecha(fechas.end);
    if (!inicio || !fin) return;
    void resolver({ kind: 'custom', start: fechaIso(inicio), end: fechaIso(fin) });
  };

  const cambiar = (campo: Campo) => (valor: string) => {
    setFechas((f) => ({ ...f, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  return (
    <div className="wg-fila" role="group" aria-label="Rango de fechas">
      <Selector etiqueta="Rango de fechas" opciones={OPCIONES} valor={opcion} alCambiar={elegir} />
      {opcion === 'custom' && (
        <>
          <CampoTexto
            id={campos.ids.start}
            etiqueta="Fecha de inicio"
            valor={fechas.start}
            alCambiar={cambiar('start')}
            mensaje={campos.mensajes.start}
          />
          <CampoTexto
            id={campos.ids.end}
            etiqueta="Fecha de fin"
            valor={fechas.end}
            alCambiar={cambiar('end')}
            mensaje={campos.mensajes.end}
          />
          <Boton principal onClick={aplicar}>
            Aplicar
          </Boton>
        </>
      )}
    </div>
  );
}
