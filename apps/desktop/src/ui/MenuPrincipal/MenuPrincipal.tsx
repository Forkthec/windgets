import type { ScreenId } from '@/types';

// Secciones y opciones en orden, con su texto literal (interfaz.md, «Inventario · 2. Menú principal»).
export const SECCIONES_MENU: ReadonlyArray<{
  seccion: string;
  opciones: ReadonlyArray<{ pantalla: ScreenId; texto: string }>;
}> = [
  {
    seccion: 'Planificador',
    opciones: [
      { pantalla: 'planner_daily', texto: 'Planificador diario' },
      { pantalla: 'kanban', texto: 'Tablero Kanban' },
      { pantalla: 'calendar', texto: 'Calendario' },
      { pantalla: 'agenda', texto: 'Agenda diaria' },
      { pantalla: 'reports', texto: 'Reportes' },
      { pantalla: 'windi', texto: 'Agente de IA' },
      { pantalla: 'labels', texto: 'Etiquetas' },
    ],
  },
  {
    seccion: 'Personalización',
    opciones: [
      { pantalla: 'personalization', texto: 'Personalización del wallpaper' },
      { pantalla: 'themes', texto: 'Temas' },
      { pantalla: 'widgets', texto: 'Widgets' },
    ],
  },
  { seccion: 'Configuración', opciones: [{ pantalla: 'settings', texto: 'Configuración' }] },
];

export interface MenuPrincipalProps {
  actual: ScreenId;
  alElegir: (pantalla: ScreenId) => void;
}

// Marca la opción de la pantalla actual y solo esa (RT-01).
export function MenuPrincipal({ actual, alElegir }: MenuPrincipalProps) {
  return (
    <nav className="wg-menu" aria-label="Menú principal">
      {SECCIONES_MENU.map(({ seccion, opciones }) => (
        <section key={seccion}>
          <h2 className="wg-menu__seccion">{seccion}</h2>
          {opciones.map((o) => (
            <button
              key={o.pantalla}
              type="button"
              className="wg-boton wg-menu__opcion"
              aria-current={o.pantalla === actual ? 'page' : undefined}
              onClick={() => alElegir(o.pantalla)}
            >
              {o.texto}
            </button>
          ))}
        </section>
      ))}
    </nav>
  );
}
