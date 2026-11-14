import { useCallback, useState } from 'react';
import { Boton } from '@/ui/Boton/Boton';
import { MigaDePan, type NivelDeMiga } from '@/ui/MigaDePan/MigaDePan';

// RT-03 (miga de pan y Regresar). Rutas definidas (RT-03-ET02): «Inicio de sesión > Recuperar contraseña»,
// con los pasos Correo electrónico, Diligenciar código y Nueva contraseña, y «Widgets > Agregar widget >
// <widget>». Registro tiene «Regresar» pero no miga de pan (RT-03-ET08, D-173).

export interface EncabezadoDeRutaProps {
  /** Niveles de la miga de pan; sin niveles solo se muestra «Regresar» (Registro). */
  niveles?: readonly NivelDeMiga[];
  /** Vuelve a la pantalla, subpantalla o paso inmediatamente anterior sin completar la acción (ET05). */
  alRegresar: () => void;
}

/** Parte superior de una pantalla con ruta: la miga de pan y la opción «Regresar» (RT-03-ET01, ET03). */
export function EncabezadoDeRuta({ niveles, alRegresar }: EncabezadoDeRutaProps) {
  return (
    <header className="wg-fila wg-encabezado-ruta">
      {niveles && niveles.length > 0 && <MigaDePan niveles={niveles} />}
      <Boton onClick={alRegresar}>Regresar</Boton>
    </header>
  );
}

/**
 * Posición dentro de una ruta: una lista de pantallas, subpantallas o pasos en orden. `regresar` va a la
 * anterior; `ir` lleva a cualquier punto anterior (la miga de pan); ninguna de las dos completa la acción.
 * `recorrido` son las posiciones de partida, de la primera a la actual (por ejemplo, al abrir una subpantalla
 * desde otra pantalla).
 */
export function useRuta<P>(...recorrido: readonly [P, ...P[]]) {
  const [inicio] = recorrido;
  const [posiciones, setPosiciones] = useState<readonly P[]>(recorrido);
  const avanzar = useCallback((siguiente: P) => setPosiciones((p) => [...p, siguiente]), []);
  const regresar = useCallback(() => setPosiciones((p) => (p.length > 1 ? p.slice(0, -1) : p)), []);
  const ir = useCallback(
    (destino: P) =>
      setPosiciones((p) => {
        const indice = p.lastIndexOf(destino);
        return indice >= 0 ? p.slice(0, indice + 1) : p;
      }),
    [],
  );
  const actual = posiciones[posiciones.length - 1] ?? inicio;
  return { actual, avanzar, regresar, ir, posiciones };
}
