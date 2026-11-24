import type { ScreenId } from '@/types';

// Íconos del menú principal (docs/rediseno.md RD-30, RD-31): los trazos exportados del Figma «Windgets (Copy)»,
// 18 × 18 con trazo de 1,44 px, en el color del texto (`currentColor`) para que sigan el modo.

/** El trazo de cada opción del menú, con el nodo del Figma de donde sale. */
export const TRAZO_DEL_MENU: Record<ScreenId, string> = {
  // Figma 85:307 «Icono · Planificador diario»
  planner_daily: 'M5.4 8.1L7.2 10.8L11.7 5.4M2.7 2.7H15.3V15.3H2.7V2.7Z',
  // Figma 85:309 «Icono · Tablero Kanban»
  kanban: 'M6.3 2.7V15.3M10.8 2.7V15.3M1.8 2.7H16.2V15.3H1.8V2.7Z',
  // Figma 85:311 «Icono · Calendario»
  calendar: 'M1.8 7.2H16.2M1.8 4.5H16.2V15.3H1.8V4.5Z',
  // Figma 85:313 «Icono · Agenda diaria»
  agenda:
    'M9 1.8C7.09438 1.81191 5.2712 2.5788 3.93002 3.93261C2.58885 5.28642 1.83908 7.11671 1.84504 9.02236C1.85099 10.928 2.61218 12.7536 3.96179 14.099C5.3114 15.4444 7.13934 16.1999 9.045 16.1999C10.9507 16.1999 12.7786 15.4444 14.1282 14.099C15.4778 12.7536 16.239 10.928 16.245 9.02236C16.2509 7.11671 15.5012 5.28642 14.16 3.93261C12.8188 2.5788 10.9956 1.81191 9.09 1.8M9 4.5V9L12.6 10.8',
  // Figma 85:315 «Icono · Reportes»
  reports: 'M2.7 15.3V8.1M8.1 15.3V4.5M13.5 15.3V1.8',
  // Figma 85:317 «Icono · Etiquetas»
  labels: 'M1.8 2.7H9L16.2 9.9L9.9 16.2L1.8 8.1V2.7Z',
  // Figma 85:319 «Icono · Agente de IA»
  windi: 'M1.8 2.7H16.2V12.6H8.1L3.6 16.2V12.6H1.8V2.7Z',
  // Figma 85:321 «Icono · Wallpaper»
  personalization: 'M2.7 12.6L8.1 6.3L13.5 12.6M1.8 2.7H16.2V15.3H1.8V2.7Z',
  // Figma 85:323 «Icono · Temas»
  themes: 'M1.8 10.8L9 15.3L16.2 10.8M9 1.8L16.2 6.3L9 10.8L1.8 6.3L9 1.8Z',
  // Figma 85:325 «Icono · Widgets»
  widgets:
    'M1.8 1.8H7.2V7.2H1.8V1.8ZM10.8 1.8H16.2V7.2H10.8V1.8ZM1.8 10.8H7.2V16.2H1.8V10.8ZM10.8 10.8H16.2V16.2H10.8V10.8Z',
  // Figma 85:327 «Icono · Configuración»
  settings: 'M1.8 4.5H16.2M1.8 12.6H16.2M5.4 1.8V7.2M11.7 9.9V15.3',
};

/** Figma 85:330 «Contraer» (Ocultar menú) y 85:401 «Abrir» (Ampliar menú). */
export const TRAZO_CONTRAER = 'M6.3 2.7V15.3M11.7 5.4L9 9L11.7 12.6M2.7 2.7H15.3V15.3H2.7V2.7Z';
export const TRAZO_ABRIR = 'M1.8 3.6H16.2M1.8 9H16.2M1.8 14.4H16.2';
/** rediseno_final_prototipos.md §3.6: «Cerrar sesión», ícono de salida al pie del menú. */
export const TRAZO_CERRAR_SESION = 'M7.2 2.7H2.7V15.3H7.2M11.7 5.4L15.3 9L11.7 12.6M15.3 9H6.3';

export function IconoDelMenu({ trazo, className = 'wg-menu__icono' }: { trazo: string; className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d={trazo} stroke="currentColor" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
