import { useCallback, useEffect, useState } from 'react';
import { useVentanasEmergentes } from '@/reglas/emergentes';
import type { BoardColumn, Card, CardDetail } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { ConfirmarEliminacion } from '../tarjeta/ConfirmarEliminacion';
import { DetalleTarjeta } from '../tarjeta/DetalleTarjeta';
import { fechaVisible } from '../tarjeta/fechas';
import { FormularioTarjeta } from '../tarjeta/FormularioTarjeta';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from '../tarjeta/nombres';

// P-KAN-01 Tablero Kanban (Menú principal > Planificador > Tablero Kanban; HE-09-HU01). Las columnas y las
// tarjetas vienen del Núcleo (IPC-CARD-05); la pantalla se vuelve a leer con cards_changed y columns_changed.

type Ventana =
  | { tipo: 'formulario' }
  | { tipo: 'detalle'; id: string }
  | { tipo: 'edicion'; tarjeta: CardDetail }
  | { tipo: 'eliminar'; tarjeta: CardDetail };

/** Una tarjeta en la vista compacta (ET05): tipo (HE-07-HU01-ET15), título, fecha límite y prioridad. */
function Tarjeta({ tarjeta, alAbrir }: { tarjeta: Card; alAbrir: (id: string) => void }) {
  return (
    <li className="wg-tarjeta">
      <span className="wg-tarjeta__tipo">{NOMBRE_DE_TIPO[tarjeta.type]}</span>
      {/* HE-07-HU03-ET02: el título abre el Detalle de tarjeta. */}
      <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrir(tarjeta.id)}>
        {tarjeta.title}
      </button>
      <span className="wg-fila">
        <span>{fechaVisible(tarjeta.due_date)}</span>
        {/* ET06, ET07: «Vencida» solo fuera de la columna Hecho. */}
        {tarjeta.is_overdue && <span className="wg-indicador">Vencida</span>}
      </span>
      {tarjeta.priority && <span>{NOMBRE_DE_PRIORIDAD[tarjeta.priority]}</span>}
    </li>
  );
}

/** Una columna con su nombre, su color y su cantidad de tarjetas (ET01). */
function Columna({ columna, alAbrir }: { columna: BoardColumn; alAbrir: (id: string) => void }) {
  const { column, cards } = columna;
  return (
    <section className="wg-columna" aria-label={column.name}>
      <h2 className="wg-fila wg-columna__encabezado">
        {/* El color acompaña al nombre: el significado no depende solo del color (interfaz.md). */}
        <span className="wg-muestra-color" style={{ background: column.color_hex }} aria-hidden="true" />
        <span>{column.name}</span>
        <span className="wg-columna__cantidad">{column.card_count}</span>
      </h2>
      {cards.length === 0 ? (
        // ET04: estado vacío de la columna (RT-04).
        <EstadoVacio texto="No hay tarjetas en esta columna." />
      ) : (
        <ul className="wg-columna__tarjetas">
          {cards.map((t) => (
            <Tarjeta key={t.id} tarjeta={t} alAbrir={alAbrir} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Kanban() {
  const { invocar, escuchar } = useNucleo();
  const emergentes = useVentanasEmergentes<Ventana>();
  const mostrarResultado = useMensajeDeResultado();
  const [columnas, setColumnas] = useState<BoardColumn[] | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('card_list_board', {});
    if (r.ok) setColumnas(r.value.columns);
  }, [invocar]);

  useEffect(() => {
    void leer();
    const dejarTarjetas = escuchar('cards_changed', () => void leer());
    const dejarColumnas = escuchar('columns_changed', () => void leer());
    return () => {
      dejarTarjetas();
      dejarColumnas();
    };
  }, [escuchar, leer]);

  // HE-07-HU01-CA01: al guardar, cierra el formulario, sigue en el Tablero Kanban, muestra «Tarjeta creada.»
  // y la tarjeta en su columna (ET14).
  const creada = useCallback(
    (_: Card, mensaje: string) => {
      emergentes.volver();
      mostrarResultado(mensaje);
      void leer();
    },
    [emergentes, leer, mostrarResultado],
  );

  // DP-04, HE-07-HU04-CA11: la tarjeta ya no existe (por ejemplo, la eliminó otro computador): se cierran las
  // ventanas, la tarjeta sale del tablero y se muestra «Esta tarjeta ya no existe.».
  const noExiste = useCallback(
    (mensaje: string) => {
      emergentes.cerrarTodas();
      mostrarResultado(mensaje);
      void leer();
    },
    [emergentes, leer, mostrarResultado],
  );

  // HE-07-HU05-CA02: al eliminar, cierra las ventanas, sigue en el tablero sin la tarjeta (ET04, ET05) y
  // muestra «Tarjeta eliminada.» (ET06).
  const eliminada = useCallback(
    (mensaje: string) => {
      emergentes.cerrarTodas();
      mostrarResultado(mensaje);
      void leer();
    },
    [emergentes, leer, mostrarResultado],
  );

  // HE-07-HU04-CA01: al guardar la edición, regresa al Detalle de tarjeta actualizado (ET03) con el mensaje.
  const editada = useCallback(
    (_: Card, mensaje: string) => {
      emergentes.volver();
      mostrarResultado(mensaje);
      void leer();
    },
    [emergentes, leer, mostrarResultado],
  );

  const abrirDetalle = useCallback((id: string) => emergentes.abrir({ tipo: 'detalle', id }), [emergentes]);
  const ventana = emergentes.actual;

  return (
    <main aria-label="Tablero Kanban" aria-busy={columnas === null}>
      {/* ET03. «Nueva columna» es de HE-09-HU03 y el cambio de vista, de HE-09-HU07. */}
      <div className="wg-fila">
        <Boton principal onClick={() => emergentes.abrir({ tipo: 'formulario' })}>
          Nueva tarjeta
        </Boton>
        <Boton>Nueva columna</Boton>
        <Boton>Vista expandida</Boton>
      </div>
      {columnas && (
        <div className="wg-tablero">
          {columnas.map((c) => (
            <Columna key={c.column.id} columna={c} alAbrir={abrirDetalle} />
          ))}
        </div>
      )}
      {ventana?.tipo === 'formulario' && (
        <FormularioTarjeta alGuardar={creada} alCancelar={emergentes.volver} />
      )}
      {ventana?.tipo === 'detalle' && (
        <DetalleTarjeta
          id={ventana.id}
          alCerrar={emergentes.volver}
          alNoExistir={noExiste}
          // HE-07-HU04-ET01: «Editar» reemplaza el detalle por el formulario en modo edición (RT-02).
          alEditar={(tarjeta) => emergentes.pasarA({ tipo: 'edicion', tarjeta })}
          // HE-07-HU05-ET01: «Eliminar» abre la confirmación sobre el detalle.
          alEliminar={(tarjeta) => emergentes.pasarA({ tipo: 'eliminar', tarjeta })}
        />
      )}
      {ventana?.tipo === 'eliminar' && (
        <ConfirmarEliminacion
          tarjeta={ventana.tarjeta}
          alEliminar={eliminada}
          alCancelar={emergentes.volver}
          alNoExistir={noExiste}
        />
      )}
      {ventana?.tipo === 'edicion' && (
        <FormularioTarjeta
          tarjeta={ventana.tarjeta}
          alGuardar={editada}
          // CA09: «Cancelar» vuelve al detalle con la información anterior.
          alCancelar={emergentes.volver}
          alNoExistir={noExiste}
        />
      )}
    </main>
  );
}
