import type { ScreenId } from '@/types';
import { IconoDelMenu, TRAZO_DEL_MENU } from './IconosDelMenu';

// Opciones en orden, con su texto literal. docs/rediseno.md RD-30 (Figma 81:3 «Menú»): una sola lista, sin títulos de
// sección, con «Wallpaper» y Etiquetas antes de Agente de IA. Reemplaza el orden y las secciones de interfaz.md
// («Inventario · 2. Menú principal»).
export const OPCIONES_MENU: ReadonlyArray<{ pantalla: ScreenId; texto: string }> = [
  { pantalla: 'planner_daily', texto: 'Planificador diario' },
  { pantalla: 'kanban', texto: 'Tablero Kanban' },
  { pantalla: 'calendar', texto: 'Calendario' },
  { pantalla: 'agenda', texto: 'Agenda diaria' },
  { pantalla: 'reports', texto: 'Reportes' },
  { pantalla: 'labels', texto: 'Etiquetas' },
  { pantalla: 'windi', texto: 'Agente de IA' },
  { pantalla: 'personalization', texto: 'Wallpaper' },
  { pantalla: 'themes', texto: 'Temas' },
  { pantalla: 'widgets', texto: 'Widgets' },
  { pantalla: 'settings', texto: 'Configuración' },
];

export interface MenuPrincipalProps {
  actual: ScreenId;
  alElegir: (pantalla: ScreenId) => void;
}

// Marca la opción de la pantalla actual y solo esa (RT-01).
export function MenuPrincipal({ actual, alElegir }: MenuPrincipalProps) {
  return (
    <nav aria-label="Menú principal">
      <ul className="wg-menu__lista">
        {OPCIONES_MENU.map((o) => (
          <li key={o.pantalla}>
            <button
              type="button"
              className="wg-boton wg-menu__opcion"
              aria-current={o.pantalla === actual ? 'page' : undefined}
              onClick={() => alElegir(o.pantalla)}
            >
              <IconoDelMenu trazo={TRAZO_DEL_MENU[o.pantalla]} />
              {o.texto}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
