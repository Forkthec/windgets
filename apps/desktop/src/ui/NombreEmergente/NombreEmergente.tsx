import { cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, ReactElement } from 'react';
import { createPortal } from 'react-dom';

// Nombre emergente de los botones (docs/rediseno.md RD-100; IM-03). Sus estilos están en `tema/tokens.css`.
// Reemplaza el `title` nativo, que no se ve con el teclado ni sigue el tema. Aparece al pasar el puntero (con retraso)
// y al recibir el foco del teclado (sin retraso); se oculta al salir, con Esc o al seleccionar el botón. Un botón
// deshabilitado también lo muestra: el navegador le entrega los eventos de puntero (comprobado en
// e2e/rediseno-nombres.spec.ts). Se dibuja fijo fuera del contenedor, así que ningún contenedor lo recorta, y encima
// de las ventanas emergentes, los menús y los mensajes.

export const RETRASO_DEL_NOMBRE_MS = 400;
/** Distancia entre el botón y el nombre emergente. */
const DISTANCIA = 8;
/** Separación mínima con los bordes de la ventana. */
const MARGEN = 4;
/** Distancia mínima de la punta de la flecha a un lado: el radio (6) más la media base de la flecha (6). */
const BORDE_DE_LA_FLECHA = 12;

interface PosicionDelNombre {
  top: number;
  left: number;
  lado: 'abajo' | 'arriba';
  /** Punta de la flecha, medida desde el lado izquierdo del nombre: señala el centro del botón. */
  flecha: number;
}

/** Centrado debajo del botón; si no cabe, arriba; nunca se sale por los lados. */
export function posicionDelNombre(
  boton: { top: number; bottom: number; left: number; width: number },
  nombre: { width: number; height: number },
  ventana: { width: number; height: number },
): PosicionDelNombre {
  const abajo = boton.bottom + DISTANCIA;
  const arriba = boton.top - DISTANCIA - nombre.height;
  const lado = abajo + nombre.height <= ventana.height || arriba < 0 ? 'abajo' : 'arriba';
  const centro = boton.left + boton.width / 2;
  const left = Math.max(MARGEN, Math.min(centro - nombre.width / 2, ventana.width - nombre.width - MARGEN));
  const flecha = Math.max(BORDE_DE_LA_FLECHA, Math.min(centro - left, nombre.width - BORDE_DE_LA_FLECHA));
  return { top: lado === 'abajo' ? abajo : arriba, left, lado, flecha };
}

/** Oculta el nombre que se esté viendo: nunca hay dos a la vez (puntero sobre un botón y foco en otro). */
let ocultarElVisible: (() => void) | null = null;

type PropsDelBoton = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: string };

export interface NombreEmergenteProps {
  /** El nombre del botón o el motivo por el que está deshabilitado. Sin texto, no hay nombre emergente. */
  texto?: string;
  /** Un `button` o un `Boton`. En `variante="icono"` sin `aria-label`, el texto pasa a ser su nombre accesible. */
  children: ReactElement<PropsDelBoton>;
}

