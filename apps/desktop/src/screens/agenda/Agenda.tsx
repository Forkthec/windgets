import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgendaBlock, AgendaDay, Card } from '@/types';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { IndicadorDeEstado } from '../tarjeta/EstadoDeTarjeta';
import { fechaIso, hoy } from '../tarjeta/fechas';
import { NavegacionDeLaAgenda } from './NavegacionDeLaAgenda';
import './agenda.css';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';
import { asignacionDelArrastre, type BloqueDeSoltar } from './arrastre';

// P-AGE-01 Agenda diaria (Menú principal > Planificador > Agenda diaria; HE-11-HU01). Los bloques y las tarjetas
// vienen del Núcleo (IPC-CARD-09), que lee solo la base local: sin conexión muestra lo guardado (ET08). El
// indicador «Sin conexión» de CA06 es de HE-15-HU02. Las tarjetas se asignan a un bloque con drag-and-drop
// (HE-11-HU02).

/** «10:00 – 11:00» (contratos.md, `CardDetail.time_block.label`). */
export function textoDelBloque(hora: number): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(hora)}:00 – ${dos((hora + 1) % 24)}:00`;
}

/**
 * Una tarjeta de la agenda: su título abre el Detalle de tarjeta (HE-07-HU03, T-090) y se arrastra a un bloque
 * horario (HE-11-HU02-ET01).
 */
function TarjetaDeLaAgenda({
  tarjeta,
  alAbrir,
  alQuitar,
}: {
  tarjeta: Card;
  alAbrir: (id: string) => void;
  /** Solo en un bloque horario: «Quitar del horario» (HE-11-HU03-ET01). */
  alQuitar?: (id: string) => void;
}) {
  const arrastre = useDraggable({ id: tarjeta.id, data: { hora: tarjeta.scheduled_hour } });
  const { transform } = arrastre;
  return (
    <li
      ref={arrastre.setNodeRef}
      className={`wg-tarjeta${arrastre.isDragging ? ' wg-tarjeta--arrastrada' : ''}`}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      {...arrastre.listeners}
    >
      <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrir(tarjeta.id)}>
        {tarjeta.title}
      </button>
      {/* RD-79 (§6.4, D-03): vencida en rojo y próxima a vencer en amarillo. */}
      <IndicadorDeEstado tarjeta={tarjeta} />
      {alQuitar && (
        <button type="button" className="wg-boton" onClick={() => alQuitar(tarjeta.id)}>
          Quitar del horario
        </button>
      )}
    </li>
  );
}

/** Un bloque horario con sus tarjetas, una debajo de otra (HE-11-HU02-ET05). */
function Bloque({
  bloque,
  actual,
  arrastrando,
  alAbrir,
  alQuitar,
  alUbicar,
}: {
  bloque: AgendaBlock;
  actual: boolean;
  arrastrando: boolean;
  alAbrir: (id: string) => void;
  alQuitar: (id: string) => void;
  alUbicar: (nodo: HTMLElement | null) => void;
}) {
  const lugar: BloqueDeSoltar = { hora: bloque.hour };
  const soltar = useDroppable({ id: `bloque:${bloque.hour}`, data: lugar });
  // HE-11-HU02-ET07: durante el arrastre, un bloque que ya terminó se ve deshabilitado.
  const deshabilitado = arrastrando && bloque.is_past;
  const clases = [
    'wg-agenda__bloque',
    actual ? 'wg-agenda__bloque--actual' : '',
    deshabilitado ? 'wg-deshabilitado' : '',
    soltar.isOver && !deshabilitado ? 'wg-columna--destino' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <li
      ref={(nodo) => {
        soltar.setNodeRef(nodo);
        alUbicar(nodo);
      }}
      className={clases}
    >
      <section aria-label={textoDelBloque(bloque.hour)} aria-disabled={deshabilitado || undefined}>
        {/* RD-52 (93:45): se ve la hora de inicio; el bloque conserva «HH:00 – HH:00» como nombre accesible. */}
        <h3 className="wg-agenda__hora" aria-label={textoDelBloque(bloque.hour)}>
          {textoDelBloque(bloque.hour).slice(0, 5)}
        </h3>
        {bloque.cards.length > 0 && (
          <ul className="wg-columna__tarjetas">
            {bloque.cards.map((t) => (
              <TarjetaDeLaAgenda key={t.id} tarjeta={t} alAbrir={alAbrir} alQuitar={alQuitar} />
            ))}
          </ul>
        )}
      </section>
    </li>
  );
}

export function Agenda() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [dia, setDia] = useState(() => fechaIso(hoy()));
  const [agenda, setAgenda] = useState<AgendaDay | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  // ET01, ET07: al abrir y con «Hoy», la vista se ubica en el bloque de la hora actual.
  const [ubicar, setUbicar] = useState(true);
  const bloques = useRef<Array<HTMLElement | null>>([]);

  const leer = useCallback(async () => {
    const r = await invocar('agenda_get_day', { date: dia });
    if (r.ok) setAgenda(r.value);
  }, [dia, invocar]);

  useEffect(() => {
    void leer();
    return escuchar('cards_changed', () => void leer());
  }, [escuchar, leer]);

  useEffect(() => {
    if (!ubicar || !agenda || agenda.date !== dia) return;
    if (agenda.current_hour !== null)
      // RD-79: solo se desplaza la cuadrícula de horas; la cabecera queda a la vista.
      bloques.current[agenda.current_hour]?.scrollIntoView?.({ block: 'nearest' });
    setUbicar(false);
  }, [agenda, dia, ubicar]);

  const tarjetas = useVentanasDeTarjeta(useCallback(() => void leer(), [leer]));

  // HE-11-HU02: al soltar sobre un bloque, el Núcleo asigna la tarjeta (ET09) o explica por qué no (ET10, ET11);
  // en ese caso la tarjeta vuelve a su lugar de origen al volver a leer la agenda.
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const soltada = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setArrastrando(false);
      const desde = (active.data.current as { hora: number | null } | undefined)?.hora ?? null;
      const asignacion = asignacionDelArrastre(
        String(active.id),
        desde,
        over?.data.current as BloqueDeSoltar | undefined,
        dia,
      );
      if (!asignacion) return;
      const r = await invocar('card_assign_time_block', asignacion);
      if (r.ok) mostrarResultado(r.result_message?.message ?? '');
      else if (r.error.message) mostrarResultado(r.error.message);
      await leer();
    },
    [dia, invocar, leer, mostrarResultado],
  );

  // HE-11-HU03: quitar la tarjeta del bloque la devuelve a Tarjetas sin horario con «Tarjeta quitada del
  // horario.» (ET02, ET03); DP-04 si ya no existe.
  const quitar = useCallback(
    async (id: string) => {
      const r = await invocar('card_unassign_time_block', { card_id: id });
      if (r.ok) mostrarResultado(r.result_message?.message ?? '');
      else if (r.error.message) mostrarResultado(r.error.message);
      await leer();
    },
    [invocar, leer, mostrarResultado],
  );

  return (
    <main className="wg-agenda-diaria" aria-label="Agenda diaria" aria-busy={agenda === null}>
      {/* ET02: la fecha del día consultado y la navegación entre días (ET06, ET07). RD-79 (D-26): fija arriba, con el
          mini calendario, las flechas, «Ir a hoy» y la tira semanal. */}
      <NavegacionDeLaAgenda
        dia={dia}
        alCambiar={setDia}
        alIrAHoy={() => {
          setDia(fechaIso(hoy()));
          setUbicar(true);
        }}
      />
      {agenda && (
        <DndContext
          sensors={sensores}
          collisionDetection={pointerWithin}
          onDragStart={() => setArrastrando(true)}
          onDragCancel={() => setArrastrando(false)}
          onDragEnd={(e) => void soltada(e)}
        >
          <div className="wg-agenda">
            {/* ET01, ET03: 24 bloques de una hora con sus tarjetas. */}
            <ol className="wg-agenda__bloques" aria-label="Bloques horarios">
              {agenda.blocks.map((bloque) => (
                <Bloque
                  key={bloque.hour}
                  bloque={bloque}
                  actual={bloque.hour === agenda.current_hour}
                  arrastrando={arrastrando}
                  alAbrir={tarjetas.abrirDetalle}
                  alQuitar={(id) => void quitar(id)}
                  alUbicar={(nodo) => {
                    bloques.current[bloque.hour] = nodo;
                  }}
                />
              ))}
            </ol>
            {/* ET04, ET05: las tarjetas que no están en Hecho ni tienen bloque horario. */}
            <section className="wg-agenda__sin-horario" aria-label="Tarjetas sin horario">
              <h3>Tarjetas sin horario</h3>
              {agenda.unscheduled.length === 0 ? (
                <EstadoVacio texto="No tienes tarjetas pendientes por programar." />
              ) : (
                <ul className="wg-columna__tarjetas">
                  {agenda.unscheduled.map((t) => (
                    <TarjetaDeLaAgenda key={t.id} tarjeta={t} alAbrir={tarjetas.abrirDetalle} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DndContext>
      )}
      {tarjetas.ventanas}
    </main>
  );
}
