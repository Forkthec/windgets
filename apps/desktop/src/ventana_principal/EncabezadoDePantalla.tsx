import type { ScreenId } from '@/types';
import { IndicadorSincronizacion } from './IndicadorSincronizacion';
import { MIGA_DE_PANTALLA, TITULO_DE_PANTALLA } from './textosDelMarco';

// El encabezado de cada pantalla con sesión (rediseno_final_prototipos.md §4.2; docs/rediseno.md RD-66, que
// reemplaza el selector «Apariencia» de RD-29 y la sección de RD-32): la miga de pan en 13 px con el bloque del menú
// y la opción («Planificador › Tablero Kanban»; «Configuración», A-04), debajo el título en 26 px y el indicador de
// sincronización a la derecha. Con sesión no hay selector Claro/Oscuro (D-01).

export interface EncabezadoDePantallaProps {
  pantalla: ScreenId;
}

export function EncabezadoDePantalla({ pantalla }: EncabezadoDePantallaProps) {
  return (
    <header className="wg-encabezado-pantalla">
      <p className="wg-encabezado-pantalla__seccion">{MIGA_DE_PANTALLA[pantalla]}</p>
      <h1 className="wg-encabezado-pantalla__titulo">{TITULO_DE_PANTALLA[pantalla]}</h1>
      <div className="wg-encabezado-pantalla__derecha">
        <IndicadorSincronizacion />
      </div>
    </header>
  );
}
