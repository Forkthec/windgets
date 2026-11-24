import type { ReactNode } from 'react';
import type { ScreenId } from '@/types';
import { IconoDelMenu, TRAZO_DEL_MENU } from './IconosDelMenu';

// Menú lateral (rediseno_final_prototipos.md §2.2 y §4.1; rediseno_final_backend.md §4.2; docs/rediseno.md RD-65,
// que reemplaza RD-30): dos bloques con su título, «Planificador» y «Personalización», y Configuración al pie.
// Etiquetas va al final del bloque Planificador.
export type BloqueDelMenu = 'planificador' | 'personalizacion' | 'pie';

export const TITULO_DEL_BLOQUE: Record<Exclude<BloqueDelMenu, 'pie'>, string> = {
  planificador: 'Planificador',
  personalizacion: 'Personalización',
};

// DUDA: rediseno_final D-07 y D-21 · «Agente de IA» sale del menú cuando Windi viva en su panel flotante (§5.5), y
// Wallpaper, Temas y Widgets se vuelven una sola entrada «Personalización» con la pantalla por pasos (§5.12). Hasta
// esos pasos siguen aquí para no dejar pantallas sin entrada.
export const OPCIONES_MENU: ReadonlyArray<{ pantalla: ScreenId; texto: string; bloque: BloqueDelMenu }> = [
  { pantalla: 'planner_daily', texto: 'Planificador diario', bloque: 'planificador' },
  { pantalla: 'kanban', texto: 'Tablero Kanban', bloque: 'planificador' },
  { pantalla: 'calendar', texto: 'Calendario', bloque: 'planificador' },
  { pantalla: 'agenda', texto: 'Agenda diaria', bloque: 'planificador' },
  { pantalla: 'reports', texto: 'Reportes', bloque: 'planificador' },
  { pantalla: 'labels', texto: 'Etiquetas', bloque: 'planificador' },
  { pantalla: 'windi', texto: 'Agente de IA', bloque: 'planificador' },
  { pantalla: 'personalization', texto: 'Wallpaper', bloque: 'personalizacion' },
  { pantalla: 'themes', texto: 'Temas', bloque: 'personalizacion' },
  { pantalla: 'widgets', texto: 'Widgets', bloque: 'personalizacion' },
  { pantalla: 'settings', texto: 'Configuración', bloque: 'pie' },
];

export interface MenuPrincipalProps {
  actual: ScreenId;
  alElegir: (pantalla: ScreenId) => void;
  /** D-25: contraído, solo los íconos (con su nombre accesible y su texto al pasar el mouse). */
  contraido?: boolean;
  /** Lo que va al pie después de Configuración (el ícono «Cerrar sesión»). */
  pie?: ReactNode;
}

function Opcion({
  pantalla,
  texto,
  actual,
  contraido,
  alElegir,
}: {
  pantalla: ScreenId;
  texto: string;
  actual: ScreenId;
  contraido: boolean;
  alElegir: (pantalla: ScreenId) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="wg-boton wg-menu__opcion"
        aria-current={pantalla === actual ? 'page' : undefined}
        aria-label={contraido ? texto : undefined}
        title={contraido ? texto : undefined}
        onClick={() => alElegir(pantalla)}
      >
        <IconoDelMenu trazo={TRAZO_DEL_MENU[pantalla]} />
        {!contraido && texto}
      </button>
    </li>
  );
}

// Marca la opción de la pantalla actual y solo esa (RT-01).
export function MenuPrincipal({ actual, alElegir, contraido = false, pie }: MenuPrincipalProps) {
  const bloques = ['planificador', 'personalizacion'] as const;
  return (
    <nav aria-label="Menú principal" className="wg-menu__navegacion">
      {bloques.map((bloque) => (
        <section key={bloque} className="wg-menu__bloque" aria-label={TITULO_DEL_BLOQUE[bloque]}>
          {/* El nombre del bloque ya lo da `aria-label`; el título visible no es un encabezado de la pantalla. */}
          {!contraido && (
            <p className="wg-menu__titulo-bloque" aria-hidden="true">
              {TITULO_DEL_BLOQUE[bloque]}
            </p>
          )}
          <ul className="wg-menu__lista">
            {OPCIONES_MENU.filter((o) => o.bloque === bloque).map((o) => (
              <Opcion key={o.pantalla} {...o} actual={actual} contraido={contraido} alElegir={alElegir} />
            ))}
          </ul>
        </section>
      ))}
      <ul className="wg-menu__lista wg-menu__pie">
        {OPCIONES_MENU.filter((o) => o.bloque === 'pie').map((o) => (
          <Opcion key={o.pantalla} {...o} actual={actual} contraido={contraido} alElegir={alElegir} />
        ))}
        {pie && <li>{pie}</li>}
      </ul>
    </nav>
  );
}
