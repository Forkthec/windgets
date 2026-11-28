import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as EventoDeTeclado, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { NombreEmergente } from '../NombreEmergente/NombreEmergente';
import { useSalidaAnimada } from '../movimiento/useSalidaAnimada';

// Botón de acciones «⋮» y su menú (RT-02-ET10 a ET12, RT-02-CA10). Agrupa las acciones de un elemento de una
// lista; el menú no es una ventana emergente: no bloquea el fondo (RT-02, regla). Se cierra con Esc, al elegir
// una opción o al seleccionar fuera; se recorre con las flechas y, al cerrarse, el foco vuelve al botón (ET11).
// Una opción deshabilitada se ve en gris y muestra su motivo al pasar el mouse (RT-04, en el nombre emergente de
// RD-100). El menú se dibuja con
// `position: fixed` fuera del contenedor, así que ningún contenedor lo recorta ni le agrega barra (ET12).
// AN-01 (ANIMACIONES.md A-03, A-04): abre con fundido y baja `--mov-corto` en 150 ms; al cerrar sale en 100 ms y sigue
// montado hasta terminar (regla 13), inerte y fuera del árbol accesible. La acción elegida y el foco no esperan.

export interface OpcionDeMenu {
  /** Texto literal de la opción, por ejemplo «Editar». */
  etiqueta: string;
  alElegir?: () => void;
  deshabilitada?: boolean;
  /** Motivo de la opción deshabilitada (RT-04), visible al pasar el mouse. */
  motivo?: string;
  /** Si está definida, la opción es de un grupo de elección única (por ejemplo, la columna actual en «Mover a»). */
  marcada?: boolean;
  /** Opciones que reemplazan a las del menú al elegir esta, como la lista de columnas de «Mover a». */
  submenu?: readonly OpcionDeMenu[];
}

export interface MenuDeAccionesProps {
  /** Nombre del elemento: el botón se llama «Acciones de <nombre>» (RT-02-ET10). */
  nombre: string;
  opciones: readonly OpcionDeMenu[];
  /** Contenido visible del botón; por defecto «⋮». */
  boton?: ReactNode;
  /** Nombre accesible del botón y del menú, si no es «Acciones de <nombre>». */
  etiqueta?: string;
  className?: string;
  /** Dibuja el menú dentro del elemento, sin portal. Lo usan los widgets de la capa, que solo reciben selecciones
   * dentro de su rectángulo (HE-06-HU01). */
  enLugar?: boolean;
}

interface Posicion {
  top: number;
  left: number;
}

const MARGEN = 4;

const detener = (e: { stopPropagation: () => void }) => e.stopPropagation();

/** Coloca el menú debajo del botón; si no cabe, encima; nunca fuera de la ventana. */
export function posicionDelMenu(
  boton: DOMRect,
  menu: { width: number; height: number },
  ventana: { width: number; height: number },
): Posicion {
  const abajo = boton.bottom + MARGEN;
  const arriba = boton.top - MARGEN - menu.height;
  const top = abajo + menu.height <= ventana.height || arriba < 0 ? abajo : arriba;
  const left = Math.max(MARGEN, Math.min(boton.left, ventana.width - menu.width - MARGEN));
  return { top: Math.max(MARGEN, top), left };
}

