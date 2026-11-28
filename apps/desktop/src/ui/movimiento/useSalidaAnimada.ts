import { useEffect, useState, type RefObject } from 'react';

// Entradas y salidas con desmontaje (docs/implementacion/ANIMACIONES.md §4, regla 13; pieza AN-01). Lo que entra se
// monta con su estado base oculto y recibe la clase `--abierta` en el fotograma siguiente; lo que sale pierde
// `--abierta`, recibe `--saliendo` y sigue montado hasta `transitionend` o un seguro: la duración calculada
// (`getComputedStyle`) + retraso + 50 ms. En jsdom no hay `transitionend`: corre el seguro. Con «reducir movimiento»
// la duración ya es la del fundido de 100 ms (TK-06). Mientras sale, el elemento queda `inert` y fuera del árbol
// accesible. Los callbacks (cerrar, la acción elegida, devolver el foco) no esperan a la salida.

export type EstadoDeSalida = 'entrando' | 'abierta' | 'saliendo';

/** Margen del seguro sobre la duración de la salida (regla 13). */
export const SEGURO_DE_SALIDA = 50;

const milisegundos = (valor: string): number[] =>
  valor.split(',').map((t) => {
    const n = Number.parseFloat(t);
    if (Number.isNaN(n)) return 0;
    return t.trim().endsWith('ms') ? n : n * 1000;
  });

/** La transición más larga del elemento (duración + retraso), en ms. */
export function duracionDeLaTransicion(el: Element | null): number {
  if (!el || typeof getComputedStyle === 'undefined') return 0;
  const estilo = getComputedStyle(el);
  const duraciones = milisegundos(estilo.transitionDuration || '0s');
  const retrasos = milisegundos(estilo.transitionDelay || '0s');
  return Math.max(0, ...duraciones.map((d, i) => d + (retrasos[i % retrasos.length] ?? 0)));
}

/** Corre `hacer` en el fotograma siguiente; devuelve cómo cancelarlo. */
function enElSiguienteFotograma(hacer: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(hacer);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(hacer, 16);
  return () => clearTimeout(id);
}

/**
 * Espera el fin de la transición de `el` (su `transitionend` o el seguro) y llama a `terminar` una sola vez.
 * Devuelve cómo dejar de esperar.
 */
export function esperarTransicion(el: Element | null, terminar: () => void): () => void {
  let hecho = false;
  const fin = () => {
    if (hecho) return;
    hecho = true;
    terminar();
  };
  const alTerminar = (e: Event) => {
    if (e.target === el) fin();
  };
  el?.addEventListener('transitionend', alTerminar);
  const seguro = setTimeout(fin, duracionDeLaTransicion(el) + SEGURO_DE_SALIDA);
  return () => {
    el?.removeEventListener('transitionend', alTerminar);
    clearTimeout(seguro);
  };
}

/**
 * Lo que se monta con su componente y no tiene salida propia (la ventana emergente): `true` desde el fotograma
 * siguiente al montaje. El estilo base ya se calculó al leer el tamaño, así la transición corre.
 */
export function useEntradaAnimada(ref: RefObject<HTMLElement | null>): boolean {
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
    void ref.current?.offsetWidth;
    return enElSiguienteFotograma(() => setAbierta(true));
  }, [ref]);
  return abierta;
}

/**
 * Lo que abre y cierra un mismo componente (menús, selector de fecha flotante). `montado`: si se dibuja; `estado`:
 * `entrando` (base oculta), `abierta` o `saliendo`. Si se vuelve a abrir mientras sale, cancela la salida.
 */
export function useSalidaAnimada(
  abierto: boolean,
  ref: RefObject<HTMLElement | null>,
): { montado: boolean; estado: EstadoDeSalida } {
  const [montado, setMontado] = useState(abierto);
  const [estado, setEstado] = useState<EstadoDeSalida>('entrando');
  const [previo, setPrevio] = useState(abierto);
  if (previo !== abierto) {
    setPrevio(abierto);
    if (abierto) {
      setEstado(montado ? 'abierta' : 'entrando');
      setMontado(true);
    } else if (montado) setEstado('saliendo');
  }

  useEffect(() => {
    if (!montado || estado !== 'entrando') return undefined;
    void ref.current?.offsetWidth;
    return enElSiguienteFotograma(() => setEstado('abierta'));
  }, [montado, estado, ref]);

  // Mientras sale, inerte (regla 13); si se vuelve a abrir, deja de serlo.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (estado === 'saliendo') el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }, [estado, montado, ref]);

  useEffect(() => {
    if (estado !== 'saliendo') return undefined;
    return esperarTransicion(ref.current, () => {
      setMontado(false);
      setEstado('entrando');
    });
  }, [estado, ref]);

  return { montado, estado };
}

/** Atributo de las copias que salen: el fondo inerte de una ventana nueva no las cuenta. */
export const ATRIBUTO_DE_SALIDA = 'data-saliendo';

const copias = new Set<HTMLElement>();

/**
 * Salida de lo que su padre desmonta en el acto (la ventana emergente, A-02): una copia del elemento queda en su
 * lugar, inerte y fuera del árbol accesible, sin `id` repetidos ni roles, con las clases de salida, y se quita al terminar la
 * transición de `objetivo` (el selector de la parte que más dura). Se llama antes de que React quite el original.
 */
export function salirConCopia(
  original: HTMLElement | null,
  clases: { selector: string; abierta: string; saliendo: string }[],
  objetivo: string,
): void {
  if (!original?.parentNode) return;
  const copia = original.cloneNode(true) as HTMLElement;
  // Sin `id`, `role` ni `aria-modal`: nada la confunde con la ventana viva (p. ej. el Esc del panel de Windi, que no
  // cierra si hay un `[role="dialog"]`).
  for (const el of [copia, ...Array.from(copia.querySelectorAll('[id], [role], [aria-modal]'))]) {
    el.removeAttribute('id');
    el.removeAttribute('role');
    el.removeAttribute('aria-modal');
  }
  copia.setAttribute('aria-hidden', 'true');
  copia.setAttribute('inert', '');
  copia.setAttribute(ATRIBUTO_DE_SALIDA, '');
  original.parentNode.insertBefore(copia, original.nextSibling);
  // El estilo de partida es el de abierta; con él calculado, el cambio de clase corre la transición.
  void copia.offsetWidth;
  for (const { selector, abierta, saliendo } of clases)
    for (const el of [copia, ...Array.from(copia.querySelectorAll(selector))])
      if (el.matches(selector)) {
        el.classList.remove(abierta);
        el.classList.add(saliendo);
      }
  copias.add(copia);
  const quitar = () => {
    copias.delete(copia);
    copia.remove();
  };
  esperarTransicion(copia.matches(objetivo) ? copia : copia.querySelector(objetivo), quitar);
}

/** Una ventana que vuelve a abrir cancela las salidas en curso (A-02). */
export function cancelarSalidas(): void {
  for (const copia of copias) copia.remove();
  copias.clear();
}