export function NombreEmergente({ texto, children }: NombreEmergenteProps) {
  const id = useId();
  const [ancla, setAncla] = useState<Element | null>(null);
  const [posicion, setPosicion] = useState<PosicionDelNombre | null>(null);
  const caja = useRef<HTMLDivElement>(null);
  const espera = useRef<number | undefined>(undefined);

  const ocultar = useCallback(() => {
    window.clearTimeout(espera.current);
    setAncla(null);
  }, []);

  const mostrar = (boton: Element) => {
    window.clearTimeout(espera.current);
    if (ocultarElVisible !== ocultar) ocultarElVisible?.();
    ocultarElVisible = ocultar;
    setAncla(boton);
  };

  useEffect(
    () => () => {
      window.clearTimeout(espera.current);
      if (ocultarElVisible === ocultar) ocultarElVisible = null;
    },
    [ocultar],
  );

  const props = children.props;
  const esSuNombre = props.variante === 'icono' && !props['aria-label'];
  // El texto agrega algo si no está en el nombre accesible: un motivo, o «Elegir un día» en un botón con la fecha.
  // Solo entonces es un `tooltip` y describe al botón; si repite el nombre, un lector de pantalla no lo oye dos veces.
  const agrega = texto !== undefined && !esSuNombre && !props['aria-label']?.includes(texto);
  // Con `aria-describedby` propio, la descripción ya la da quien usa el botón. Si no, queda siempre en el documento
  // (oculta) para que un botón deshabilitado, que no recibe el foco, no la pierda.
  const describe = agrega && !props['aria-describedby'];
  const visible = ancla !== null && texto !== undefined;

  const ubicar = useCallback(() => {
    const nombre = caja.current;
    if (!ancla || !nombre) return;
    setPosicion(
      posicionDelNombre(
        ancla.getBoundingClientRect(),
        { width: nombre.offsetWidth, height: nombre.offsetHeight },
        {
          width: document.documentElement.clientWidth || window.innerWidth,
          height: document.documentElement.clientHeight || window.innerHeight,
        },
      ),
    );
  }, [ancla]);

  useLayoutEffect(ubicar, [ubicar, texto]);

  useEffect(() => {
    if (!visible) return;
    // Esc oculta el nombre sin consumir la tecla: la ventana, el menú o el panel que se cierran con Esc la reciben
    // igual. DUDA: P44 si el primer Esc solo debe cerrar el nombre (docs/DUDAS.md).
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ocultar();
    };
    window.addEventListener('keydown', alTeclear, true);
    window.addEventListener('resize', ubicar);
    window.addEventListener('scroll', ubicar, true);
    return () => {
      window.removeEventListener('keydown', alTeclear, true);
      window.removeEventListener('resize', ubicar);
      window.removeEventListener('scroll', ubicar, true);
    };
  }, [visible, ocultar, ubicar]);

  const boton = cloneElement(children, {
    'aria-label': esSuNombre ? texto : props['aria-label'],
    'aria-describedby': describe ? id : props['aria-describedby'],
    onPointerEnter: (e) => {
      props.onPointerEnter?.(e);
      window.clearTimeout(espera.current);
      const objetivo = e.currentTarget;
      espera.current = window.setTimeout(() => mostrar(objetivo), RETRASO_DEL_NOMBRE_MS);
    },
    onPointerLeave: (e) => {
      props.onPointerLeave?.(e);
      ocultar();
    },
    onPointerDown: (e) => {
      props.onPointerDown?.(e);
      ocultar();
    },
    onClick: (e) => {
      ocultar();
      props.onClick?.(e);
    },
    // El foco que deja el puntero al seleccionar no cuenta: solo el que el navegador marca como visible.
    onFocus: (e) => {
      props.onFocus?.(e);
      if (e.currentTarget.matches(':focus-visible')) mostrar(e.currentTarget);
    },
    onBlur: (e) => {
      props.onBlur?.(e);
      ocultar();
    },
  } satisfies ButtonHTMLAttributes<HTMLButtonElement>);

  return (
    <>
      {boton}
      {texto !== undefined &&
        (visible || describe) &&
        createPortal(
          <div
            ref={caja}
            id={id}
            role={agrega ? 'tooltip' : undefined}
            aria-hidden={agrega ? undefined : true}
            hidden={!visible}
            className="wg-nombre-emergente"
            data-lado={posicion?.lado}
            style={
              posicion
                ? ({
                    top: posicion.top,
                    left: posicion.left,
                    '--wg-flecha': `${posicion.flecha}px`,
                  } as CSSProperties)
                : { visibility: 'hidden' }
            }
          >
            {texto}
          </div>,
          // En las pantallas de cuenta los colores salen de `data-modo` (RD-04): el nombre se dibuja dentro.
          (visible && ancla.closest('[data-modo]')) || document.body,
        )}
    </>
  );
}
