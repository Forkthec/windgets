import { useCallback, useId, useMemo, useState } from 'react';
import type { AppError } from '@/types';

// Reglas de formularios de RT-04 (mensajes, opciones deshabilitadas y alineación). Los textos y los límites de
// cada campo los define la HU de su formulario (RT-04-ET08); aquí solo está el comportamiento común.

/** Un campo vacío o con solo espacios (RT-04-ET21). */
export function estaVacio(valor: string): boolean {
  return valor.trim() === '';
}

/** Devuelve el mensaje de campo, o `undefined` si el valor es válido. */
export type Validador = (valor: string) => string | undefined;

export interface MensajesDeCampo<C extends string> {
  /** Mensaje de campo de cada campo con error (va en `CampoTexto.mensaje`). */
  mensajes: Partial<Record<C, string>>;
  /** `id` de cada campo, para llevar el cursor al primero con error (RT-04-ET06). */
  ids: Record<C, string>;
  /** Valida todos los campos a la vez; si hay errores, los muestra todos y enfoca el primero. */
  validarTodo: (valores: Record<C, string>) => boolean;
  /** Al cambiar un campo con mensaje, lo vuelve a validar y lo quita si ya es válido (RT-04-ET07). */
  alCorregir: (campo: C, valor: string) => void;
  /** Muestra los errores de campo que devolvió el Núcleo (`AppError.field`), todos a la vez. */
  mostrarDelNucleo: (errores: readonly AppError[]) => void;
}

/**
 * Mensajes de campo de un formulario (RT-04-ET05 a ET07). `orden` es el orden de los campos en pantalla:
 * el cursor va al primero de esa lista que tenga error.
 */
export function useMensajesDeCampo<C extends string>(
  orden: readonly C[],
  validadores: Partial<Record<C, Validador>>,
): MensajesDeCampo<C> {
  const prefijo = useId();
  const [mensajes, setMensajes] = useState<Partial<Record<C, string>>>({});

  const ids = useMemo(
    () => Object.fromEntries(orden.map((campo) => [campo, `${prefijo}-${campo}`])) as Record<C, string>,
    [orden, prefijo],
  );

  const enfocarPrimero = useCallback(
    (conError: Partial<Record<C, string>>) => {
      const primero = orden.find((campo) => conError[campo]);
      if (primero) document.getElementById(ids[primero])?.focus();
    },
    [ids, orden],
  );

  const validarTodo = useCallback(
    (valores: Record<C, string>) => {
      const nuevos: Partial<Record<C, string>> = {};
      for (const campo of orden) {
        const mensaje = validadores[campo]?.(valores[campo]);
        if (mensaje) nuevos[campo] = mensaje;
      }
      setMensajes(nuevos);
      enfocarPrimero(nuevos);
      return Object.keys(nuevos).length === 0;
    },
    [enfocarPrimero, orden, validadores],
  );

  const alCorregir = useCallback(
    (campo: C, valor: string) => {
      const mensaje = validadores[campo]?.(valor);
      setMensajes((actuales) => {
        if (!actuales[campo]) return actuales;
        if (mensaje) return { ...actuales, [campo]: mensaje };
        return Object.fromEntries(Object.entries(actuales).filter(([c]) => c !== campo)) as Partial<
          Record<C, string>
        >;
      });
    },
    [validadores],
  );

  const mostrarDelNucleo = useCallback(
    (errores: readonly AppError[]) => {
      const nuevos: Partial<Record<C, string>> = {};
      for (const error of errores) {
        const campo = orden.find((c) => c === error.field);
        if (campo && !nuevos[campo]) nuevos[campo] = error.message;
      }
      setMensajes(nuevos);
      enfocarPrimero(nuevos);
    },
    [enfocarPrimero, orden],
  );

  return { mensajes, ids, validarTodo, alCorregir, mostrarDelNucleo };
}
