import type { Page } from '@playwright/test';
import type { Fila } from './arnes';

// F6-03 · Registro de pantallas que recorre el guion de comparación (e2e/comparacion.spec.ts). Cada pieza de la
// fase 7 que pone los `data-testid` de una pantalla agrega aquí su entrada con las filas de la tabla «capa del Figma
// → data-testid» de su spec, y la misma lista la usa en su prueba de geometría.

export type TemaDePrueba = 'claro' | 'oscuro' | 'rosa' | 'enfoque';

export interface Pantalla {
  /** Id claro de la familia en TRAZABILIDAD.md (`204:3109`). */
  familia: string;
  nombre: string;
  /** Lleva la página a la pantalla con los datos de ejemplo del marco, en ese tema. */
  preparar: (page: Page, tema: TemaDePrueba) => Promise<void>;
  /** Temas en los que existe el marco (los demás son «n/a» en TRAZABILIDAD.md). */
  temas: TemaDePrueba[];
  filas: Fila[];
}

export const PANTALLAS: Pantalla[] = [];
