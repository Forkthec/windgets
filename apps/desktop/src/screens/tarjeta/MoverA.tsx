import type { Column } from '@/types';
import { MenuDeAcciones } from '@/ui/MenuDeAcciones/MenuDeAcciones';
import type { OpcionDeMenu } from '@/ui/MenuDeAcciones/MenuDeAcciones';

// «Mover a» (HE-09-HU02-ET10, ET11): la alternativa sin drag-and-drop para cambiar una tarjeta de columna.
// Muestra todas las columnas del tablero en su orden, con la columna actual marcada y deshabilitada (RT-04).
// Usa el menú de acciones común (RT-02-ET11, ET12): Esc, selección fuera, flechas y sin recorte.

/** Las columnas como opciones de «Mover a»: la actual, marcada y deshabilitada. */
export function opcionesDeMoverA(
  columnas: readonly Column[],
  actual: string,
  alElegir: (columna: string) => void,
): OpcionDeMenu[] {
  return columnas.map((c) => ({
    etiqueta: c.name,
    marcada: c.id === actual,
    deshabilitada: c.id === actual,
    // ET12: la tarjeta va al final de la columna elegida.
    alElegir: () => alElegir(c.id),
  }));
}

export interface MoverAProps {
  columnas: readonly Column[];
  /** Columna en la que está la tarjeta. */
  actual: string;
  /** Columna elegida: la tarjeta va al final de ella (ET12). */
  alElegir: (columna: string) => void;
  /** Menú dentro del widget de la capa (ver `MenuDeAcciones`). */
  enLugar?: boolean;
}

export function MoverA({ columnas, actual, alElegir, enLugar = false }: MoverAProps) {
  return (
    <MenuDeAcciones
      nombre="Mover a"
      etiqueta="Mover a"
      boton="Mover a"
      className="wg-mover-a"
      enLugar={enLugar}
      opciones={opcionesDeMoverA(columnas, actual, alElegir)}
    />
  );
}
