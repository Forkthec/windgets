import type { ScreenId } from '@/types';
import { OPCIONES_MENU } from '@/ui/MenuPrincipal/MenuPrincipal';

// Textos del marco de la ventana principal con sesión (docs/rediseno.md RD-31, RD-32): literales del Figma.

/** RD-32 y RD-66: el bloque del menú de cada pantalla («Configuración» reemplaza «Preferencias», A-04). */
export const SECCION_DE_PANTALLA: Record<ScreenId, string> = {
  planner_daily: 'Planificador',
  kanban: 'Planificador',
  calendar: 'Planificador',
  agenda: 'Planificador',
  reports: 'Planificador',
  labels: 'Planificador',
  windi: 'Planificador',
  personalization: 'Personalización',
  themes: 'Personalización',
  widgets: 'Personalización',
  settings: 'Configuración',
};

const TEXTO_DEL_MENU = Object.fromEntries(OPCIONES_MENU.map((o) => [o.pantalla, o.texto])) as Record<
  ScreenId,
  string
>;

/** RD-32: el título es el texto de la opción del menú, salvo «Windi» (76:23) y «Personalización del wallpaper». */
export const TITULO_DE_PANTALLA: Record<ScreenId, string> = {
  ...TEXTO_DEL_MENU,
  windi: 'Windi',
  personalization: 'Personalización del wallpaper',
};

/**
 * RD-66 (rediseno_final_prototipos.md §2.2): la miga de pan del encabezado, «<bloque> › <opción del menú>»;
 * Configuración es su propio nivel (A-04).
 */
export const MIGA_DE_PANTALLA = Object.fromEntries(
  OPCIONES_MENU.map((o) => [
    o.pantalla,
    o.pantalla === 'settings' ? 'Configuración' : `${SECCION_DE_PANTALLA[o.pantalla]} › ${o.texto}`,
  ]),
) as Record<ScreenId, string>;

/** RD-31: nombres de las capas 85:329 y 85:400. */
export const OCULTAR_MENU = 'Ocultar menú';
export const AMPLIAR_MENU = 'Ampliar menú';
