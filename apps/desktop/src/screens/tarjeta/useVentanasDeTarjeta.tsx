import { useCallback, useMemo, type ReactNode } from 'react';
import { useVentanasEmergentes } from '@/reglas/emergentes';
import type { Card, CardDetail } from '@/types';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { ConfirmarEliminacion } from './ConfirmarEliminacion';
import { DetalleTarjeta } from './DetalleTarjeta';
import { FormularioTarjeta } from './FormularioTarjeta';

// Las ventanas emergentes de una tarjeta, iguales en todas las pantallas desde las que se abre el detalle
// (T-090: Tablero Kanban, Calendario, Agenda diaria, Planificador diario y Reportes): Formulario de tarjeta
// (HE-07-HU01, HU04), Detalle de tarjeta (HE-07-HU03) y confirmación de eliminar (HE-07-HU05). RT-02: solo
// se ve la última; «Editar» y «Eliminar» se abren sobre el detalle y, al terminar, vuelven a él. Desde el botón de
// acciones «⋮» de una tarjeta del Tablero Kanban se abren solos y, al terminar, se vuelve al tablero
// (HE-07-HU04-ET22, ET23; HE-07-HU05-CA04, ET05).

type Ventana =
  | { tipo: 'formulario'; fechaLimite?: string }
  | { tipo: 'detalle'; id: string }
  | { tipo: 'edicion'; tarjeta: CardDetail }
  | { tipo: 'eliminar'; tarjeta: CardDetail };

export interface VentanasDeTarjeta {
  /**
   * «Nueva tarjeta»: Formulario de tarjeta en modo creación (HE-07-HU01-ET25); desde un día del calendario, con
   * la fecha límite de ese día ya diligenciada (HE-10-HU04-ET02).
   */
  abrirNueva: (fechaLimite?: string) => void;
  /** El título de una tarjeta o «Vista detallada» de su «⋮»: Detalle de tarjeta (HE-07-HU03-ET02, CA05). */
  abrirDetalle: (id: string) => void;
  /** «Editar» del «⋮»: Formulario de tarjeta en edición; al guardar o cancelar, la pantalla (HE-07-HU04-ET23). */
  abrirEdicion: (id: string) => void;
  /** «Eliminar» del «⋮»: la confirmación; «Cancelar» deja la tarjeta en la pantalla (HE-07-HU05-CA04, ET05). */
  abrirEliminacion: (id: string) => void;
  /** Las ventanas abiertas, para dibujar en la pantalla. */
  ventanas: ReactNode;
}

/**
 * `alCambiar` vuelve a leer los datos de la pantalla después de crear, editar o eliminar (la pantalla también
 * escucha `cards_changed`).
 */
export function useVentanasDeTarjeta(alCambiar: () => void): VentanasDeTarjeta {
  const emergentes = useVentanasEmergentes<Ventana>();
  // Las funciones del hook son estables; el objeto que las agrupa cambia en cada dibujo.
  const { abrir, cerrarTodas, volver } = emergentes;
  const mostrarResultado = useMensajeDeResultado();

  // Cerrar una o todas las ventanas, mostrar el mensaje de resultado y volver a leer la pantalla.
  const terminar = useCallback(
    (todas: boolean) => (mensaje: string) => {
      if (todas) cerrarTodas();
      else volver();
      mostrarResultado(mensaje);
      alCambiar();
    },
    [alCambiar, cerrarTodas, mostrarResultado, volver],
  );
  // HE-07-HU01-CA01: al crear, cierra el formulario y sigue en la pantalla de origen con «Tarjeta creada.».
  // HE-07-HU04-CA01: al editar, regresa al detalle actualizado (ET03) con «Tarjeta actualizada.».
  const guardada = useCallback((_: Card, mensaje: string) => terminar(false)(mensaje), [terminar]);
  // HE-07-HU05-CA02 y DP-04 (HE-07-HU04-CA11): cierran todas las ventanas.
  const cerradas = useMemo(() => terminar(true), [terminar]);

  const abrirNueva = useCallback(
    (fechaLimite?: string) => abrir({ tipo: 'formulario', fechaLimite }),
    [abrir],
  );
  const abrirDetalle = useCallback((id: string) => abrir({ tipo: 'detalle', id }), [abrir]);
  // HE-07-HU04-CA12, HE-07-HU05-CA04: leen la tarjeta (card_get) y abren su ventana sola, sin el detalle debajo.
  // Si la tarjeta ya no existe (DP-04) o no se puede leer, se muestra el mensaje del Núcleo.
  const { invocar } = useNucleo();
  const abrirSobreLaPantalla = useCallback(
    (id: string, tipo: 'edicion' | 'eliminar') => {
      void invocar('card_get', { id }).then((r) => {
        if (r.ok) abrir({ tipo, tarjeta: r.value });
        else cerradas(r.error.message);
      });
    },
    [abrir, cerradas, invocar],
  );
  const abrirEdicion = useCallback(
    (id: string) => abrirSobreLaPantalla(id, 'edicion'),
    [abrirSobreLaPantalla],
  );
  const abrirEliminacion = useCallback(
    (id: string) => abrirSobreLaPantalla(id, 'eliminar'),
    [abrirSobreLaPantalla],
  );
  const ventana = emergentes.actual;

  let ventanas: ReactNode = null;
  if (ventana?.tipo === 'formulario') {
    ventanas = (
      <FormularioTarjeta
        fechaLimite={ventana.fechaLimite}
        alGuardar={guardada}
        alCancelar={emergentes.volver}
      />
    );
  } else if (ventana?.tipo === 'detalle') {
    ventanas = (
      <DetalleTarjeta
        id={ventana.id}
        alCerrar={emergentes.volver}
        alNoExistir={cerradas}
        // HE-07-HU04-ET01: «Editar» reemplaza el detalle por el formulario en modo edición.
        alEditar={(tarjeta) => emergentes.pasarA({ tipo: 'edicion', tarjeta })}
        // HE-07-HU05-ET01: «Eliminar» abre la confirmación sobre el detalle.
        alEliminar={(tarjeta) => emergentes.pasarA({ tipo: 'eliminar', tarjeta })}
      />
    );
  } else if (ventana?.tipo === 'edicion') {
    ventanas = (
      <FormularioTarjeta
        tarjeta={ventana.tarjeta}
        alGuardar={guardada}
        // HE-07-HU04-CA09: «Cancelar» vuelve al detalle con la información anterior; abierto desde «⋮», a la
        // pantalla (ET23).
        alCancelar={emergentes.volver}
        alNoExistir={cerradas}
      />
    );
  } else if (ventana?.tipo === 'eliminar') {
    ventanas = (
      <ConfirmarEliminacion
        tarjeta={ventana.tarjeta}
        alEliminar={cerradas}
        alCancelar={emergentes.volver}
        alNoExistir={cerradas}
      />
    );
  }
  return { abrirNueva, abrirDetalle, abrirEdicion, abrirEliminacion, ventanas };
}