export function MenuDeAcciones({
  nombre,
  opciones,
  boton = '⋮',
  etiqueta,
  className,
  enLugar = false,
}: MenuDeAccionesProps) {
  const [abierto, setAbierto] = useState(false);
  const [submenu, setSubmenu] = useState<OpcionDeMenu | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const idMenu = useId();
  const refBoton = useRef<HTMLButtonElement>(null);
  const refMenu = useRef<HTMLUListElement>(null);
  const nombreAccesible = etiqueta ?? `Acciones de ${nombre}`;
  const visibles = submenu?.submenu ?? opciones;
  const { montado, estado } = useSalidaAnimada(abierto, refMenu);

  // La posición y el submenú se quedan mientras sale; se olvidan al desmontar.
  useEffect(() => {
    if (montado) return;
    setSubmenu(null);
    setPosicion(null);
  }, [montado]);

  const cerrar = useCallback((devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) refBoton.current?.focus();
  }, []);

  // ET12: la posición se calcula con el botón en la ventana y se recalcula al desplazar o cambiar el tamaño.
  const ubicar = useCallback(() => {
    const b = refBoton.current;
    const m = refMenu.current;
    if (!b || !m || enLugar) return;
    setPosicion(
      posicionDelMenu(
        b.getBoundingClientRect(),
        { width: m.offsetWidth, height: m.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [enLugar]);

  useLayoutEffect(() => {
    if (!abierto) return;
    ubicar();
    refMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [abierto, submenu, ubicar]);

  useEffect(() => {
    if (!abierto) return;
    // ET11: Esc cierra solo el menú (en captura, para que no cierre la ventana emergente de debajo).
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        cerrar(true);
      }
    };
    // ET11: seleccionar fuera del menú y del botón lo cierra.
    const alPresionar = (e: PointerEvent | MouseEvent) => {
      const objetivo = e.target as Node;
      if (refMenu.current?.contains(objetivo) || refBoton.current?.contains(objetivo)) return;
      cerrar(false);
    };
    document.addEventListener('keydown', alTeclear, true);
    document.addEventListener('mousedown', alPresionar, true);
    window.addEventListener('resize', ubicar);
    window.addEventListener('scroll', ubicar, true);
    return () => {
      document.removeEventListener('keydown', alTeclear, true);
      document.removeEventListener('mousedown', alPresionar, true);
      window.removeEventListener('resize', ubicar);
      window.removeEventListener('scroll', ubicar, true);
    };
  }, [abierto, cerrar, ubicar]);

  // ET11: las flechas arriba y abajo recorren las opciones habilitadas; Inicio y Fin van a la primera y la última.
  const alTeclearEnMenu = (e: EventoDeTeclado<HTMLUListElement>) => {
    const botones = Array.from(
      refMenu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
    );
    if (botones.length === 0) return;
    const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
    let siguiente: number | null = null;
    if (e.key === 'ArrowDown') siguiente = (actual + 1) % botones.length;
    else if (e.key === 'ArrowUp') siguiente = (actual - 1 + botones.length) % botones.length;
    else if (e.key === 'Home') siguiente = 0;
    else if (e.key === 'End') siguiente = botones.length - 1;
    else if (e.key === 'Tab') cerrar(false);
    if (siguiente !== null) {
      e.preventDefault();
      botones[siguiente]?.focus();
    }
  };

  const elegir = (opcion: OpcionDeMenu) => {
    if (opcion.submenu) {
      setSubmenu(opcion);
      return;
    }
    cerrar(true);
    opcion.alElegir?.();
  };

  const saliendo = estado === 'saliendo';
  const lista = montado && (
    <ul
      ref={refMenu}
      id={saliendo ? undefined : idMenu}
      role="menu"
      aria-label={submenu ? submenu.etiqueta : nombreAccesible}
      aria-hidden={saliendo || undefined}
      className={[
        'wg-menu-acciones__lista',
        enLugar && 'wg-menu-acciones__lista--en-lugar',
        estado === 'abierta' && 'wg-menu-acciones__lista--abierta',
        saliendo && 'wg-menu-acciones__lista--saliendo',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        enLugar ? undefined : posicion ? { top: posicion.top, left: posicion.left } : { visibility: 'hidden' }
      }
      onKeyDown={alTeclearEnMenu}
      // El menú está en un portal, pero los eventos de React suben igual por el árbol de componentes: presionar
      // una opción no debe empezar el drag-and-drop de la tarjeta o la columna de debajo (HE-09-HU02-ET01).
      onPointerDown={detener}
    >
      {visibles.map((o) => (
        <li key={o.etiqueta} role="none">
          <NombreEmergente texto={o.deshabilitada ? o.motivo : undefined}>
            <button
              type="button"
              role={o.marcada === undefined ? 'menuitem' : 'menuitemradio'}
              aria-checked={o.marcada}
              aria-haspopup={o.submenu ? 'menu' : undefined}
              disabled={o.deshabilitada}
              className="wg-menu-acciones__opcion"
              onClick={() => elegir(o)}
            >
              {o.etiqueta}
            </button>
          </NombreEmergente>
        </li>
      ))}
    </ul>
  );
  const menu = lista && (enLugar ? lista : createPortal(lista, document.body));

  return (
    <span className={['wg-menu-acciones', className ?? ''].filter(Boolean).join(' ')}>
      <button
        ref={refBoton}
        type="button"
        className="wg-boton wg-menu-acciones__boton"
        aria-label={nombreAccesible}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        onClick={() => (abierto ? cerrar(false) : setAbierto(true))}
        onPointerDown={detener}
      >
        {boton}
      </button>
      {menu}
    </span>
  );
}
